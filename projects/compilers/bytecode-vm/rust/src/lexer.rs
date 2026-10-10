//! The lexer: characters to tokens. A port of the TypeScript lexer of MP-COMP-1.

use std::fmt;

use crate::ast::Pos;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenKind {
    LeftParen,
    RightParen,
    LeftBrace,
    RightBrace,
    Comma,
    Semicolon,
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Bang,
    BangEqual,
    Equal,
    EqualEqual,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
    Number,
    Str,
    Identifier,
    Let,
    Fn,
    If,
    Else,
    While,
    Return,
    Print,
    True,
    False,
    Nil,
    And,
    Or,
    Eof,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token {
    pub kind: TokenKind,
    /// The lexeme: the characters of the source that form this token.
    pub text: String,
    pub pos: Pos,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyntaxError {
    pub message: String,
    pub pos: Pos,
}

impl fmt::Display for SyntaxError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "[line {}, column {}] syntax error: {}",
            self.pos.line, self.pos.column, self.message
        )
    }
}

fn keyword(word: &str) -> Option<TokenKind> {
    Some(match word {
        "let" => TokenKind::Let,
        "fn" => TokenKind::Fn,
        "if" => TokenKind::If,
        "else" => TokenKind::Else,
        "while" => TokenKind::While,
        "return" => TokenKind::Return,
        "print" => TokenKind::Print,
        "true" => TokenKind::True,
        "false" => TokenKind::False,
        "nil" => TokenKind::Nil,
        "and" => TokenKind::And,
        "or" => TokenKind::Or,
        _ => return None,
    })
}

fn is_letter(c: char) -> bool {
    c.is_ascii_alphabetic() || c == '_'
}

// EN: Same rules as the TypeScript lexer: longest match for operators (`<=` before `<`), a whole
//     word is read before it is checked against the keyword table, comments and white space
//     produce nothing. The one difference is error handling: this front end stops at the first
//     error, because reporting several errors is the lesson of MP-COMP-1, not of this project.
// PT: As mesmas regras do lexer em TypeScript: casamento mais longo para operadores (`<=` antes
//     de `<`), a palavra inteira é lida antes de ser comparada com a tabela de palavras-chave,
//     comentários e espaços não produzem nada. A única diferença é o tratamento de erros: este
//     front end para no primeiro erro, porque reportar vários erros é a lição do MP-COMP-1, não
//     deste projeto.
// ES: Las mismas reglas del lexer en TypeScript: emparejamiento más largo para operadores (`<=`
//     antes que `<`), la palabra completa se lee antes de compararla con la tabla de palabras
//     clave, los comentarios y espacios no producen nada. La única diferencia es el manejo de
//     errores: este front end se detiene en el primer error, porque reportar varios errores es
//     la lección del MP-COMP-1, no de este proyecto.
pub fn tokenize(source: &str) -> Result<Vec<Token>, SyntaxError> {
    let chars: Vec<char> = source.chars().collect();
    let at = |index: usize| chars.get(index).copied().unwrap_or('\0');
    let mut tokens = Vec::new();
    let mut index = 0;
    let mut line = 1;
    let mut line_start = 0;

    while index < chars.len() {
        let c = chars[index];
        let start = index;
        let pos = Pos {
            line,
            column: (index - line_start + 1) as u32,
        };

        if c == '\n' {
            index += 1;
            line += 1;
            line_start = index;
            continue;
        }
        if c == ' ' || c == '\t' || c == '\r' {
            index += 1;
            continue;
        }
        if c == '/' && at(index + 1) == '/' {
            while index < chars.len() && chars[index] != '\n' {
                index += 1;
            }
            continue;
        }

        let followed_by_equal = at(index + 1) == '=';
        let one_or_two = |one: TokenKind, two: TokenKind| {
            if followed_by_equal {
                (two, 2)
            } else {
                (one, 1)
            }
        };
        let operator = match c {
            '(' => Some((TokenKind::LeftParen, 1)),
            ')' => Some((TokenKind::RightParen, 1)),
            '{' => Some((TokenKind::LeftBrace, 1)),
            '}' => Some((TokenKind::RightBrace, 1)),
            ',' => Some((TokenKind::Comma, 1)),
            ';' => Some((TokenKind::Semicolon, 1)),
            '+' => Some((TokenKind::Plus, 1)),
            '-' => Some((TokenKind::Minus, 1)),
            '*' => Some((TokenKind::Star, 1)),
            '/' => Some((TokenKind::Slash, 1)),
            '%' => Some((TokenKind::Percent, 1)),
            '!' => Some(one_or_two(TokenKind::Bang, TokenKind::BangEqual)),
            '=' => Some(one_or_two(TokenKind::Equal, TokenKind::EqualEqual)),
            '<' => Some(one_or_two(TokenKind::Less, TokenKind::LessEqual)),
            '>' => Some(one_or_two(TokenKind::Greater, TokenKind::GreaterEqual)),
            _ => None,
        };

        let kind = if let Some((kind, length)) = operator {
            index += length;
            kind
        } else if c.is_ascii_digit() {
            while at(index).is_ascii_digit() {
                index += 1;
            }
            if at(index) == '.' && at(index + 1).is_ascii_digit() {
                index += 1;
                while at(index).is_ascii_digit() {
                    index += 1;
                }
            }
            TokenKind::Number
        } else if is_letter(c) {
            while is_letter(at(index)) || at(index).is_ascii_digit() {
                index += 1;
            }
            let word: String = chars[start..index].iter().collect();
            keyword(&word).unwrap_or(TokenKind::Identifier)
        } else if c == '"' {
            index += 1;
            while index < chars.len() && chars[index] != '"' && chars[index] != '\n' {
                index += 1;
            }
            if at(index) != '"' {
                return Err(SyntaxError {
                    message: "unterminated string".to_string(),
                    pos,
                });
            }
            index += 1;
            TokenKind::Str
        } else {
            return Err(SyntaxError {
                message: format!("unexpected character '{c}'"),
                pos,
            });
        };

        tokens.push(Token {
            kind,
            text: chars[start..index].iter().collect(),
            pos,
        });
    }

    let pos = Pos {
        line,
        column: (index - line_start + 1) as u32,
    };
    tokens.push(Token {
        kind: TokenKind::Eof,
        text: String::new(),
        pos,
    });
    Ok(tokens)
}
