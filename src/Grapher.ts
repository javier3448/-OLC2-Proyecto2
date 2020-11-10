import { digraph, Digraph, attribute, INode, toDot } from "ts-graphviz";
import { Expression, ExpressionKind, LiteralExpression, 
          IdentifierExpression, BinaryExpression, UnaryExpression, 
          TernaryExpression, MemberAccessExpression, FunctionCallExpression, 
          ObjectLiteralExpression, PropertyNode, ArrayLiteralExpression, StringLiteral, NewArrayExpression } from "./Ast/Expression";
import { Statement, WhileStatement, Block, StatementKind, IfStatement, ForStatement, ForInStatement, ForOfStatement, SwitchStatement, DoWhileStatement, SwitchDefault, SwitchCase  } from "./Ast/Statement";
import { AstNode } from "./Ast/AstNode";

import { Declaration, UnprocessedDeclData } from './Ast/Declaration';
import { AssignmentNode } from './Ast/AssignmentNode';
import { ArrayTypeNode, CustomTypeNode, MyTypeNode, MyTypeNodeKind } from './Ast/MyTypeNode';
import { MemberAccess, AccessKind, FunctionAccess, IndexAccess, AttributeAccess } from './Ast/MemberAccess';
import { GlobalInstructions } from './Ast/GlobalInstructions';
import { AttributeNode, TypeDef } from './Ast/TypeDef';
import { FunctionDef, ParamNode } from './Ast/FunctionDef';
import { FunctionDefTranslator } from './Ast/FunctionDefTranslator';

//BUG: forof and forin dont show if they are 'const' or 'let' in the graph

export function graphAst(root:GlobalInstructions):string{
    const g = digraph('G');

    graphGlobalInstructions(g, root);

    let dot = toDot(g);

    return dot;
}

export function graphGlobalInstructions(g:Digraph, globalInstructions:GlobalInstructions):INode{

    let result = g.createNode(`globalInstructions${globalInstructions.astNode.getId()}`, {
        [attribute.label]: 'Global',
        [attribute.shape]: 'box',
    });

    const typeDefsNode = graphTypeDefs(g, globalInstructions.typeDefs);
    const functionDefsNode = graphFunctionDefs(g, globalInstructions.functionDefs);
    const stmtsNode = graphStatements(g, globalInstructions.statements);

    g.createEdge([result, typeDefsNode]);
    g.createEdge([result, functionDefsNode]);
    g.createEdge([result, stmtsNode]);

    return result;
}

function graphTypeDefs(g:Digraph, typeDefs:TypeDef[]):INode{

    const result = g.createNode(`type_defs${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Type defs list",
        [attribute.shape]: 'box',
    });

    for (const typeDef of typeDefs) {
        let child: INode = graphTypeDef(g, typeDef);
        g.createEdge([result, child]);
    }

    return result;
}

function graphTypeDef(g:Digraph, typeDef:TypeDef):INode{

    const result = g.createNode(`type_def${typeDef.astNode.getId()}`, {
        [attribute.label]: `TypeDef\n${typeDef.name}`,
        [attribute.shape]: 'box',
    });

    for (const attribute of typeDef.attributes) {
        let child:INode = graphAttribute(g, attribute);
        g.createEdge([result, child]);
    }

    return result;
}

function graphAttribute(g:Digraph, attributeNode:AttributeNode):INode{
    
    const result = g.createNode(`attribute${attributeNode.astNode.getId()}`, {
        [attribute.label]: `Attribute`,
        [attribute.shape]: 'box',
    });

    const nameNode = g.createNode(`attribute_name${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: `${attributeNode.name}`,
        [attribute.shape]: 'box',
    });
    g.createEdge([result, nameNode]);

    const typeNode = graphMyTypeNode(g, attributeNode.myTypeNode);
    g.createEdge([result, typeNode]);

    return result;
}

export function graphFunctionDefs(g:Digraph, functionDefs:FunctionDef[]):INode{
    
    let result = g.createNode(`function_defs${AstNode.getNextAstNodeId()}`, {
        // BAD PERFORMANCE: we do this switch two times because of binExpressionToLable
        [attribute.label]: 'Function defs',
        [attribute.shape]: 'box',
    });

    for (const functionDef of functionDefs) {
        let child = graphFunctionDef(g, functionDef);
        g.createEdge([result, child]);
    }

    return result;
}

export function graphFunctionDefsTranslator(g:Digraph, functionDefsTranslator:FunctionDefTranslator[]):INode{
    
    let result = g.createNode(`function_defs${AstNode.getNextAstNodeId()}`, {
        // BAD PERFORMANCE: we do this switch two times because of binExpressionToLable
        [attribute.label]: 'Function defs',
        [attribute.shape]: 'box',
    });

    for (const functionDefTranslator of functionDefsTranslator) {
        let child = graphFunctionDefTranslator(g, functionDefTranslator);
        g.createEdge([result, child]);
    }

    return result;
}

export function graphFunctionDef(g:Digraph, functionDef:FunctionDef):INode{

    let result = g.createNode(`function_def${functionDef.astNode.getId()}`, {
        [attribute.label]: 'Function Def',
        [attribute.shape]: 'box',
    });

    let nameNode = g.createNode(`function_def_name${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: `${functionDef.name}`,
        [attribute.shape]: 'box',
    });
    g.createEdge([result, nameNode]);


    let paramListNode = graphParams(g, functionDef.params);
    g.createEdge([result, paramListNode]);

    if(functionDef.returnType == null){
        let nameNode = g.createNode(`ret_type${AstNode.getNextAstNodeId()}`, {
            // BAD PERFORMANCE: we do this switch two times because of binExpressionToLable
            [attribute.label]: `void`,
            [attribute.shape]: 'box',
        });
        g.createEdge([result, nameNode]);
    }else{
        let retTypeNode = graphMyTypeNode(g, functionDef.returnType);
        g.createEdge([result, retTypeNode]);
    }

    let statementsNode = graphStatements(g, functionDef.statements);
    g.createEdge([result, statementsNode]);

    return result;
}

export function graphFunctionDefTranslator(g:Digraph, functionDef:FunctionDefTranslator):INode{

    let result = g.createNode(`function_def${functionDef.astNode.getId()}`, {
        [attribute.label]: 'Function Def',
        [attribute.shape]: 'box',
    });

    let nameNode = g.createNode(`function_def_name${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: `${functionDef.name}`,
        [attribute.shape]: 'box',
    });
    g.createEdge([result, nameNode]);


    let paramListNode = graphParams(g, functionDef.params);
    g.createEdge([result, paramListNode]);

    if(functionDef.returnType == null){
        let nameNode = g.createNode(`ret_type${AstNode.getNextAstNodeId()}`, {
            // BAD PERFORMANCE: we do this switch two times because of binExpressionToLable
            [attribute.label]: `void`,
            [attribute.shape]: 'box',
        });
        g.createEdge([result, nameNode]);
    }else{
        let retTypeNode = graphMyTypeNode(g, functionDef.returnType);
        g.createEdge([result, retTypeNode]);
    }

    let functionDefsNode = graphFunctionDefsTranslator(g, functionDef.functionDefsTranslator);
    g.createEdge([result, functionDefsNode]);

    let statementsNode = graphStatements(g, functionDef.statements);
    g.createEdge([result, statementsNode]);

    return result;
}

function graphParams(g:Digraph, params:ParamNode[]):INode{

    const result = g.createNode(`param_list${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "param list",
        [attribute.shape]: 'box',
    });

    for (const param of params) {
        let child: INode = graphParam(g, param);
        g.createEdge([result, child]);
    }

    return result;
}

export function graphParam(g:Digraph, param:ParamNode):INode{

    let result = g.createNode(`param_node${param.astNode.getId()}`, {
        // BAD PERFORMANCE: we do this switch two times because of binExpressionToLable
        [attribute.label]: 'paramNode',
        [attribute.shape]: 'box',
    });

    let nameNode = g.createNode(`param_def_name${AstNode.getNextAstNodeId()}`, {
        // BAD PERFORMANCE: we do this switch two times because of binExpressionToLable
        [attribute.label]: `${param.name}`,
        [attribute.shape]: 'box',
    });
    g.createEdge([result, nameNode]);

    let retTypeNode = graphMyTypeNode(g, param.myTypeNode);
    g.createEdge([result, retTypeNode]);

    return result;
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
        case ExpressionKind.EQUAL_EQUAL:
        case ExpressionKind.NOT_EQUAL:
        case ExpressionKind.OR:
        case ExpressionKind.AND:
        case ExpressionKind.ADDITION:
        case ExpressionKind.SUBSTRACTION:
        case ExpressionKind.MULTIPLICATION:
        case ExpressionKind.DIVISION:
        case ExpressionKind.MODULUS:
        case ExpressionKind.ASSIGNMENT:
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
        case ExpressionKind.NOT:
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

        //ObjectLiteral
        case ExpressionKind.OBJECT_LITERAL:
        {
            const objectLiteral = expr.specification as ObjectLiteralExpression;
            for (const property of objectLiteral.propertyNodes) {
                let propertyNodeResult = graphProperty(g, property);
                g.createEdge([result, propertyNodeResult]);
            }
        }
        break;
        //Array literal
        case ExpressionKind.ARRAY_LITERAL:
        {
            const arrayLiteral = expr.specification as ArrayLiteralExpression;

            for (const expression of arrayLiteral.expressions) {
                let child: INode = graphExpression(g, expression);
                g.createEdge([result, child]);
            }
        }break;
        //new Array
        case ExpressionKind.NEW_ARRAY:
        {
            const newArrayExpr = expr.specification as NewArrayExpression;

            let child: INode = graphExpression(g, newArrayExpr.sizeExpr);
            g.createEdge([result, child]);
        }break;

        case ExpressionKind.FUNCTION_CALL:
        {
            const functionCallExpression = expr.specification as FunctionCallExpression;
            let nameNode:INode = g.createNode(`function_name${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: `Name\n${functionCallExpression.name}`,
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

function graphProperty(g:Digraph, property:PropertyNode):INode{

    const result = g.createNode(`property${property.astNode.getId()}`, {
        [attribute.label]: "Property",
        [attribute.shape]: 'box',
    });

    const nameNode = g.createNode(`property_name${property.astNode.getId()}`, {
        [attribute.label]: `${property.id}`,
        [attribute.shape]: 'box',
    });
    g.createEdge([result, nameNode]);

    let exprNode = graphExpression(g, property.expr);
    g.createEdge([result, exprNode]);

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
                [attribute.label]: `Name\n${functionAccess.functionName}`,
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
                [attribute.label]: `Name\n${attributeAccess.name}`,
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
            return "<";
        case ExpressionKind.GREATER:
            //no usamos html graphviz aqui porque graphviz y html son un mierda y no podemos usar '<' o '>' sin cagar todo el parser
            return ">";
        case ExpressionKind.LESS_OR_EQUAL:
            return "<=";
        case ExpressionKind.GREATER_OR_EQUAL:
            return ">=";
        case ExpressionKind.EQUAL_EQUAL:
            return "==";
        case ExpressionKind.NOT_EQUAL:
            return "!=";
        case ExpressionKind.OR:
            return "OR"
        case ExpressionKind.AND:
            return "AND"

        case ExpressionKind.ADDITION:
            return "+";
        case ExpressionKind.SUBSTRACTION:
            return "-";
        case ExpressionKind.MULTIPLICATION:
            return "*";
        case ExpressionKind.DIVISION:
            return "/";
        case ExpressionKind.MODULUS:
            return "%";
        case ExpressionKind.ASSIGNMENT:
            return "AssignmentNode";
        case ExpressionKind.POWER:
            return "**";

        case ExpressionKind.UNARY_MINUS:
            return "Unary minus";
        case ExpressionKind.NOT:
            return "NOT";
        case ExpressionKind.POSTFIX_INC:
            return "Post\n++";
        case ExpressionKind.POSTFIX_DEC:
            return "Post\n--";

        case ExpressionKind.LITERAL:
        {
            const litExpr = (expr.specification as LiteralExpression);
            //Chapus porque el no se como conseguir el nombre de la case de la instancia
            //litExpr.literal.constructor.name no funciono
            //
            if(litExpr.literal instanceof Boolean){
                return `Boolean\n${litExpr.literal}`;
            }
            else if(litExpr.literal instanceof Number){
                return `Number\n${litExpr.literal}`;
            }
            else if(litExpr.literal instanceof StringLiteral){
                return `String\n${litExpr.literal.stringRepresentation}`;
            }
        }
        case ExpressionKind.OBJECT_LITERAL:
            return `ObjectLiteral`;
        case ExpressionKind.ARRAY_LITERAL:
            return `ArrayLiteral`;

        case ExpressionKind.NEW_ARRAY:
            return `NewArray`;

        case ExpressionKind.IDENTIFIER:
            return `Identifier\n${(expr.specification as IdentifierExpression).name}`;

        case ExpressionKind.FUNCTION_CALL:
            return `FunctionCall`;

        case ExpressionKind.MEMBER_ACCESS:
            return "MemberAccessExpression";

        case ExpressionKind.TERNARY:
            return ".. ? .. : ..";

        default:
            throw Error(`expressionToLabel no tiene implementacion para expression kind: ${expr.expressionKind}`)
    }
}

function myTypeNodeToLabel(myTypeNode:MyTypeNode){
    switch (myTypeNode.kind) {
        case MyTypeNodeKind.BOOLEAN: return "Type\nBoolean"
        case MyTypeNodeKind.NUMBER:
            return "Type\nNumber"
        case MyTypeNodeKind.STRING:
            return "Type\nString"

        case MyTypeNodeKind.CUSTOM:
            return `Type\n${(myTypeNode.spec as CustomTypeNode).name}`

        case MyTypeNodeKind.BOXY_ARRAY:
            return `Type\nBoxy Array`;
        case MyTypeNodeKind.GENERIC_ARRAY:
            return `Type\nGeneric Array`;

        default:
            throw new Error(`myTypeNodeToLabel no implementado para myTypeNode: ${myTypeNode.kind}`);
            break;
    }
}

export function graphMyTypeNode(g:Digraph, myType:MyTypeNode):INode{

    const result = g.createNode(`MyType${myType.astNode.getId()}`, {
        [attribute.label]: myTypeNodeToLabel(myType),
        [attribute.shape]: 'box',
    });

    //Casos especiales: Si es ARRAY
    switch (myType.kind) {
        case MyTypeNodeKind.GENERIC_ARRAY:
        {
            const leftChild = g.createNode(`array${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: 'Array',
                [attribute.shape]: 'box',
            });
            g.createEdge([result, leftChild]);

            const rightChild = graphMyTypeNode(g, (myType.spec as ArrayTypeNode).subType);
            g.createEdge([result, rightChild]);
        }break;
    
        case MyTypeNodeKind.BOXY_ARRAY:
        {
            const leftChild = graphMyTypeNode(g, (myType.spec as ArrayTypeNode).subType);
            g.createEdge([result, leftChild]);

            const rightChild = g.createNode(`array${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: '[]',
                [attribute.shape]: 'box',
            });
            g.createEdge([result, rightChild]);
        }break;
    }

    return result;
}

//TODO: test if it shows the modifier
export function graphDeclaration(g:Digraph, decl:Declaration):INode{

    const result = g.createNode(`Declaration${decl.astNode.getId()}`, {
        [attribute.label]: "Declaration",
        [attribute.shape]: 'box',
    });

    const modifierNode = g.createNode(`Modifier${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: ((decl.data as UnprocessedDeclData).isConst ? "const" : "let"),
        [attribute.shape]: 'box',
    });
    g.createEdge([result, modifierNode]);

    const identifierNode = g.createNode(`Identifier${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Id\n" + (decl.data as UnprocessedDeclData).identifier,
        [attribute.shape]: 'box',
    });
    g.createEdge([result, identifierNode]);
            
    let typeNode = graphMyTypeNode(g, (decl.data as UnprocessedDeclData).myTypeNode);
    g.createEdge([result, typeNode]);

    if(decl.expression){
        let exprNode = graphExpression(g, decl.expression);
        g.createEdge([result, exprNode]);
    }

    return result;
}

export function graphAssignment(g:Digraph, assignment:AssignmentNode):INode{

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
    let result:INode;

    switch (statement.statementKind) {
        case StatementKind.ExpressionKind:
        {
            result = g.createNode(`statement${statement.astNode.getId()}`, {
                [attribute.label]: "stmt",
                [attribute.shape]: 'box',
            });
            let child = graphExpression(g, statement.child as Expression);
            g.createEdge([result, child]);
        }
            break;
        case StatementKind.DeclarationKind:
            result = graphDeclaration(g, statement.child as Declaration);
            break;

        //Flujo de control
        case StatementKind.IfKind:
            result = graphIfStatement(g, statement.child as IfStatement);
            break;
        case StatementKind.WhileKind:
            result = graphWhileStatement(g, statement.child as WhileStatement);
            break;
        case StatementKind.DoWhileKind:
            result = graphDoWhileStatement(g, statement.child as DoWhileStatement);
            break;
        case StatementKind.ForKind:
            result = graphForStatement(g, statement.child as ForStatement);
            break;
        case StatementKind.ForInKind:
            result = graphForInStatement(g, statement.child as ForInStatement);
            break;
        case StatementKind.ForOfKind:
            result = graphForOfStatement(g, statement.child as ForOfStatement);
            break;
        case StatementKind.SwitchKind:
            result = graphSwitch(g, statement.child as SwitchStatement);
            break;

        case StatementKind.BlockKind:
            result = graphBlock(g, statement.child as Block);
            break;

        //Jumpers
        case StatementKind.BreakKind:
            result = g.createNode(`break${statement.astNode.getId()}`, {
                [attribute.label]: "break",
                [attribute.shape]: 'box',
            });
            break;
        case StatementKind.ContinueKind:
            result = g.createNode(`continue${statement.astNode.getId()}`, {
                [attribute.label]: "continue",
                [attribute.shape]: 'box',
            });
            break;
        case StatementKind.ReturnKind:
            result = g.createNode(`return${statement.astNode.getId()}`, {
                [attribute.label]: "return",
                [attribute.shape]: 'box',
            });
            break;
        case StatementKind.ReturnWithValueKind:
        {
            result = g.createNode(`return_with_val${statement.astNode.getId()}`, {
                [attribute.label]: "return with val",
                [attribute.shape]: 'box',
            });
            let child = graphExpression(g, statement.child as Expression);
            g.createEdge([result, child]);
        }break;
        default:
            throw new Error(`Assertion Error: Graph statement no implementado para : ${statement.statementKind}`)
    }

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


function graphWhileStatement(g:Digraph, whileStatement:WhileStatement):INode{
    
    const result = g.createNode(`While${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "While",
        [attribute.shape]: 'box',
    });

    const exprNode = graphExpression(g, whileStatement.expr);
    g.createEdge([result, exprNode]);

    const blockNode = graphStatements(g, whileStatement.statements);
    g.createEdge([result, blockNode]);

    return result;
}

function graphDoWhileStatement(g:Digraph, doWhileStatement:DoWhileStatement):INode{
    
    const result = g.createNode(`do_while${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Do While",
        [attribute.shape]: 'box',
    });

    const blockNode = graphStatements(g, doWhileStatement.statements);
    g.createEdge([result, blockNode]);

    const exprNode = graphExpression(g, doWhileStatement.expr);
    g.createEdge([result, exprNode]);

    return result;
}

function graphIfStatement(g:Digraph, ifStatement:IfStatement):INode{
    
    const result = g.createNode(`IfStatement${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "If",
        [attribute.shape]: 'box',
    });

    const exprNode = graphExpression(g, ifStatement.expr);
    g.createEdge([result, exprNode]);

    const blockNode = graphStatements(g, ifStatement.statements);
    g.createEdge([result, blockNode]);


    if(ifStatement.elseStatment !== null){
        const elseNode = g.createNode(`Else${AstNode.getNextAstNodeId()}`, {
            [attribute.label]: "else",
            [attribute.shape]: 'box',
        });
        g.createEdge([result, elseNode]);
        let elseSubNode = graphStatement(g, ifStatement.elseStatment);
        g.createEdge([elseNode, elseSubNode]);
    }

    return result;
}

function graphForStatement(g:Digraph, forStatement:ForStatement):INode{
    
    const result = g.createNode(`ForStatement${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "For",
        [attribute.shape]: 'box',
    });

    let initialExprName = g.createNode(`for_init_expr${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Initial Action",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, initialExprName]);
    if(forStatement.initialExpression !== null){
        if(forStatement.initialExpression instanceof Statement){
            let initialDeclaration = graphStatement(g, forStatement.initialExpression as Statement);
            g.createEdge([initialExprName, initialDeclaration]);
        }
        else{//It must be expression
            let initialExprNode = graphExpression(g, forStatement.initialExpression as Expression);
            g.createEdge([initialExprName, initialExprNode]);
        }
    }

    const conditionName = g.createNode(`for_condition${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Condition",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, conditionName]);
    if(forStatement.condicion !== null){
        let conditionNode = graphExpression(g, forStatement.condicion);
        g.createEdge([conditionName, conditionNode]);
    }

    const finalExprName = g.createNode(`for_final_expr${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Final Action",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, finalExprName]);
    if(forStatement.finalExpression !== null){
        let finalExprNode = graphExpression(g, forStatement.finalExpression);
        g.createEdge([finalExprName, finalExprNode]);
    }

    const blockNode = graphStatements(g, forStatement.statements);
    g.createEdge([result, blockNode]);

    return result;
}

function graphForInStatement(g:Digraph, forInStatement:ForInStatement):INode{

    const result = g.createNode(`ForInStatement${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "For...in",
        [attribute.shape]: 'box',
    });

    let variableNode = g.createNode(`for_in_var_node${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Variable",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, variableNode]);
    let varName = g.createNode(`for_in_var_name${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: `Identifier\n${forInStatement.variableId}`,
        [attribute.shape]: 'box',
    });
    g.createEdge([variableNode, varName]);

    let enumerableNode = g.createNode(`for_in_enumerable${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Enumerable",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, enumerableNode]);
    let enumerableExpr = graphExpression(g, forInStatement.enumerable);
    g.createEdge([enumerableNode, enumerableExpr]);

    const blockNode = graphStatements(g, forInStatement.statements);
    g.createEdge([result, blockNode]);

    return result;
}

function graphForOfStatement(g:Digraph, forOfStatement:ForOfStatement):INode{
    
    const result = g.createNode(`ForOfStatement${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "For...of",
        [attribute.shape]: 'box',
    });

    let variableNode = g.createNode(`for_of_var_node${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Variable",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, variableNode]);
    let varName = g.createNode(`for_of_var_name${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: `Identifier\n${forOfStatement.variableId}>`,
        [attribute.shape]: 'box',
    });
    g.createEdge([variableNode, varName]);

    let iterableNode = g.createNode(`for_of_iteralbe${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "Iterable",
        [attribute.shape]: 'box',
    });
    g.createEdge([result, iterableNode]);
    let iterableExpr = graphExpression(g, forOfStatement.iterable);
    g.createEdge([iterableNode, iterableExpr]);

    const blockNode = graphStatements(g, forOfStatement.statements);
    g.createEdge([result, blockNode]);

    return result;
}

function graphSwitch(g:Digraph, switchStatement:SwitchStatement):INode{

    const result = g.createNode(`switch_stmt${AstNode.getNextAstNodeId()}`, {
        [attribute.label]: "switch",
        [attribute.shape]: 'box',
    });

    let expressionNode = graphExpression(g, switchStatement.expr);
    g.createEdge([result, expressionNode]);

    for (const switchInstruction of switchStatement.switchInstructions) {
        if(switchInstruction instanceof Statement){
            let statementNode = graphStatement(g, switchInstruction);
            g.createEdge([result, statementNode]);
        }
        else if(switchInstruction instanceof SwitchCase){
            let caseExprNodeName = g.createNode(`switch_case${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: "case:",
                [attribute.shape]: 'box',
            });
            let caseExprNode = graphExpression(g, switchInstruction.expr);
            g.createEdge([result, caseExprNodeName]);
            g.createEdge([result, caseExprNode]);
        }
        else if(switchInstruction instanceof SwitchDefault){
            let defaultNode = g.createNode(`switch_default${AstNode.getNextAstNodeId()}`, {
                [attribute.label]: "default:",
                [attribute.shape]: 'box',
            });
            g.createEdge([result, defaultNode]);
        }
        else{//Type switch assertion
            throw new Error(`graphSwitch not implemented for ${switchInstruction}`);
        }
    }

    return result;
}