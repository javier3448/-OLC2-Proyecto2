%{
    const { Expression, ExpressionKind, 
    UnaryExpression, BinaryExpression, TernaryExpression, LiteralExpression, 
    IdentifierExpression, FunctionCallExpression, MemberAccessExpression, 
    PropertyNode, ObjectLiteralExpression, ArrayLiteralExpression, TemplateString} = require('../Ast/Expression');
    const { MemberAccess, AccessKind, FunctionAccess, IndexAccess, AttributeAccess } = require('../Ast/MemberAccess');
    const { Statement, StatementKind, Block, 
            WhileStatement, DoWhileStatement, IfStatement, 
            ForStatement, ForOfStatement, ForInStatement, 
            SwitchStatement, SwitchCase, SwitchDefault, 
            SwitchInstructions } = require('../Ast/Statement');
    const { Assignment } = require('../Ast/Assignment');
    const { Declaration } = require('../Ast/Declaration');
    const { MyTypeNode, MyTypeNodeKind } = require('../Ast/MyTypeNode');
    const { GlobalInstructionsRunner } = require('../Ast/GlobalInstructionsRunner')
    const { TypeDef, AttributeNode } = require('../Ast/TypeDef')
    const { FunctionDef, ParamNode } = require('../Ast/FunctionDef')
    const { MyError } = require('../Runner/MyError')
    //const {Literal} = require('../Expression/Literal');

    const { templateStringHelperRun, processScapeSequences } = require('../TemplateStringParsing/Helper')
%}

%lex
%options case-sensitive
%%
\s+                                   /* skip whitespace */
"//".*                                /* IGNORE */
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]   /* IGNORE */



"true"                        return 'TRUE'
"false"                       return 'FALSE'
"undefined"                   return 'UNDEFINED'
"null"                        return 'NULL'

"type"                        return 'TYPE'
"Array"                       return 'ARRAY'
"function"                    return 'FUNCTION'

"while"                       return 'WHILE'
"do"                          return 'DO'
"if"                          return 'IF'
"else"                        return 'ELSE'
"switch"                      return 'SWITCH'
"case"                        return 'CASE'
"default"                     return 'DEFAULT'
"for"                         return 'FOR'
"forin"                       return 'FORIN'
"in"                          return 'IN'
"of"                          return 'OF'

"break"                       return 'BREAK'
"continue"                    return 'CONTINUE'
"return"                      return 'RETURN'

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

"let"                         return 'LET'
"const"                       return 'LET'//TODO TODO TODO: HACER EL CONST DE VERDAD!!!!!
"number"                      return 'NUMBER'
"string"                      return 'STRING'
"boolean"                     return 'BOOLEAN'
"void"                        return 'VOID'

","                           return ','
";"                           return ';'
"{"                           return '{'
"}"                           return '}'
":"                           return ':'
"?"                           return '?'

//Debug char:
"~"                           return '~'
<<EOF>>		                  return 'EOF'

[0-9]+(\.[0-9]+)?             return 'NUMBER'
([a-zA-Z_])[a-zA-Z0-9_ñÑ]*    return 'IDENTIFIER'
//TODO: mejorar string, esta regex no acepta caracteres especiales como \n \t etc. pero si acepta saltos de linea y todo eso
(\"[^"]*\")                   return 'STRING'
(\'[^']*\')                   return 'STRING'
(\`[^`]*\`)                   return 'TEMPLATE_STRING'

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

S
    : GlobalInstructions_ EOF 
    {
        $$ = $1;
        $$.setAstNode(@1.first_line, @1.first_column, @2.last_line, @2.last_column);
        return $$;
    }
;

GlobalInstructions_
    : GlobalInstructions
    {
        $$ = $1;
    }
    | /*empty*/
    {
        $$ = new GlobalInstructionsRunner();
    }
;

// Bad name, but it represents all possible 'things' that can go into a
// our initial production 
GlobalInstructions
    : GlobalInstructions Statement
    {
        $$.addStatement($2);
    }
    | GlobalInstructions TypeDef
    {
        $$.addTypeDef($2);
    }
    | GlobalInstructions FunctionDef
    {
        $$.addFunctionDef($2);
    }
    | Statement
    {
        $$ = new GlobalInstructionsRunner();
        $$.addStatement($1);
    }
    | TypeDef
    {
        $$ = new GlobalInstructionsRunner();
        $$.addTypeDef($1);
    }
    | FunctionDef
    {
        $$ = new GlobalInstructionsRunner();
        $$.addFunctionDef($1);
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

FunctionDef
    : FUNCTION IDENTIFIER "(" ParamList_ ")" ":" Type "{" StatementList_ "}"
    {
        $$ = new FunctionDef($2, $4, $7, $9, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | FUNCTION IDENTIFIER "(" ParamList_ ")" ":" VOID "{" StatementList_ "}"
    {
        $$ = new FunctionDef($2, $4, null, $9, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
;

ParamList_
    : ParamList
    {
        $$ = $1;
    }
    | /* empty */
    {
        $$ = new Array();
    }
;

//Param and Attribute are pretty much the same
//it might be better to find a way to only use one
ParamList
    : ParamList Param ','
    {
        $$ = $1;
        $$.push($2);
    }
    | ParamList Param
    {
        $$ = $1;
        $$.push($2);
    }
    | Param ','
    {
        $$ = new Array($1);
    }
    | Param
    {
        $$ = new Array($1);
    }
;

Param
    : IDENTIFIER ':' Type
    {
        $$ = new ParamNode($1, $3, @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
;

TypeDef
    : TYPE IDENTIFIER "=" "{" AttributeList_ "}"
    {
        $$ = new TypeDef($2, $5, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
;

AttributeList_
    : AttributeList
    {
        $$ = $1;
    }
    | /* empty */
    {
        new Array();
    }
;

AttributeList
    : AttributeList Attribute ','
    {
        $$ = $1;
        $$.push($2);
    }
    | AttributeList Attribute ';'
    {
        $$ = $1;
        $$.push($2);
    }
    | AttributeList Attribute
    {
        $$ = $1;
        $$.push($2);
    }
    | Attribute ';'
    {
        $$ = new Array($1);
    }
    | Attribute ','
    {
        $$ = new Array($1);
    }
    | Attribute
    {
        $$ = new Array($1);
    }
;

Attribute
    : IDENTIFIER ':' Type
    {
        $$ = new AttributeNode($1, $3, @1.first_line, @1.first_column, @3.last_line, @3.last_column);
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
        $$ = new Statement(StatementKind.BlockKind, $1, @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | WHILE '(' Expression ')' '{' StatementList_ '}'
    {
        $$ = new Statement(StatementKind.WhileKind, new WhileStatement($3, $6), @1.first_line, @1.first_column, @6.last_line, @6.last_column);
    }
    | DO '{' StatementList_ '}' WHILE '(' Expression ')' ';' 
    {
        $$ = new Statement(StatementKind.DoWhileKind, new DoWhileStatement($3, $7), @1.first_line, @1.first_column, @6.last_line, @6.last_column);
    }
    | IfStatement
    {
        $$ = $1;
    }
    | FOR '(' ExpressionOrDeclaration_ ';' Expression_ ';' Expression_ ')' '{' StatementList_ '}'
    {
        $$ = new Statement(StatementKind.ForKind, new ForStatement($3, $5, $7, $10), @1.first_line, @1.first_column, @7.last_line, @7.last_column);
    }
    | ForOfStatement
    {
        $$ = $1;
    }
    | ForInStatement
    {
        $$ = $1;
    }
    | SwitchStatement
    {
        $$ = $1;
    }
    //Jumpers
    | BREAK ';'
    {
        $$ = new Statement(StatementKind.BreakKind, null, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | CONTINUE ';'
    {
        $$ = new Statement(StatementKind.ContinueKind, null, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | RETURN ';'
    {
        $$ = new Statement(StatementKind.ReturnKind, null, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
    | RETURN Expression ';'
    {
        $$ = new Statement(StatementKind.ReturnWithValueKind, $2, @1.first_line, @1.first_column, @3.last_line, @3.last_column);
    }
;

//Unlike block, this rule actually returns its own stament with AstNode and all
IfStatement
    : IF '(' Expression ')' '{' StatementList_ '}'
    {
        $$ = new Statement(StatementKind.IfKind, new IfStatement($3, $6, null), @1.first_line, @1.first_column, @6.last_line, @6.last_column);
    }
    | IF '(' Expression ')' '{' StatementList_ '}' ELSE Block
    {
        let blockStatement =  new Statement(StatementKind.BlockKind, $9, @9.first_line, @9.first_column, @9.last_line, @9.last_column);
        $$ = new Statement(StatementKind.IfKind, new IfStatement($3, $6, blockStatement), @1.first_line, @1.first_column, @6.last_line, @6.last_column);
    }
    | IF '(' Expression ')' '{' StatementList_ '}' ELSE IfStatement
    {
        $$ = new Statement(StatementKind.IfKind, new IfStatement($3, $6, $9), @1.first_line, @1.first_column, @9.last_line, @9.last_column);
    }
;

ForOfStatement
    : FOR '(' 'LET' IDENTIFIER 'OF' Expression ')' '{' StatementList_ '}'
    {
        $$ = new Statement(StatementKind.ForOfKind, new ForOfStatement($4, $6, $9), @1.first_line, @1.first_column, @10.last_line, @10.last_column);
    }
;

ForInStatement
    : FOR '(' 'LET' IDENTIFIER 'IN' Expression ')' '{' StatementList_ '}'
    {
        $$ = new Statement(StatementKind.ForInKind, new ForInStatement($4, $6, $9), @1.first_line, @1.first_column, @10.last_line, @10.last_column);
    }
;

SwitchStatement
    : 'SWITCH' '(' Expression ')' '{' SwitchInstructions_ '}'
    {
        $$ = new Statement(StatementKind.SwitchKind, new SwitchStatement($3, $6), @1.first_line, @1.first_column, @7.last_line, @7.last_column);
    }
;

SwitchInstructions_
    : SwitchInstructions
    {
        $$ = $1;
    }
    | /*empty*/
    {
        $$ = new SwitchInstructions([],[],[]);
    }
;

//BAD: we lose a bunch of info about begining and end of the lang constructs here because none of the switch stuff has astNode
SwitchInstructions
    : 'CASE' Expression ':'
    {
        $$ = new SwitchInstructions([new SwitchCase($2, 0)],[],[]);
    }
    | 'DEFAULT' ':'
    {
        $$ = new SwitchInstructions([],[new SwitchDefault(0)],[]);
    }
    | Statement
    {
        $$ = new SwitchInstructions([],[],[$3]);
    }
    | SwitchInstructions 'CASE' Expression ':'
    {
        $$ = $1;
        $$.cases.push(new SwitchCase($3, $$.statements.length));
    }
    | SwitchInstructions 'DEFAULT' ':'
    {
        $$ = $1;
        $$.defaults.push(new SwitchDefault($$.statements.length));
    }
    | SwitchInstructions Statement
    {
        $$ = $1;
        $$.statements.push($2);
    }
;

ExpressionOrDeclaration_
    : Expression
    {
        $$ = $1;
    }
    | Declaration
    {
        $$ = new Statement(StatementKind.DeclarationKind, $1, @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | /* empty */
    {
        $$ = null;
    }
;

Expression_
    : Expression
    {
        $$ = $1;
    }
    | /*empty*/
    {
        $$ = null;
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
        $$ = new Declaration($2, $4, null, @1.first_line, @1.first_column, @4.last_line, @4.last_column);
    }
    | LET IDENTIFIER 
    {
        $$ = new Declaration($2, null, null, @1.first_line, @1.first_column, @2.last_line, @2.last_column);
    }
;


Type
    : 'NUMBER'
    {
        $$ = MyTypeNode.makeNumberTypeNode(@1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | 'STRING'
    {
        $$ = MyTypeNode.makeStringTypeNode(@1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | 'BOOLEAN'
    {
        $$ = MyTypeNode.makeBooleanTypeNode(@1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | IDENTIFIER
    {
        $$ = MyTypeNode.makeCustomTypeNode($1, @1.first_line, @1.first_column, @1.last_line, @1.last_column);
    }
    | 'ARRAY' '<' Type '>'
    {
        $$ = MyTypeNode.makeGenericArrayTypeNode($3, @1.first_line, @1.first_column, @4.last_line, @4.last_column);
    }
    | Type '[' ']'
    {
        $$ = MyTypeNode.makeBoxyArrayTypeNode($1, @1.first_line, @1.first_column, @3.last_line, @3.last_column);
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
        //BAD PERFORMANCE:
        //we are basically doing the lexing two times for every string 
        let s = processScapeSequences($1.slice(1, $1.length - 1));
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
    | TEMPLATE_STRING
    {
        let stringTemplate = templateStringHelperRun($1);
        $$ = new Expression(ExpressionKind.TEMPLATE_STRING, stringTemplate, @1.first_line, @1.first_column, @1.last_line, @1.last_column);
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

// POSSIBLE IMPROVEMENT:
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
