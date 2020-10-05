// CREATING YET ANOTHER PARSER IS THE SOLUTION WE WENT WITH BECAUSE
// WE DONT KNOW HOW TO SET THE LEXER TO A DIFFERENT STATE TO CORRECTLY 
// PARSE TEMPLATE STRINGS
// A bit about: How they do it 'IRL':
// https://dev.to/captainsafia/how-do-template-literals-in-javascript-work-under-the-hood-4g2b

%{
    const { Expression, ExpressionKind, 
    UnaryExpression, BinaryExpression, TernaryExpression, LiteralExpression, 
    IdentifierExpression, FunctionCallExpression, MemberAccessExpression, 
    PropertyNode, ObjectLiteralExpression, ArrayLiteralExpression } = require('../Ast/Expression');
    const { MemberAccess, AccessKind, FunctionAccess, IndexAccess, AttributeAccess } = require('../Ast/MemberAccess');
    const { MyError, MyErrorKind } = require('../Runner/MyError')
    //const {Literal} = require('../Expression/Literal');

%}

%lex
%options case-sensitive
%%
\s+                                   /* skip whitespace */
"//".*                                /* IGNORE */
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]   /* IGNORE */



//TODO BIG: String Template
"true"                        return 'TRUE'
"false"                       return 'FALSE'
"undefined"                   return 'UNDEFINED'
"null"                        return 'NULL'

"OR"                          return 'OR'
"AND"                         return 'AND'
"=="                          return '=='
"!="                          return '!='
">="                          return '>='
"<="                          return '<='
">"                           return '>'
"<"                           return '<'
"++"                          return '++'
"--"                          return '--'
"+"                           return '+'
"-"                           return '-'
"**"                          return '**'
"*"                           return '*'
"/"                           return '/'
"%"                           return '%'
"NOT"                         return 'NOT'
"("                           return '('
")"                           return ')'
"="                           return '='
"."                           return '.'
"["                           return '['
"]"                           return ']'

","                           return ','
"{"                           return '{'
"}"                           return '}'
":"                           return ':'
"?"                           return '?'

//Debug char:
<<EOF>>		                  return 'EOF'

[0-9]+(\.[0-9]+)?             return 'NUMBER'
([a-zA-Z_])[a-zA-Z0-9_ñÑ]*    return 'IDENTIFIER'
//TODO: mejorar string, esta regex no acepta caracteres especiales como \n \t etc. pero si acepta saltos de linea y todo eso
(\"[^"]*\")                   return 'STRING'
(\'[^']*\')                   return 'STRING'

.	{ 
        let lexicError = new MyError('TemplateStringLexer este es un error léxico del: ' + yytext + ', en la linea: ' + yylloc.first_line + ', en la columna: ' + yylloc.first_column); 
        lexicError.firstLine = yylloc.first_line;
        lexicError.firstColumn = yylloc.first_column;
        lexicError.kind = MyErrorKind.LEXICAL;
    }
/lex

%right '='
%right '?'
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

//CONVENCION: El nombre de las listas que pueden venir vacias debe de tener un _ al final

%start S
%%

//RETURNS NULL IF SINTAX ERROR!
S
    : Expression EOF
    {
        $$ = $1;
        return $$;
    }
    | error EOF
    {
        return null;
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
    | Expression '%' Expression
    {
        $$ = new Expression(ExpressionKind.MODULUS, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
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
        $$ = new Expression(ExpressionKind.EQUAL_EQUAL, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
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
    | 'NOT' Expression %prec NOT
    {
        $$ = new Expression(ExpressionKind.NEGATION, new UnaryExpression($2), @1.first_line, @1.first_column, @2.last_line, @2.last_column);
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
    | Expression '?' Expression ':' Expression
    {
        $$ = new Expression(ExpressionKind.TERNARY, new TernaryExpression($1, $3, $5), @1.first_line, @1.first_column, @5.last_line, @5.last_column);
    }
    | Expression '=' Expression
    {
        $$ = new Expression(ExpressionKind.ASSIGNMENT, new BinaryExpression($1, $3), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | F
    {
        $$ = $1;
    }
;

F   : '(' Expression ')' { 
        //hay que pasar la ubicacion de inicio y final de los ( )
        $$ = $2;
        $$.first_line = @1.first_line;
        $$.first_column = @1.first_column;
        $$.last_line = @3.last_line;

        $$.last_column = @3.last_column;
        $$.hasParenthesis = true;
    }
    | NUMBER
    { 
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new Number($1)), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | STRING
    {
        //TERRIBLE PERFORMANCE:
        //The worst performance ever. You really should be ashamed of yourself :(
        let s = $1.slice(1, $1.length - 1).replace(/\\n/g, "\n");
        s = s.replace(/\\r/g, "\r");
        s = s.replace(/\\t/g, "\t");
        $$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new String(s)), @1.first_line, @1.first_column, @1.last_line, @1.last_column);
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
        $$ = new Expression(ExpressionKind.FUNCTION_CALL, new FunctionCallExpression(new String($1), $3), @1.first_line, @1.first_column, @4.last_line, @4.last_column);
    }
    | '{' PropertyList '}'
    {
        $$ = new Expression(ExpressionKind.OBJECT_LITERAL, new ObjectLiteralExpression($2), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
    | '[' ExpressionList_ ']'
    {
        $$ = new Expression(ExpressionKind.ARRAY_LITERAL, new ArrayLiteralExpression($2), @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
;

PropertyList_
    : PropertyList
    {
        $$ = $1;
    }
    | /* empty */
    {
        $$ = new Array();
    }
;

PropertyList
    : PropertyList Property ','
    {
        $$ = $1;
        $$.push($2);
    }
    | PropertyList Property
    {
        $$ = $1;
        $$.push($2);
    }
    | Property ','
    {
        $$ = new Array($1);
    }
    | Property 
    {
        $$ = new Array($1);
    }
;

Property
    : IDENTIFIER ':' Expression
    {
        $$ = new PropertyNode($1, $3, @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
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
