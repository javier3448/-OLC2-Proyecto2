%{
    const {Arithmetic, ArithmeticOption} = require('../Expression/Arithmetic');
    const {Literal} = require('../Expression/Literal')
%}

%lex
%options case-insensitive
%%
\s+                   /* skip whitespace */

[0-9]+(\.[0-9]+)?     return 'NUMBER'
"*"                   return '*'
"/"                   return '/'
";"                   return ';'
"-"                   return '-'
"+"                   return '+'
"("                   return '('
")"                   return ')' 
<<EOF>>		          return 'EOF'

/lex

%start S

%%

S
    : NUMBER * NUMBER
    {
        return $1;
    } 
;

