import { digraph, toDot, Digraph, ISubgraph, attribute, INode } from "ts-graphviz";
import { Expression } from "./Ast/Expression";
import { AstNode } from "./Ast/AstNode";

//g: SubGraph donde vamos a ir metiendo todos los nodos
export function graphExpression(g:Digraph, expr:Expression){

    const result = g.createNode(`expr${expr.getNodeId()}`, {
        [attribute.label]: 'Expr\n' + expr.operatorKind.toString(),
        [attribute.shape]: 'square',
    });

    expr.children.forEach(element => {
        let child: INode;
        if(element instanceof Expression){
            child = graphExpression(g, element);
        }
        else{
            //AQUI AQUI AQUI
            child = g.createNode(`literal${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: element.toString(),
                [attribute.shape]: 'square',
            }); 
        }
        g.createEdge([result, child]);
    });    

    return result;
}

