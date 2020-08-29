import { AstNode } from "./AstNode";


export enum ExpressionKind{
    //binary
    LESS = '<',
    GREATER = '>',
    LESS_OR_EQUAL = '<=',
    GREATER_OR_EQUAL = '>=',
    EQUAL = '==',
    NOT_EQUAL = '!=',

    ADDITION = '+',
    SUBSTRACTION = '-',
    MULTIPLICATION = '*',
    DIVISION = '/',
    POWER = '**',

    //unary
    UNARY_MINUS = '-',
    NEGATION = '!',
    POSTFIX_INC = '++',
    POSTFIX_DEC = '--',

    ATOMIC = '',

    //ternary
    TERNARY = '?'
}

//There is probably a more idomatica way of doing this in typescript but this is fine for now
//empty string returns ATOMIC ExpressionKind
//"?" return TERNARY ExpressionKind
export function stringToExpressionKind(s:string):ExpressionKind{
    switch(s){
        case '+':
            return ExpressionKind.ADDITION;
        case '-':
            return ExpressionKind.SUBSTRACTION;
        case '*':
            return ExpressionKind.MULTIPLICATION;
        case '/':
            return ExpressionKind.DIVISION;
        case '<':
            return ExpressionKind.LESS;
        case '<=':
            return ExpressionKind.LESS_OR_EQUAL;
        case '>':
            return ExpressionKind.GREATER;
        case '>=':
            return ExpressionKind.GREATER_OR_EQUAL;
        case '==':
            return ExpressionKind.EQUAL;
        case '!=':
            return ExpressionKind.NOT_EQUAL;
    }

    //TODO: Terminar de poner los operadores
    throw new Error(`Assertion Error: string <${s}> doesn't represent a valid ExpressionKind`);
}

export class Expression extends AstNode{
    public operatorKind: ExpressionKind;
    public children: Array<(Expression | Number)>

    constructor(operatorKind:ExpressionKind, children: Array<Expression | Number>, 
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){
        //Common AST attributes
        super(firstLine, firstColumn, lastLine, lastColumn);

        //assertions
        switch(operatorKind){
            //binary
            case ExpressionKind.LESS:
            case ExpressionKind.GREATER:
            case ExpressionKind.LESS_OR_EQUAL:
            case ExpressionKind.GREATER_OR_EQUAL:
            case ExpressionKind.EQUAL:
            case ExpressionKind.NOT_EQUAL:
            case ExpressionKind.ADDITION:
            case ExpressionKind.SUBSTRACTION:
            case ExpressionKind.MULTIPLICATION:
            case ExpressionKind.DIVISION:
            case ExpressionKind.POWER:
                if(children.length != 2){
                    throw new Error(`Assertion Error: Operator ${operatorKind.toString()} must have 2 subexpressions instead of ${children.length}`);
                }
            break;

            //unary
            case ExpressionKind.UNARY_MINUS:
            case ExpressionKind.POSTFIX_INC:
            case ExpressionKind.POSTFIX_DEC:
            case ExpressionKind.NEGATION:
            case ExpressionKind.ATOMIC:
                if(children.length != 1){
                    throw new Error(`Assertion Error: Operator ${operatorKind.toString()} must have 1 subexpressions instead of ${children.length}`);
                }
            break;

            //ternary
            case ExpressionKind.TERNARY:
                if(children.length != 3){
                    throw new Error(`Assertion Error: Operator ${operatorKind.toString()} must have 1 subexpressions instead of ${children.length}`);
                }
            break;
            //Solo para que no se nos olvide incluir todos los operadores posibles en este switch
            default:
                throw new Error(`[!!!] No se ha implementado todavia el operador ${operatorKind}`);
        }

        this.operatorKind = operatorKind
        this.children = children;
    }

    getNodeId(): number {
        return this.nodeId;
    }
}