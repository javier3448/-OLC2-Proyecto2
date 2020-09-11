import { digraph, Digraph, ISubgraph, attribute, INode, toDot } from "ts-graphviz";
import { Expression, ExpressionKind, LiteralExpression, IdentifierExpression, BinaryExpression, UnaryExpression, TernaryExpression, MemberAccessExpression, FunctionCallExpression } from "./Ast/Expression";
import { Statement, WhileStatement, Block, StatementKind } from "./Ast/Statement";
import { AstNode } from "./Ast/AstNode";

import { parser } from "./Runner/RunnerParser.js";
import { Declaration } from './Ast/Declaration';
import { Assignment } from './Ast/Assignment';
import { MyTypeNode, MyTypeNodeKind } from './Ast/MyTypeNode';
import { MemberAccess, AccessKind, FunctionAccess, IndexAccess, AttributeAccess } from './Ast/MemberAccess';


export function test(source:String):string{
    let root =  parser.parse(source);
    const g = digraph('G');

    graphStatements(g, root);

    let dot = toDot(g);

    return dot;
}


//g: SubGraph donde vamos a ir metiendo todos los nodos
export function graphExpression(g:Digraph, expr:Expression):INode{

    let result = g.createNode(`expr${expr.astNode.getId()}`, {
        // BAD PERFORMANCE: we do this switch two times because of binExpressionToLable
        [attribute.label]: expressionToLabel(expr),
        [attribute.shape]: 'box',
    });

    switch(expr.expressionKind){
        //binary
        case ExpressionKind.LESS:
        case ExpressionKind.GREATER:
        case ExpressionKind.LESS_OR_EQUAL:
        case ExpressionKind.GREATER_OR_EQUAL:
        case ExpressionKind.EQUAL:
        case ExpressionKind.NOT_EQUAL:
        case ExpressionKind.OR:
        case ExpressionKind.AND:
        case ExpressionKind.ADDITION:
        case ExpressionKind.SUBSTRACTION:
        case ExpressionKind.MULTIPLICATION:
        case ExpressionKind.DIVISION:
        case ExpressionKind.POWER:
        {
            const binExpr = expr.specification as BinaryExpression;
            let leftNode = graphExpression(g, binExpr.left);
            let rightNode = graphExpression(g, binExpr.right);
            g.createEdge([result, leftNode]);
            g.createEdge([result, rightNode]);
        }
        break;

        //unary
        case ExpressionKind.UNARY_MINUS:
        case ExpressionKind.POSTFIX_INC:
        case ExpressionKind.POSTFIX_DEC:
        case ExpressionKind.NEGATION:
        {
            const unaryExpr = expr.specification as UnaryExpression;
            let childExpression = graphExpression(g, unaryExpr.expr);
            g.createEdge([result, childExpression]);
        }
        break;
            
        //ternary
        case ExpressionKind.TERNARY:
        {
            const ternaryExpr = expr.specification as TernaryExpression;
            let leftNode = graphExpression(g, ternaryExpr.left);
            let middleNode = graphExpression(g, ternaryExpr.middle);
            let rightNode = graphExpression(g, ternaryExpr.right);
            g.createEdge([result, leftNode]);
            g.createEdge([result, middleNode]);
            g.createEdge([result, rightNode]);
        }
        break;

        //MemberAccess
        case ExpressionKind.MEMBER_ACCESS:
        {
            const memberAccessExpr = expr.specification as MemberAccessExpression;
            let exprNode = graphExpression(g, memberAccessExpr.expression);
            let memberAccessesNode = graphMemberAccess(g, memberAccessExpr.memberAccess);
            g.createEdge([result, exprNode]);
            g.createEdge([result, memberAccessesNode]);
        }
        break;

        case ExpressionKind.FUNCTION_CALL:
        {
            const functionCallExpression = expr.specification as FunctionCallExpression;
            let nameNode:INode = g.createNode(`function_name${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: `<<B>Name</B><BR/>${functionCallExpression.name}>`,
                [attribute.shape]: 'box',
            });
            let argsNode = graphExpressionList(g, functionCallExpression.functionArgs);
            g.createEdge([result, nameNode]);
            g.createEdge([result, argsNode]);
        }
        break;
        
        //No children
        case ExpressionKind.IDENTIFIER:
        case ExpressionKind.LITERAL:
            //do nothing because they have no children
        break;

        //Solo para que no se nos olvide incluir todos los operadores posibles en este switch
        default:
            throw new Error(`[!!!] graphExpression: No se ha implementado todavia el expressionKind: ${expr.expressionKind}`);
    }

    return result;
}

function graphMemberAccesses(g:Digraph, memberAccesses:MemberAccess[]):INode{

    const result = g.createNode(`member_accesses${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Member Access List",
        [attribute.shape]: 'box',
    });

    for (const memberAccess of memberAccesses) {
        let child: INode = graphMemberAccess(g, memberAccess);
        g.createEdge([result, child]);
    }

    return result;
}

export function graphMemberAccess(g:Digraph, memberAccess:MemberAccess):INode{

    switch (memberAccess.accessKind) {
        case AccessKind.FunctionAccess:
        {
            let functionAccess = memberAccess.access as FunctionAccess; 

            let result:INode = g.createNode(`member_access${memberAccess.astNode.getId()}`, {
                [attribute.label]: `FunctionAccess`,
                [attribute.shape]: 'box',
            });

            let nameNode:INode = g.createNode(`function_name${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: `<<B>Name</B><BR/>${functionAccess.functionName}>`,
                [attribute.shape]: 'box',
            });

            let argListNode = graphExpressionList(g, functionAccess.functionArguments);

            g.createEdge([result, nameNode]);
            g.createEdge([result, argListNode]);

            return result;
        }  
    
        case AccessKind.IndexAccess:
        {
            let indexAccess = memberAccess.access as IndexAccess; 

            let result:INode = g.createNode(`member_access${memberAccess.astNode.getId()}`, {
                [attribute.label]: `IndexAccess`,
                [attribute.shape]: 'box',
            });

            let exprNode = graphExpression(g, indexAccess.index);

            g.createEdge([result, exprNode]);

            return result;
        }  

        case AccessKind.AttributeAccess:
        {
            let attributeAccess = memberAccess.access as AttributeAccess; 

            let result:INode = g.createNode(`member_access${memberAccess.astNode.getId()}`, {
                [attribute.label]: `AttributeAccess`,
                [attribute.shape]: 'box',
            });

            let nameNode:INode = g.createNode(`member_access${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: `<<B>Name</B><BR/>${attributeAccess.name}>`,
                [attribute.shape]: 'box',
            });

            g.createEdge([result, nameNode]);
            return result;
        }  

        default:
            throw new Error(`graphMemberAccess no implementado para accessKind: ${AccessKind.AttributeAccess}`);
    }

}

function graphExpressionList(g:Digraph, expressions:Expression[]):INode{ 

    const result = g.createNode(`expr_list${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "expr list",
        [attribute.shape]: 'box',
    });

    for (const expression of expressions) {
        let child: INode = graphExpression(g, expression);
        g.createEdge([result, child]);
    }

    return result;
}

function expressionToLabel(expr:Expression):string{
    switch(expr.expressionKind){
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
        case ExpressionKind.OR:
            return "<<B>OR</B>>"
        case ExpressionKind.AND:
            return "<<B>OR</B>>"

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
            return "<<B>Unary<BR/>-</B>>";
        case ExpressionKind.NEGATION:
            return "<<B>!</B>>";
        case ExpressionKind.POSTFIX_INC:
            return "<<B>Post<BR/>++</B>>";
        case ExpressionKind.POSTFIX_DEC:
            return "<<B>Post<BR/>--</B>>";

        case ExpressionKind.LITERAL:
        {
            const litExpr = (expr.specification as LiteralExpression);
            //Chapus porque el no se como conseguir el nombre de la case de la instancia
            //litExpr.literal.constructor.name no funciono
            //
            if(litExpr.literal instanceof Boolean){
                return `<<B>Boolean</B><BR/>${litExpr.literal}>`;
            }
            else if(litExpr.literal instanceof Number){
                return `<<B>Number</B><BR/>${litExpr.literal}>`;
            }
            else if(litExpr.literal instanceof String){
                return `<<B>String</B><BR/>${litExpr.literal}>`;
            }
        }
        case ExpressionKind.IDENTIFIER:
            return `<<B>Identifier</B><BR/>${(expr.specification as IdentifierExpression).name}>`;

        case ExpressionKind.FUNCTION_CALL:
            return `<<B>FunctionCall</B>>`;

        case ExpressionKind.MEMBER_ACCESS:
            return "<<B>MemberAccessExpression</B>>";

        case ExpressionKind.TERNARY:
            return "<<B>?</B>>";
        default:
            throw Error(`expressionToLabel no tiene implementacion para expression kind: ${expr.expressionKind}`)
    }
}

function graphStatements(g:Digraph, stmts:Statement[]):INode{

    const result = g.createNode(`stmt_list${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "stmt list",
        [attribute.shape]: 'box',
    });

    for (const statement of stmts) {
        let child: INode = graphStatement(g, statement);
        g.createEdge([result, child]);
    }

    return result;
}

export function graphStatement(g:Digraph, statement:Statement):INode{
    const result = g.createNode(`statement${statement.astNode.getId()}`, {
        [attribute.label]: "stmt",
        [attribute.shape]: 'box',
    });

    let child: INode;
    switch (statement.statementKind) {
        case StatementKind.ExpressionKind:
            child = graphExpression(g, statement.child as Expression);
            break;
        case StatementKind.DeclarationKind:
            child = graphDeclaration(g, statement.child as Declaration);
            break;

        //Flujo de control
        case StatementKind.WhileKind:
            child = graphWhileStatement(g, statement.child as WhileStatement);
            break;

        case StatementKind.BlockKind:
            child = graphBlock(g, statement.child as Block);
            break;

        //Jumpers
        case StatementKind.BreakKind:
            child = g.createNode(`break${statement.astNode.getId()}`, {
                [attribute.label]: "break",
                [attribute.shape]: 'box',
            });
            break;
        case StatementKind.ContinueKind:
            child = g.createNode(`continue${statement.astNode.getId()}`, {
                [attribute.label]: "continue",
                [attribute.shape]: 'box',
            });
            break;
        case StatementKind.ReturnKind:
            child = g.createNode(`return${statement.astNode.getId()}`, {
                [attribute.label]: "return",
                [attribute.shape]: 'box',
            });
        case StatementKind.ReturnWithValueKind:
        {
            child = g.createNode(`return_with_val${statement.astNode.getId()}`, {
                [attribute.label]: "return with val",
                [attribute.shape]: 'box',
            });
            let grandChild = graphExpression(g, statement.child as Expression);
            g.createEdge([child, grandChild]);
        }break;
        default:
            throw new Error(`Assertion Error: Graph statement no implementado para : ${statement.child}`)
    }

    g.createEdge([result, child]);

    return result;
}

function graphBlock(g:Digraph, block:Block):INode{

    const result = g.createNode(`block${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Block",
        [attribute.shape]: 'box',
    });

    for (const statement of block.statements) {
        let child: INode = graphStatement(g, statement);
        g.createEdge([result, child]);
    }

    return result;
}

export function graphDeclaration(g:Digraph, decl:Declaration):INode{

    const result = g.createNode(`Declaration${decl.astNode.getId()}`, {
        [attribute.label]: "Declaration",
        [attribute.shape]: 'box',
    });

    const identifierNode = g.createNode(`Identifier${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "<<B>Id<BR/></B>" + decl.identifier + ">",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, identifierNode]);
            
    if(decl.myTypeNode){
        let typeNode = graphMyType(g, decl.myTypeNode);
        g.createEdge([result, typeNode]);
    }

    if(decl.expression){
        let exprNode = graphExpression(g, decl.expression);
        g.createEdge([result, exprNode]);
    }

    return result;
}

function graphWhileStatement(g:Digraph, whileStatement:WhileStatement):INode{
    
    const result = g.createNode(`While${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "While",
        [attribute.shape]: 'box',
    });

    const exprNode = graphExpression(g, whileStatement.expr);
    g.createEdge([result, exprNode]);

    const blockNode = graphBlock(g, whileStatement.block);
    g.createEdge([result, blockNode]);

    return result;
}

function myTypeNodeToLabel(myTypeNode:MyTypeNode){
    switch (myTypeNode.kind) {
        case MyTypeNodeKind.BOOLEAN:
            return "<<B>Type</B><BR/>Boolean>"
        case MyTypeNodeKind.NUMBER:
            return "<<B>Type</B><BR/>Number>"
        case MyTypeNodeKind.STRING:
            return "<<B>Type</B><BR/>String>"

        case MyTypeNodeKind.CUSTOM:
            return `<<B>Type</B><BR/>${myTypeNode.name}>`

        default:
            throw new Error(`myTypeNodeToLabel no implementado para myTypeNode: ${myTypeNode}`);
            break;
    }
}

export function graphMyType(g:Digraph, myType:MyTypeNode):INode{

    const result = g.createNode(`MyType${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: myTypeNodeToLabel(myType),
        [attribute.shape]: 'box',
    });



    return result;
}

export function graphAssignment(g:Digraph, assignment:Assignment):INode{

    const result = g.createNode(`assignment${assignment.astNode.getId()}`, {
        [attribute.label]: "Assignment",
        [attribute.shape]: 'box',
    });

    let lvalueNode = graphExpression(g, assignment.lvalue);
    let rvalueNode = graphExpression(g, assignment.rvalue);

    g.createEdge([result, lvalueNode]);
    g.createEdge([result, rvalueNode]);

    return result;
}

