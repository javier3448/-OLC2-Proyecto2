"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Translator_1 = require("../Translator/Translator");
var fs_1 = __importDefault(require("fs"));
var Grapher_1 = require("../Grapher");
var ts_graphviz_1 = require("ts-graphviz");
var Expression_1 = require("../Ast/Expression");
// test1
{
    var inputFile = './TestFiles/input1.myts';
    var source = fs_1.default.readFileSync(inputFile).toString();
    console.log(source);
    var root = Translator_1.translate(source);
    var g = ts_graphviz_1.digraph('G');
    Grapher_1.graphExpression(g, root);
    console.log(ts_graphviz_1.toDot(g));
}
//qd test de pruebas de la lib de graphviz
/*
//qd test para ver como grafica la libreria de graphviz que vamos a usar
// {
//     let realGraph = digraph('G');
//     let g = realGraph.createSubgraph('A');

//     let expr = new Expression(ExpressionKind.ADDITION, [1, 2], 1, 2,3,4)
//     const result = g.createNode(`expr${expr.getNodeId()}`, {
//         [attribute.label]: 'Expr\n' + expr.operatorKind.toString(),
//         [attribute.shape]: 'square'
//     });

//     console.log(toDot(realGraph));
// }
//Que pasa si dos nodos tienen el mismo nombre?
// {
//     let realGraph = digraph('G');
//     let g = realGraph.createSubgraph('A');
//     let expr = new Expression(ExpressionKind.ADDITION, [1, 2], 1, 2,3,4)

//     const repeat = g.createNode(`expr${expr.getNodeId()}`, {
//         [attribute.label]: 'Expr\n' + expr.operatorKind.toString(),
//         [attribute.shape]: 'square'
//     });
//     console.log(expr.getNodeId());

//     console.log(toDot(realGraph));
// }
// //R: solo escribe uno, no tira exception ni aviasa de ninguna manera
*/
//AQUI AQUI AQUI
//Why the fuck doesnt .getNodeId() work fucking anywhere. not even 
//from fukcing piece of shit jison
{
    var expr = new Expression_1.Expression(Expression_1.ExpressionKind.ADDITION, [1, 2], 1, 3, 4, 5);
    console.log(expr.getNodeId());
    //it has it here :( 
    //Why are they making us write compilers in fucking piece of shit typescript of all things
    //Its fucking embarrassing
}
