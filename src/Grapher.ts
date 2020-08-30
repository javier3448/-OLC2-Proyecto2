import { digraph, toDot, Digraph, ISubgraph, attribute, INode } from "ts-graphviz";
import { Expression, ExpressionKind } from "./Ast/Expression";
import { AstNode } from "./Ast/AstNode";

import { parser } from "./Translator/TranslatorParser.js";
export function test(){
    let source = "10 * (1 + 3) + 10";

    let root =  parser.parse(source);
    const g = digraph('G');

    graphExpression(g, root);

    let dot = toDot(g);
    console.log(dot);
}

//g: SubGraph donde vamos a ir metiendo todos los nodos
export function graphExpression(g:Digraph, expr:Expression){

    const result = g.createNode(`expr${expr.getNodeId()}`, {
        [attribute.label]: expressionToLabel(expr),
        [attribute.shape]: 'circle',
    });

    expr.children.forEach(element => {
        let child: INode;
        if(element instanceof Expression){
            child = graphExpression(g, element);
        }
        else{
            child = g.createNode(`literal${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: element.toString(),
                [attribute.shape]: 'circle',
            }); 
        }
        g.createEdge([result, child]);
    });    

    return result;
}

function expressionToLabel(expr:Expression):string{
    switch(expr.operatorKind){
        case ExpressionKind.LESS:
            return "<<B>-</B>>";
        case ExpressionKind.GREATER:
            return "<<B><</B>>";
        case ExpressionKind.LESS_OR_EQUAL:
            return "<<B><=</B>>";
        case ExpressionKind.GREATER_OR_EQUAL:
            return "<<B>>=</B>>";
        case ExpressionKind.EQUAL:
            return "<<B>==</B>>";
        case ExpressionKind.NOT_EQUAL:
            return "<<B>!=</B>>";

        case ExpressionKind.ADDITION:
            return "<<B>+</B>>";
        case ExpressionKind.SUBSTRACTION:
            return "<<B>-</B>>";
        case ExpressionKind.MULTIPLICATION:
            return "<<B>*</B>>";
        case ExpressionKind.DIVISION:
            return "<<B>/</B>>";
        case ExpressionKind.POWER:
            return "<<B>**</B>>";
    
        case ExpressionKind.UNARY_MINUS:
            return "<<B>Unary</BR>-</B>>";
        case ExpressionKind.NEGATION:
            return "<<B>!</B>>";
        case ExpressionKind.POSTFIX_INC:
            return "<<B>Post<BR/>++</B>>";
        case ExpressionKind.POSTFIX_DEC:
            return "<<B>Post<BR/>--</B>>";

        case ExpressionKind.ATOMIC:
            return "<<B>Atomic</B>>";

        case ExpressionKind.TERNARY:
            return "<<B>?</B>>";
    }
}