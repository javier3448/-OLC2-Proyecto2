%{
    const { Expression, ExpressionKind, UnaryExpression, BinaryExpression, TernaryExpression, LiteralExpression, IdentifierExpression, FunctionCallExpression, MemberAccessExpression} = require('../Ast/Expression');
    const { MemberAccess, AccessKind, FunctionAccess, IndexAccess, AttributeAccess } = require('../Ast/MemberAccess');
    const { Statement, StatementKind, Block, WhileStatement } = require('../Ast/Statement');
    const { Assignment } = require('../Ast/Assignment');
    const { Declaration } = require('../Ast/Declaration');
    const { MyTypeNode, MyTypeNodeKind } = require('../Ast/MyTypeNode');
    //const {Literal} = require('../Expression/Literal');
%}

%lex
%options case-sensitive
%%
\s+                                   /* skip whitespace */
"//".*                                /* IGNORE */
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]   /* IGNORE */



//TODO: String Template
"true"                        return 'TRUE'
"false"                       return 'FALSE'
"undefined"                   return 'UNDEFINED'
"null"                        return 'NULL'

"while"                       return 'WHILE'

"break"                       return 'BREAK'

"OR"                          return 'OR'
"AND"                         return 'AND'
"=="                          return '=='
"!="                          return '!='
">="                          return '>='
"<="                          return '<='
">"                           return '>'
"<"                           return '<'
"+"                           return '+'
"-"                           return '-'
"*"                           return '*'
"/"                           return '/'
"%"                           return '%'
"**"                          return '**'
"NOT"                         return 'NOT'
"++"                          return '++'
"--"                          return '--'
"("                           return '('
")"                           return ')'
"="                           return '='
"."                           return '.'
"["                           return '['
"]"                           return ']'

"let"                         return 'LET'
"number"                      return 'NUMBER'
"string"                      return 'STRING'
"boolean"                     return 'BOOLEAN'

","                           return ','
";"                           return ';'
"{"                           return '{'
"}"                           return '}'
":"                           return ':'

//Debug char:
"~"                           return '~'
<<EOF>>		                  return 'EOF'

[0-9]+(\.[0-9]+)?             return 'NUMBER'
([a-zA-Z_])[a-zA-Z0-9_ñÑ]*    return 'IDENTIFIER'
//TODO: mejorar string, esta regex no acepta caracteres especiales como \n \t etc. pero si acepta saltos de linea y todo eso
(\"[^"]*\")                   return 'STRING'

/lex

//TODO: falta operador ++ y --. 
//[?] en la clase digieron que solo hibamos a hacer unary postIncrement
//falta el operador %
//[?] tenemos que hacer los operadores: = += <unary+>
//TODO: como hacer el unary minux
%right '='
%left 'OR'
%left 'AND'
%left '==', '!='
%nonassoc '>', '<', '>=', '<='
%left '+', '-'
%left '*', '/', '%'
%right '**' 
%right 'NOT', UNARY_MINUS 
%nonassoc POSTFIX_DEC, POSTFIX_INC, '++', '--'
%left '.', '[', DOT

//TODO: completar los operadores:
//NOT
//incrmento (solo post [?] preguntar en foro para estar tranquilo)
//decremento (solo post [?] preguntar en foro para estar tranquilo)
//ternario

//CONVENCION: El nombre de las listas que pueden venir vacias debe de tener un _ al final

%start S
%%

S
    : StatementList EOF
    {
        return $1;
    }
;

StatementList_
    : StatementList
    {
        $$ = $1;
    }
    | /*empty*/
    {
        $$ = new Array();
    }
;

StatementList
    : StatementList Statement
    {
        $$ = $1;
        $$.push($2);
    }
    | Statement
    {
        $$ = new Array($1);
    }
;

Statement
    : Expression ';'
    {
        $$ = new Statement(StatementKind.ExpressionKind, $1, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Declaration ';'
    {
        $$ = new Statement(StatementKind.DeclarationKind, $1, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Block
    {
        $$ = new Statement(StatementKind.DeclarationKind, new Block($1), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | WHILE '(' Expression ')' Block
    {
        $$ = new Statement(StatementKind.WhileKind, new WhileStatement($3, $5), @1.first_line, @1.first_column, @5.last_line, @5.last_column);
    }
    //Jumpers
    | BREAK ';'
    {
        $$ = new Statement(StatementKind.BreakKind, null, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
;

Block
    : '{' StatementList_ '}'
    {
        $$ = new Block($2);
    }
;

Declaration
    : LET IDENTIFIER '=' Expression
    {
        $$ = new Declaration($2, null, $4, @1.first_line, @1.first_column, @4.last_line, @4.last_column);
    }
    | LET IDENTIFIER ':' Type '=' Expression
    {
        $$ = new Declaration($2, $4, $6, @1.first_line, @1.first_column, @6.last_line, @6.last_column);
    }
    | LET IDENTIFIER ':' Type
    {
        $$ = new Declaration($1, $4, null, @1.first_line, @1.first_column, @4.last_line, @4.last_column);
    }
;


Type
    : 'NUMBER'
    {
        $$ = new MyTypeNode (MyTypeNodeKind.NUMBER, null);
    }
    | 'STRING'
    {
        $$ = new MyTypeNode (MyTypeNodeKind.STRING, null);
    }
    | 'BOOLEAN'
    {
        $$ = new MyTypeNode (MyTypeNodeKind.BOOLEAN, null);
    }
    | IDENTIFIER
    {
        $$ = new MyTypeNode (MyTypeNodeKind.CUSTOM, $1);
    }
;

Expression
    : Expression '+' Expression
    {
        $$ = new Expression(ExpressionKind.ADDITION, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }       
    | Expression '-' Expression
    {
        $$ = new Expression(ExpressionKind.SUBSTRACTION, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '*' Expression
    { 
        $$ = new Expression(ExpressionKind.MULTIPLICATION, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }       
    | Expression '/' Expression
    {
        $$ = new Expression(ExpressionKind.DIVISION, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '**' Expression
    {
        $$ = new Expression(ExpressionKind.POWER, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '<' Expression
    {
        $$ = new Expression(ExpressionKind.LESS, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '<=' Expression
    {
        $$ = new Expression(ExpressionKind.LESS_OR_EQUAL, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '>' Expression
    {
        $$ = new Expression(ExpressionKind.GREATER, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '>=' Expression
    {
        $$ = new Expression(ExpressionKind.GREATER_OR_EQUAL, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '==' Expression
    {
        $$ = new Expression(ExpressionKind.EQUAL, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression '!=' Expression
    {
        $$ = new Expression(ExpressionKind.NOT_EQUAL, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression 'OR' Expression
    {
        $$ = new Expression(ExpressionKind.OR, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | Expression 'AND' Expression
    {
        $$ = new Expression(ExpressionKind.AND, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | 'NOT' Expression
    {
        $$ = new Expression(ExpressionKind.NOT, new UnaryExpression($2), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | '-' Expression %prec UNARY_MINUS
    {
        $$ = new Expression(ExpressionKind.UNARY_MINUS, new UnaryExpression($2), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Expression '++' %prec POSTFIX_INC
    {
        $$ = new Expression(ExpressionKind.POSTFIX_INC, new UnaryExpression($1), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Expression '--' %prec POSTFIX_DEC
    {
        $$ = new Expression(ExpressionKind.POSTFIX_DEC, new UnaryExpression($1), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Expression MemberAccess %prec DOT /* Esta precedencia si es necesaria */
    {
        $$ = new Expression(ExpressionKind.MEMBER_ACCESS, new MemberAccessExpression($1, $2), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | Expression '=' Expression
    {
        $$ = new Expression(ExpressionKind.ASSINGMENT, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | F
    {
        $$ = $1;
    }
;

//TODO: poner mejor nombre o juntarlo con las producciones del no terminal ExpressionF   : '(' Expression ')'
    F : '(' Expression ')' { 
        //hay que pasar la ubicacion de inicio y final de los ( )
        $$ = $2;
        $$.first_line = @1.first_line;
        $$.first_column = @1.first_column;
        $$.last_line = @3.last_line;

        $$.last_column = @3.last_column;
    }
    | NUMBER
    { 
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new Number($1)), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | STRING
    {
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new String($1)), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | TRUE
    {
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new Boolean(true)), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | FALSE
    {
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new Boolean(false)), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | NULL
    {
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(null), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | UNDEFINED
    {
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(undefined), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | IDENTIFIER
    {
        $$ = new Expression(ExpressionKind.IDENTIFIER, new IdentifierExpression(new String($1)), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | IDENTIFIER '(' ExpressionList_ ')'
    {
        $$ = new Expression(ExpressionKind.FUNCTION_CALL, new FunctionCallExpression(new String($1), $3), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    // | templateString
    // {

    // }
;

ExpressionList_
    : ExpressionList
    {
        $$ = $1;
    }
    | /*empty*/
    {
        $$ = new Array();
    }
;

//Comma separated
ExpressionList
    : ExpressionList ',' Expression
    {
        $$ = $1;
        $$.push($3);
    }
    | Expression
    {
        $$ = new Array($1);
    }
;

// TODO:
// Si encontramos como hacer un gramatica que sea capaz de generar una lista de member accesses
// despues de encontrar el primer member access despues de la expression entonces vamos a necesitar 
// esto:
// y Vamos a tener que cambiar la definicion de MemberAccessExpression
// MemberAccessList
//     : MemberAccessList MemberAccess
//     {
//         $$ = $1;
//         $$.push($2);
//     }
//     | MemberAccess
//     {
//         //NOTA: no se si aqui perdemos el tipo de $1
//         $$ = new Array($1);
//     }
// ;

MemberAccess
    // Function Access
    : '.'  IDENTIFIER '(' ExpressionList_ ')'
    {
        $$ = new MemberAccess(AccessKind.FunctionAccess, new FunctionAccess($2, $4), @1.first_line, @1.first_column, @5.last_line, @5.last_column);
    }
    // Attribute Access
    | '.'  IDENTIFIER 
    {
        $$ = new MemberAccess(AccessKind.AttributeAccess, new AttributeAccess($2), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    // Index Access
    | '[' Expression ']'
    {
        $$ = new MemberAccess(AccessKind.IndexAccess, new IndexAccess($2), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
;
