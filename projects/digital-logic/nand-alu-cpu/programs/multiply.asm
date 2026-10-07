; EN: Multiplies two numbers by repeated addition: product = x + x + ... + x, y times.
;     The CPU has no multiply instruction, so the program builds one out of ADD and a loop.
;     Memory cell 0 holds x, cell 1 holds the counter y, cell 2 holds the product (it starts
;     at 0 because every register powers up cleared). The product must fit in 4 bits (0 to 15).
; PT: Multiplica dois números por somas repetidas: produto = x + x + ... + x, y vezes.
;     A CPU não tem instrução de multiplicar, então o programa constrói uma com ADD e um laço.
;     A célula 0 da memória guarda x, a célula 1 guarda o contador y e a célula 2 guarda o
;     produto (começa em 0 porque todo registrador liga zerado). O produto precisa caber em
;     4 bits (0 a 15).

        LDI 3       ; x = 3
        STA 0
        LDI 4       ; y = 4
        STA 1
loop:   LDA 1       ; A = counter, and the Z flag says whether it reached 0
        JZ done
        SUBI 1      ; counter = counter - 1
        STA 1
        LDA 2       ; product = product + x
        ADD 0
        STA 2
        JMP loop
done:   LDA 2
        OUT         ; show the product
        HLT
