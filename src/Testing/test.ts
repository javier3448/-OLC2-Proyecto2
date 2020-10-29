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

//Why the fuck doesnt .getNodeId() work fucking anywhere. not even 
//from fukcing piece of shit jison
{
    let expr = new Expression(ExpressionKind.ADDITION, [1,2], 1,3,4,5);
    console.log(expr.getNodeId());
    //it has it here :( 
    //Why are they making us write compilers in fucking piece of shit typescript of all things
    //Its fucking embarrassing
}

//Some of the challenges we will deal with when doing the
//nested functions
{
    function lol(){
        function lel(){
            console.log(a);
            console.log(b);
        }
        
        let a = 10;
        if(true == true){
            lel();
        }
        let b = 1;
    }

    lol();

    //tavez necesitemos hacer las declaraciones antes
    //talvez nececsitemos hacer una especie de hoisting
    //talvez necesitemos poner las declaraciones adentro de la tabla de simbolos desede antes
    //y que la declaraciones no lo agregue a la tabla de simbolos

    //seria como agarrar todas las declaraciones, ponerlas hasta arriba
    //y convertir todas las declaraciones en asignaciones entonces la
    //funcion anterior se veria asi:
    function lol1(){
        let a:number;
        let b:number;//[ !!!! ] esto daria clavo con el const!!!
                    //podriamos definir como UB acceder a una var const desde una nested function
                    //antes de que haya sido inicializada
        function lel(){
            console.log(a);
            console.log(b);
        }
        
        a = 10;
        if(true == true){
            lel();
        }
        b = 1;
    }
    //tambien podriamos recorrer el arbol de manera que agarremos las declaraciones
    //en una pasada y las ponemos en la tabla de simbolos y las marcamos como 
    //uninitialized y luego cuando compile el nodo declaration y solicite un addVariable
    //maneje el hecho que ya esta en la tabla de simbolos pero no esta inicializada

    //[!] ERROR si la declaracion tira error :/. Pero podriamos cambiar nuestra estrategia de errores y tirar todo a la basura cuando haya error de compilacion

    //Hacer todo lo demas antes de pensar en esto. Esos mens son capaces que quitan eso al final :(
}


//BUG: Esto en typescript es error de compilacion
{
    let a:number = 10;
    {
        console.log(a);
        let a:number = 20;
        console.log(a);
    }
}

//BUG from last proyect:
//No revisa bien que una funcion no tenga params con el mismo nombre
{
    function hello(a:number, b:number, a:number):void{
        console.log(`hello. a: ${a} b:${b} a:${a}`);
    }
    
    hello(1,2,3);
}