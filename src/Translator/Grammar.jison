%{
    const { Expression, ExpressionKind } = require('./Ast/Expression');
    //const {Literal} = require('../Expression/Literal')
%}

%lex
%options case-sensitive
%%
\s+                                   /* skip whitespace */
"//".*                                /* IGNORE */
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]   /* IGNORE */


[0-9]+(\.[0-9]+)?     return 'NUMBER'
"OR"                  return 'OR'
"AND"                 return 'AND'
"=="                  return '=='
"!="                  return '!='
">"                   return '>'
"<"                   return '<'
">="                  return '>='
"<="                  return '<='
"+"                   return '+'
"-"                   return '-'
"*"                   return '*'
"/"                   return '/'
"%"                   return '%'
"**"                  return '**'
"NOT"                 return 'NOT'
"++"                  return '++'
"--"                  return '--'
<<EOF>>		          return 'EOF'

/lex

//TODO: falta operador ++ y --. 
//[?] en la clase digieron que solo hibamos a hacer unary postIncrement
//falta el operador %
//[?] tenemos que hacer los operadores: = += <unary+>
//TODO: como hacer el unary minux
%left 'OR'
%left 'AND'
%left '==', '!='
%nonassoc '>', '<', '>=', '<='
%left '+', '-'
%left '*', '/', '%'
%right '**' 
%right 'NOT', UNARY_MINUS 
%nonassoc '++', '--'

//TODO: completar los operadores:
//NOT
//incrmento (solo post [?] preguntar en foro para estar tranquilo)
//decremento (solo post [?] preguntar en foro para estar tranquilo)
//ternario


%start S
%%

S
    : Expr EOF
    {
        return $1;
    }
;

Expr
    : Expr '+' Expr
    {
        $$ = new Expression(ExpressionKind.ADDITION, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }       
    | Expr '-' Expr
    {
        $$ = new Expression(ExpressionKind.SUBSTRACTION, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '*' Expr
    { 
        $$ = new Expression(ExpressionKind.MULTIPLICATION, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }       
    | Expr '/' Expr
    {
        $$ = new Expression(ExpressionKind.DIVISION, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '**' Expr
    {
        $$ = new Expression(ExpressionKind.POWER, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '<' Expr
    {
        $$ = new Expression(ExpressionKind.LESS, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '<=' Expr
    {
        $$ = new Expression(ExpressionKind.LESS_OR_EQUAL, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '>' Expr
    {
        $$ = new Expression(ExpressionKind.GREATER, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '>=' Expr
    {
        $$ = new Expression(ExpressionKind.GREATER_EQUAL, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '==' Expr
    {
        $$ = new Expression(ExpressionKind.EQUAL, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expr '!=' Expr
    {
        $$ = new Expression(ExpressionKind.NOT_EQUAL, [$1, $3], @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | 'NOT' Expr
    {
        $$ = new Expression(ExpressionKind.NOT, [$2], @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | '-' Expr %prec UNARY_MINUS
    {
        $$ = new Expression(ExpressionKind.UNARY_MINUS, [$2], @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Expr '++'
    {
        $$ = new Expression(ExpressionKind.POSTFIX_INC, [$2], @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Expr '--'
    {
        $$ = new Expression(ExpressionKind.POSTFIX_DEC, [$2], @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | F
    {
        $$ = $1;
    }
;

F   : '(' Expr ')'
    { 
        //hay que pasar la ubicacion de inicio y final de los ( )
        $2.first_line = @1.first_line;
        $2.first_column = @1.first_column;
        $2.last_line = @3.last_line;
        $2.last_column = @4.last_column;

        $$ = $2;
    }
    | NUMBER
    { 
        console.log($1);
        $$ = new Expression(ExpressionKind.ATOMIC, [new Number($1)], @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    // | STRING
    // {
    //     $$ = new Expression(
    // }
    // | ID{
    //     $$ = new Expression(
    // }
;

