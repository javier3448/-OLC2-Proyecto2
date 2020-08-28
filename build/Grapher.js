"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphExpression = void 0;
var ts_graphviz_1 = require("ts-graphviz");
var Expression_1 = require("./Ast/Expression");
var AstNode_1 = require("./Ast/AstNode");
//g: SubGraph donde vamos a ir metiendo todos los nodos
function graphExpression(g, expr) {
    var _a;
    var result = g.createNode("expr" + expr.getNodeId(), (_a = {},
        _a[ts_graphviz_1.attribute.label] = 'Expr\n' + expr.operatorKind.toString(),
        _a[ts_graphviz_1.attribute.shape] = 'square',
        _a));
    expr.children.forEach(function (element) {
        var _a;
        var child;
        if (element instanceof Expression_1.Expression) {
            child = graphExpression(g, element);
        }
        else {
            //AQUI AQUI AQUI
            child = g.createNode("literal" + AstNode_1.AstNode.getNextAstNodeId(), (_a = {},
                _a[ts_graphviz_1.attribute.label] = element.toString(),
                _a[ts_graphviz_1.attribute.shape] = 'square',
                _a));
        }
        g.createEdge([result, child]);
    });
    return result;
}
exports.graphExpression = graphExpression;
