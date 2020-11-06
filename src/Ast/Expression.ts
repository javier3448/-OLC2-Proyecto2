import { StringLiteralByte } from 'src/Compiler/StringLiteralByte';
import { AstNode } from "./AstNode";
import { MemberAccess } from './MemberAccess';

// even though we have typeof and instanceof in typescript this is necessary because 
// jison does some weird js things and sometimes we like 'loose the type and its
// functions'. idk
export enum ExpressionKind{
    //binary
    LESS = '<',
    GREATER = '>',
    LESS_OR_EQUAL = '<=',
    GREATER_OR_EQUAL = '>=',
    EQUAL_EQUAL = '==',
    NOT_EQUAL = '!=',
    OR = 'OR',
    AND = 'AND',

    ADDITION = '+',
    SUBSTRACTION = '-',
    MULTIPLICATION = '*',
    MODULUS = '%',
    DIVISION = '/',
    POWER = '**',
    ASSIGNMENT = '=',

    //unary
    UNARY_MINUS = 'UNARY_MINUS',
    NOT = 'NOT',
    POSTFIX_INC = '++',
    POSTFIX_DEC = '--',

    //ternary
    TERNARY = '?',

    //Atomic
    MEMBER_ACCESS = 'MemberAccess',
    IDENTIFIER = 'IDENTIFIER',
    LITERAL = 'LITERAL',
    FUNCTION_CALL = 'FUNCTION_CALL',
    OBJECT_LITERAL = 'OBJECT_LITERAL',
    ARRAY_LITERAL = 'ARRAY_LITERAL',
    NEW_ARRAY = 'NEW_ARRAY',
}

export class UnaryExpression{
    constructor(public expr:Expression){   }
}

export class BinaryExpression{
    constructor(public left:Expression, public right:Expression){   }
}

export class TernaryExpression{
    constructor(public left:Expression, public middle:Expression, public right:Expression){   }
}

//The only Literal that is not just its type in typescript.
//example: a numberLiteral is just Number in the ast
export class StringLiteral{
    constructor(
        public stringRepresentation:string,
        public numberArrayRespresentation:StringLiteralByte[],
    ){   }
}

export class LiteralExpression{
    constructor(
        public literal:(StringLiteral | Number | Boolean | null)
    ){   }
}

export class IdentifierExpression{
    constructor(public name:string){   }
}

export class FunctionCallExpression{
    constructor(public name:string, public functionArgs:Expression[]){   }
}

//TODO: mejorar esta clase. Es super confuso y creo que MemberAccess esta de mas
//      lo unico malo es que hay algo con los astNode entre: Expression, y MemberAcess
export class MemberAccessExpression{
    constructor(public expression:Expression, public memberAccess:MemberAccess){   }
}

export class ObjectLiteralExpression{
    constructor(public propertyNodes:PropertyNode[]){   }
}

export class ArrayLiteralExpression{
    constructor(public expressions:Expression[]){   }
}

export class NewArrayExpression{
    constructor(public sizeExpr:Expression){   }
}

export class PropertyNode{

    astNode:AstNode;

    id:string;
    expr:Expression;

    constructor(id:string, expr:Expression,
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.id  = id;
        this.expr = expr;
    }
    
}

export class Expression {
    //Common AST attributes
    public astNode: AstNode;

    public expressionKind: ExpressionKind;
    public specification: (UnaryExpression | BinaryExpression | TernaryExpression | 
                           IdentifierExpression | LiteralExpression | MemberAccessExpression | 
                           ObjectLiteralExpression | ArrayLiteralExpression | NewArrayExpression |
                           FunctionCallExpression);

    constructor(expressionKind:ExpressionKind, specification:(UnaryExpression | BinaryExpression | TernaryExpression | IdentifierExpression | LiteralExpression | MemberAccessExpression | ObjectLiteralExpression | ArrayLiteralExpression | FunctionCallExpression),
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        //assertions
        switch(expressionKind){
            //binary
            case ExpressionKind.LESS:
            case ExpressionKind.GREATER:
            case ExpressionKind.LESS_OR_EQUAL:
            case ExpressionKind.GREATER_OR_EQUAL:
            case ExpressionKind.EQUAL_EQUAL:
            case ExpressionKind.NOT_EQUAL:
            case ExpressionKind.OR:
            case ExpressionKind.AND:
            case ExpressionKind.ADDITION:
            case ExpressionKind.SUBSTRACTION:
            case ExpressionKind.MULTIPLICATION:
            case ExpressionKind.DIVISION:
            case ExpressionKind.MODULUS:
            case ExpressionKind.ASSIGNMENT:
            case ExpressionKind.POWER:
                if(!(specification instanceof BinaryExpression)){
                    throw new Error(`Assertion Error: Operator ${expressionKind.toString()} must be Type BinaryExpression insstead of ${(specification)}`);
                }
            break;

            //unary
            case ExpressionKind.UNARY_MINUS:
            case ExpressionKind.POSTFIX_INC:
            case ExpressionKind.POSTFIX_DEC:
            case ExpressionKind.NOT:
                if(!(specification instanceof UnaryExpression)){
                    throw new Error(`Assertion Error: Operator ${expressionKind.toString()} must be type UnaryExpression instead of ${(specification)}`);
                }
            break;
            case ExpressionKind.IDENTIFIER:
                if(!(specification instanceof IdentifierExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type IdentifierExpression instead of ${(specification)}`);
                }
            break;
            case ExpressionKind.FUNCTION_CALL:
                if(!(specification instanceof FunctionCallExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type IdentifierExpression instead of ${(specification)}`);
                }
            break;
            case ExpressionKind.LITERAL:
                if(!(specification instanceof LiteralExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type LiteralExpression instead of ${(specification)}`);
                }
            break;

            //ternary
            case ExpressionKind.TERNARY:
                if(!(specification instanceof TernaryExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type TernaryExpression instead of ${(specification)}`);
                }
            break;
            case ExpressionKind.MEMBER_ACCESS:
                if(!(specification instanceof MemberAccessExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type MemberAccessExpression instead of ${(specification)}`);
                }
            break;
            case ExpressionKind.OBJECT_LITERAL:
                if(!(specification instanceof ObjectLiteralExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type ObjectLiteralExpression instead of ${(specification)}`);
                }
            break;
            case ExpressionKind.ARRAY_LITERAL:
                if(!(specification instanceof ArrayLiteralExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type ArrayLiteralExpression instead of ${(specification)}`);
                }
            break;
            case ExpressionKind.NEW_ARRAY:
                if(!(specification instanceof NewArrayExpression)){
                    throw new Error(`Assertion Error: expressionKind ${expressionKind.toString()} must be type NewArrayExpression instead of ${(specification)}`);
                }
            break;
            //Solo para que no se nos olvide incluir todos los operadores posibles en este switch
            default:
                throw new Error(`[!!!] No se ha implementado todavia el operador ${expressionKind}`);
        }

        this.expressionKind = expressionKind;
        this.specification = specification;
    }
}