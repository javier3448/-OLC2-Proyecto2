"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expression = exports.stringToExpressionKind = exports.ExpressionKind = void 0;
var AstNode_1 = require("./AstNode");
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
    ExpressionKind["UNARY_MINUS"] = "-";
    ExpressionKind["NEGATION"] = "!";
    ExpressionKind["POSTFIX_INC"] = "++";
    ExpressionKind["POSTFIX_DEC"] = "--";
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
var Expression = /** @class */ (function (_super) {
    __extends(Expression, _super);
    function Expression(operatorKind, children, firstLine, firstColumn, lastLine, lastColumn) {
        var _this = 
        //Common AST attributes
        _super.call(this, firstLine, firstColumn, lastLine, lastColumn) || this;
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
            case ExpressionKind.UNARY_MINUS:
            case ExpressionKind.POSTFIX_INC:
            case ExpressionKind.POSTFIX_DEC:
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
            //Solo para que no se nos olvide incluir todos los operadores posibles en este switch
            default:
                throw new Error("[!!!] No se ha implementado todavia el operador " + operatorKind);
        }
        _this.operatorKind = operatorKind;
        _this.children = children;
        return _this;
    }
    Expression.prototype.getNodeId = function () {
        return this.nodeId;
    };
    return Expression;
}(AstNode_1.AstNode));
exports.Expression = Expression;
