"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expression = exports.stringToExpressionKind = exports.ExpressionKind = void 0;
var ExpressionKind;
(function (ExpressionKind) {
    //binary
    ExpressionKind["LESS"] = "<";
    ExpressionKind["GREATER"] = ">";
    ExpressionKind["LESS_OR_EQUAL"] = "<=";
    ExpressionKind["GREATER_OR_EQUAL"] = ">=";
    ExpressionKind["EQUAL"] = "==";
    ExpressionKind["NOT_EQUAL"] = "!=";
    ExpressionKind["ADDITION"] = "+";
    ExpressionKind["SUBSTRACTION"] = "-";
    ExpressionKind["MULTIPLICATION"] = "*";
    ExpressionKind["DIVISION"] = "/";
    ExpressionKind["POWER"] = "**";
    //unary
    ExpressionKind["MINUS"] = "-";
    ExpressionKind["NEGATION"] = "!";
    ExpressionKind["ATOMIC"] = "";
    //ternary
    ExpressionKind["TERNARY"] = "?";
})(ExpressionKind = exports.ExpressionKind || (exports.ExpressionKind = {}));
//There is probably a more idomatica way of doing this in typescript but this is fine for now
//empty string returns ATOMIC ExpressionKind
//"?" return TERNARY ExpressionKind
function stringToExpressionKind(s) {
    switch (s) {
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
    throw new Error("Assertion Error: string <" + s + "> doesn't represent a valid ExpressionKind");
}
exports.stringToExpressionKind = stringToExpressionKind;
var Expression = /** @class */ (function () {
    function Expression(operatorKind, children, firstLine, firstColumn, lastLine, lastColumn) {
        //assertions
        switch (operatorKind) {
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
                if (children.length != 2) {
                    throw new Error("Assertion Error: Operator " + operatorKind.toString() + " must have 2 subexpressions instead of " + children.length);
                }
                break;
            //unary
            case ExpressionKind.MINUS:
            case ExpressionKind.NEGATION:
            case ExpressionKind.ATOMIC:
                if (children.length != 1) {
                    throw new Error("Assertion Error: Operator " + operatorKind.toString() + " must have 1 subexpressions instead of " + children.length);
                }
                break;
            //ternary
            case ExpressionKind.TERNARY:
                if (children.length != 3) {
                    throw new Error("Assertion Error: Operator " + operatorKind.toString() + " must have 1 subexpressions instead of " + children.length);
                }
                break;
        }
        this.operatorKind = operatorKind;
        this.children = children;
        //Common AST attributes
        this.firstLine = firstLine;
        this.firstColumn = firstColumn;
        this.lastLine = lastLine;
        this.lastColumn = lastColumn;
    }
    return Expression;
}());
exports.Expression = Expression;
