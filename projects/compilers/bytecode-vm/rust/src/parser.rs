//! The parser: tokens to tree. A port of the TypeScript parser of MP-COMP-1.

use crate::ast::{BinaryOp, Expr, Literal, Stmt, UnaryOp};
use crate::lexer::{SyntaxError, Token, TokenKind, tokenize};

const UNARY_POWER: u8 = 8;

// EN: The precedence table of the language, identical to the one in MP-COMP-1: a higher number
//     binds tighter. Keeping the same numbers in both parsers is what guarantees that both build
//     the same tree for the same text.
// PT: A tabela de precedência da linguagem, idêntica à do MP-COMP-1: um número maior liga mais
//     forte. Manter os mesmos números nos dois parsers é o que garante que os dois constroem a
//     mesma árvore para o mesmo texto.
// ES: La tabla de precedencia del lenguaje, idéntica a la del MP-COMP-1: un número mayor enlaza
//     más fuerte. Mantener los mismos números en los dos parsers es lo que garantiza que ambos
//     construyan el mismo árbol para el mismo texto.
fn binding_power(kind: TokenKind) -> Option<u8> {
    Some(match kind {
        TokenKind::Equal => 1,
        TokenKind::Or => 2,
        TokenKind::And => 3,
        TokenKind::EqualEqual | TokenKind::BangEqual => 4,
        TokenKind::Less | TokenKind::LessEqual | TokenKind::Greater | TokenKind::GreaterEqual => 5,
        TokenKind::Plus | TokenKind::Minus => 6,
        TokenKind::Star | TokenKind::Slash | TokenKind::Percent => 7,
        TokenKind::LeftParen => 9,
        _ => return None,
    })
}

fn binary_op(kind: TokenKind) -> Option<BinaryOp> {
    Some(match kind {
        TokenKind::Plus => BinaryOp::Add,
        TokenKind::Minus => BinaryOp::Subtract,
        TokenKind::Star => BinaryOp::Multiply,
        TokenKind::Slash => BinaryOp::Divide,
        TokenKind::Percent => BinaryOp::Modulo,
        TokenKind::EqualEqual => BinaryOp::Equal,
        TokenKind::BangEqual => BinaryOp::NotEqual,
        TokenKind::Less => BinaryOp::Less,
        TokenKind::LessEqual => BinaryOp::LessEqual,
        TokenKind::Greater => BinaryOp::Greater,
        TokenKind::GreaterEqual => BinaryOp::GreaterEqual,
        _ => return None,
    })
}

type Parsed<T> = Result<T, SyntaxError>;

struct Parser {
    tokens: Vec<Token>,
    current: usize,
}

impl Parser {
    fn peek(&self) -> &Token {
        // The lexer always ends the list with EOF, and `advance` never moves past it.
        &self.tokens[self.current]
    }

    fn check(&self, kind: TokenKind) -> bool {
        self.peek().kind == kind
    }

    fn advance(&mut self) -> Token {
        let token = self.peek().clone();
        if token.kind != TokenKind::Eof {
            self.current += 1;
        }
        token
    }

    fn matches(&mut self, kind: TokenKind) -> bool {
        let found = self.check(kind);
        if found {
            self.advance();
        }
        found
    }

    fn fail(token: &Token, message: &str) -> SyntaxError {
        let found = if token.kind == TokenKind::Eof {
            "end of input".to_string()
        } else {
            format!("'{}'", token.text)
        };
        SyntaxError {
            message: format!("{message}, found {found}"),
            pos: token.pos,
        }
    }

    fn expect(&mut self, kind: TokenKind, what: &str) -> Parsed<Token> {
        if self.check(kind) {
            Ok(self.advance())
        } else {
            Err(Self::fail(self.peek(), &format!("expected {what}")))
        }
    }

    // --- statements: recursive descent, one method per grammar rule ---

    fn declaration(&mut self) -> Parsed<Stmt> {
        match self.peek().kind {
            TokenKind::Let => {
                self.advance();
                let name = self
                    .expect(TokenKind::Identifier, "a variable name after 'let'")?
                    .text;
                self.expect(TokenKind::Equal, "'=' after the variable name")?;
                let initializer = self.expression(0)?;
                self.expect(TokenKind::Semicolon, "';' after the value")?;
                Ok(Stmt::Let { name, initializer })
            }
            TokenKind::Fn => {
                self.advance();
                let name = self
                    .expect(TokenKind::Identifier, "a function name after 'fn'")?
                    .text;
                self.expect(TokenKind::LeftParen, "'(' after the function name")?;
                let mut params = Vec::new();
                if !self.check(TokenKind::RightParen) {
                    loop {
                        params.push(self.expect(TokenKind::Identifier, "a parameter name")?.text);
                        if !self.matches(TokenKind::Comma) {
                            break;
                        }
                    }
                }
                self.expect(TokenKind::RightParen, "')' after the parameters")?;
                Ok(Stmt::Fn {
                    name,
                    params,
                    body: self.block()?,
                })
            }
            _ => self.statement(),
        }
    }

    fn statement(&mut self) -> Parsed<Stmt> {
        match self.peek().kind {
            TokenKind::If => self.if_statement(),
            TokenKind::While => {
                self.advance();
                let condition = self.expression(0)?;
                Ok(Stmt::While {
                    condition,
                    body: self.block()?,
                })
            }
            TokenKind::Return => {
                self.advance();
                let value = if self.check(TokenKind::Semicolon) {
                    None
                } else {
                    Some(self.expression(0)?)
                };
                self.expect(TokenKind::Semicolon, "';' after the return value")?;
                Ok(Stmt::Return(value))
            }
            TokenKind::Print => {
                self.advance();
                let value = self.expression(0)?;
                self.expect(TokenKind::Semicolon, "';' after the value")?;
                Ok(Stmt::Print(value))
            }
            TokenKind::LeftBrace => Ok(Stmt::Block(self.block()?)),
            _ => {
                let expression = self.expression(0)?;
                self.expect(TokenKind::Semicolon, "';' after the expression")?;
                Ok(Stmt::Expression(expression))
            }
        }
    }

    fn if_statement(&mut self) -> Parsed<Stmt> {
        self.advance();
        let condition = self.expression(0)?;
        let then_branch = self.block()?;
        let else_branch = if self.matches(TokenKind::Else) {
            Some(if self.check(TokenKind::If) {
                vec![self.if_statement()?]
            } else {
                self.block()?
            })
        } else {
            None
        };
        Ok(Stmt::If {
            condition,
            then_branch,
            else_branch,
        })
    }

    fn block(&mut self) -> Parsed<Vec<Stmt>> {
        self.expect(TokenKind::LeftBrace, "'{'")?;
        let mut body = Vec::new();
        while !self.check(TokenKind::RightBrace) && !self.check(TokenKind::Eof) {
            body.push(self.declaration()?);
        }
        self.expect(TokenKind::RightBrace, "'}' to close the block")?;
        Ok(body)
    }

    // --- expressions: Pratt parsing ---

    // EN: Pratt parsing, as in MP-COMP-1: read an operand, then absorb infix operators while they
    //     bind tighter than `min_power`. A left-associative operator reads its right side with
    //     its own power; assignment, which is right-associative, reads it with one unit less.
    // PT: Análise de Pratt, como no MP-COMP-1: leia um operando e absorva operadores infixos
    //     enquanto ligarem mais forte que `min_power`. Um operador associativo à esquerda lê seu
    //     lado direito com a própria força; a atribuição, associativa à direita, lê com uma
    //     unidade a menos.
    // ES: Análisis de Pratt, como en el MP-COMP-1: lee un operando y absorbe operadores infijos
    //     mientras enlacen más fuerte que `min_power`. Un operador asociativo a la izquierda lee
    //     su lado derecho con su propia fuerza; la asignación, asociativa a la derecha, lee con
    //     una unidad menos.
    fn expression(&mut self, min_power: u8) -> Parsed<Expr> {
        let mut left = self.prefix()?;
        loop {
            let power = match binding_power(self.peek().kind) {
                Some(power) if power > min_power => power,
                _ => return Ok(left),
            };
            let operator = self.advance();
            let pos = operator.pos;
            left = match operator.kind {
                TokenKind::LeftParen => {
                    let mut args = Vec::new();
                    if !self.check(TokenKind::RightParen) {
                        loop {
                            args.push(self.expression(0)?);
                            if !self.matches(TokenKind::Comma) {
                                break;
                            }
                        }
                    }
                    self.expect(TokenKind::RightParen, "')' after the arguments")?;
                    Expr::Call {
                        callee: Box::new(left),
                        args,
                        pos,
                    }
                }
                TokenKind::Equal => {
                    let Expr::Variable { name, .. } = left else {
                        let message = "the left side of '=' must be a variable name";
                        return Err(Self::fail(&operator, message));
                    };
                    Expr::Assign {
                        name,
                        value: Box::new(self.expression(power - 1)?),
                        pos,
                    }
                }
                TokenKind::And | TokenKind::Or => Expr::Logical {
                    is_and: operator.kind == TokenKind::And,
                    left: Box::new(left),
                    right: Box::new(self.expression(power)?),
                    pos,
                },
                kind => {
                    let op = binary_op(kind).expect("every other infix token is a binary operator");
                    let right = Box::new(self.expression(power)?);
                    Expr::Binary {
                        op,
                        left: Box::new(left),
                        right,
                        pos,
                    }
                }
            };
        }
    }

    fn prefix(&mut self) -> Parsed<Expr> {
        let token = self.advance();
        let pos = token.pos;
        Ok(match token.kind {
            TokenKind::Number => {
                let value = token
                    .text
                    .parse()
                    .expect("the lexer only accepts valid numbers");
                Expr::Literal(Literal::Number(value), pos)
            }
            TokenKind::Str => {
                let inner = &token.text[1..token.text.len() - 1];
                Expr::Literal(Literal::Str(inner.to_string()), pos)
            }
            TokenKind::True => Expr::Literal(Literal::Bool(true), pos),
            TokenKind::False => Expr::Literal(Literal::Bool(false), pos),
            TokenKind::Nil => Expr::Literal(Literal::Nil, pos),
            TokenKind::Identifier => Expr::Variable {
                name: token.text,
                pos,
            },
            TokenKind::LeftParen => {
                let inner = self.expression(0)?;
                self.expect(TokenKind::RightParen, "')' to close the parenthesis")?;
                inner
            }
            TokenKind::Minus | TokenKind::Bang => {
                let op = if token.kind == TokenKind::Minus {
                    UnaryOp::Negate
                } else {
                    UnaryOp::Not
                };
                Expr::Unary {
                    op,
                    operand: Box::new(self.expression(UNARY_POWER)?),
                    pos,
                }
            }
            _ => return Err(Self::fail(&token, "expected an expression")),
        })
    }
}

/// Text to tree. Stops at the first lexical or syntax error.
pub fn parse(source: &str) -> Result<Vec<Stmt>, SyntaxError> {
    let mut parser = Parser {
        tokens: tokenize(source)?,
        current: 0,
    };
    let mut program = Vec::new();
    while !parser.check(TokenKind::Eof) {
        program.push(parser.declaration()?);
    }
    Ok(program)
}
