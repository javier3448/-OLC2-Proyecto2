import { translate } from "../Translator/Translator";

import fs from 'fs';
import { graphExpression } from "../Grapher";

import { digraph, toDot, Digraph, ISubgraph, attribute } from "ts-graphviz";
import { Expression, ExpressionKind } from "../Ast/Expression";

// test1
{
   let inputFile:string = './TestFiles/input1.myts';

   let source = fs.readFileSync(inputFile).toString();

   console.log(source);
   let root =  translate(source);

   const g = digraph('G');
   graphExpression(g, root);

   console.log(toDot(g));
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
{
    let expr = new Expression(ExpressionKind.ADDITION, [1,2], 1,3,4,5);
    console.log(expr.getNodeId());//aqui si funciona :(
}
