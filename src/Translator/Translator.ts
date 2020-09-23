import { parser } from "./TranslatorParser";
import { RuntimeInterface, TsEntry } from "../app/app.component";
import { TypeDef } from 'src/Ast/TypeDef';
import { FunctionDef } from 'src/Ast/FunctionDef';
import { Statement, StatementKind, WhileStatement, Block, IfStatement, ForStatement, ForInStatement, ForOfStatement, SwitchStatement, DoWhileStatement} from "../Ast/Statement";
import { Expression, ExpressionKind, FunctionCallExpression, LiteralExpression, IdentifierExpression, 
         MemberAccessExpression, BinaryExpression, UnaryExpression, TernaryExpression, ObjectLiteralExpression, 
         ArrayLiteralExpression } from '../Ast/Expression';
import { AccessKind, AttributeAccess, FunctionAccess, IndexAccess, MemberAccess } from 'src/Ast/MemberAccess';
import { GlobalInstructionsRunner } from "src/Ast/GlobalInstructionsRunner";
import { Declaration } from 'src/Ast/Declaration';
import { ArrayTypeNode, CustomTypeNode, MyTypeNode, MyTypeNodeKind } from 'src/Ast/MyTypeNode';

let runtimeInterface:RuntimeInterface;

// a single level of indentation
const indentUnit = "    ";

//Agrega al string de traduccion
export function myPrintTranslation(translateSource:string){
    runtimeInterface.translation += translateSource;
}

export function graficar_ts(){
    throw new Error ("graficar_ts() no implementado para traduccion todavia!!!!");
}

export function testTranslate(source:string, _runtimeInterface:RuntimeInterface):void{
    console.log("l0ol");

    //varciar todas las 'interfaces' necesarias de runtimeInterface
    runtimeInterface = _runtimeInterface;
    resetRuntimeInterface();

    // we start walking that damn AST for realz here
    let root =  parser.parse(source) as GlobalInstructionsRunner;

    translateGlobalInstructions(root);
}

export function resetRuntimeInterface(){
    runtimeInterface.translation = "";
}

export function translateGlobalInstructions(globalInstructions:GlobalInstructionsRunner):void{

    let result = "";

    for (const typeDef of globalInstructions.typeDefs) {
        result += translateTypeDef("", typeDef);
    }

    result += "\n";

    for (const functionDef of globalInstructions.functionDefs) {
        result += translateFunctionDef("", functionDef);
    }

    result += "\n";

    for (const statement of globalInstructions.statements) {
        result += translateStatement("", statement);
    }

    myPrintTranslation(result);
}

export function translateTypeDef(indent:string, typeDef:TypeDef):string{
    let result = indent + "type " + typeDef.name + " = {\n";
    let newIndent = indent + indentUnit;

    for (const attribute of typeDef.attributes) {
        result += newIndent + attribute.name + ":" + translateTypeNode(indent, attribute.myTypeNode) + ",\n";
    }

    result += indent + "}\n";

    return result;
}

export function translateFunctionDef(indent:string, functionDef:FunctionDef):string{
    throw new Error("not implemented yet");
}

export function translateStatement(indent:string, statement:Statement){
    let child = statement.child;

    switch (statement.statementKind) {
        case StatementKind.ExpressionKind:
            // No retornamos lo de expression porque no es posible que 
            // expression retorne jumper
            
            return indent + translateExpression(indent, child as Expression) + ";\n";

        case StatementKind.DeclarationKind:
            return translateDeclaration(indent, child as Declaration);

        case StatementKind.BlockKind:
            return translateBlock(indent, child as Block);

        case StatementKind.BreakKind:
            return indent + "break;\n";

        case StatementKind.ContinueKind:
            return indent + "continue;\n";

        case StatementKind.ReturnKind:
            return indent + "return;\n";

        case StatementKind.ReturnWithValueKind:
            return indent + "return " + translateExpression(indent, (child as Expression)) + ";";

        case StatementKind.IfKind:
            return translateIfStatment(indent, child as IfStatement);

        case StatementKind.WhileKind:
            return translateWhile(indent, child as WhileStatement);

        case StatementKind.DoWhileKind:
            return translateDoWhile(indent, child as DoWhileStatement);

        case StatementKind.ForKind:
            return translateFor(indent, child as ForStatement);

        case StatementKind.ForInKind:
            return translateForIn(indent, child as ForInStatement);

        case StatementKind.ForOfKind:
            return translateForOf(indent, child as ForOfStatement);

        case StatementKind.SwitchKind:
            return translateSwitch(indent, child as SwitchStatement);

        default:
            throw new Error(`translateStatment no implementado para myTypeNode: ${statement.statementKind}`);
    }
}

export function translateExpression(indent:string, expr:Expression):string{

    let result = "";
    let spec = expr.specification;
    
    if(spec instanceof UnaryExpression){
        if(expr.expressionKind == ExpressionKind.UNARY_MINUS){
            result = "-" +  translateExpression(indent, spec.expr);
        }
        else{
            result = expr.expressionKind + translateExpression(indent, spec.expr);
        }
    }
    else if(spec instanceof BinaryExpression){
        result = `${translateExpression(indent, spec.left)} ${expr.expressionKind} ${translateExpression(indent, spec.right)}`
    }
    else if(spec instanceof TernaryExpression){
        result = `${translateExpression(indent, spec.left)} ? ${translateExpression(indent, spec.middle)} : ${translateExpression(indent, spec.right)}`
    }
    else if(spec instanceof IdentifierExpression){
        result = spec.name;
    }
    else if(spec instanceof LiteralExpression){
        result = translateLiteralExpression(indent, spec);
    }
    else if(spec instanceof MemberAccessExpression){
        result = translateMemberAccess(indent, spec);
    }
    else if(spec instanceof ObjectLiteralExpression){
        result = translateObjectLiteral(indent, spec);
    }
    else if(spec instanceof ArrayLiteralExpression){
        result = translateArrayLiteral(indent, spec);
    }

    return result;
}

export function translateLiteralExpression(indent:string, lit:LiteralExpression):string{
        let val = lit.literal;
        if(val instanceof String){
            return '"' + (val as String).valueOf() + '"';
        }
        else if(val instanceof Number){
            return (val as Number).toString();
        }
        else if(val instanceof Boolean){
            return (val as Boolean).toString();
        }
        else if(val === undefined){
            return "undefined"
        }
        else if(val === null){
            return "null"
        }else{
            throw new Error(`makePrimitivePointer no soportado todavia para: ${val}`)
        }
}

export function translateMemberAccess(indent:string, memberAccessExpression:MemberAccessExpression):string{

    let result = translateExpression(indent, memberAccessExpression.expression);

    let access = memberAccessExpression.memberAccess.access;
    
    if(access instanceof FunctionAccess){
        result += "." + access.functionName + "(";

        let args = access.functionArguments;
        if(args.length < 1){
            result += ")";
        }
        else{
            result += translateExpression(indent, args[0]);
            for (let i = 1; i < args.length; i++) {
                result += ", " + translateExpression(indent, args[i]);
            }
            result += ")";
        }
    }
    else if(access instanceof IndexAccess){
        result += "[" + translateExpression(indent, access.index) + "]";
    }
    else if(access instanceof AttributeAccess){
        result += "." + access.name;
    }

    return result;

}

export function translateObjectLiteral(indent:string, objectLiteral:ObjectLiteralExpression):string{
    let result = "{";
    let properties = objectLiteral.propertyNodes;
    if(properties.length < 1){
        result += "}";
    }
    else{
        result += properties[0].id + ": " + translateExpression(indent, properties[0].expr);
        for (let i = 1; i < properties.length; i++) {
            result += ", " + properties[i].id + ": " + translateExpression(indent, properties[i].expr);
        }
        result += "}";
    }
    return result;
}

export function translateArrayLiteral(indent:string, arrayLiteral:ArrayLiteralExpression):string{
    let result = "[";
    let expressions = arrayLiteral.expressions;
    if(expressions.length < 1){
        result += "]";
    }
    else{
        result += translateExpression(indent, expressions[0]);
        for (let i = 1; i < expressions.length; i++) {
            result += ", " + translateExpression(indent, expressions[i]);
        }
        result += "]";
    }
    return result;
}

export function translateDeclaration(indent:string, decl:Declaration):string{

    let result = indent + "let " + decl.identifier;

    if(decl.myTypeNode !== null){
        result += ":" + translateTypeNode(indent, decl.myTypeNode);
    }

    if(decl.expression !== null){
        result += " = " + translateExpression(indent, decl.expression);
    }

    result += ";\n";

    return result;
}

export function translateTypeNode(indent:string, typeNode:MyTypeNode):string{

    //Casos especiales:
    if(typeNode.kind === MyTypeNodeKind.BOXY_ARRAY){
        let spec = typeNode.spec as ArrayTypeNode;
        return translateTypeNode(indent, spec.subType) + "[]";
    }
    else if(typeNode.kind === MyTypeNodeKind.GENERIC_ARRAY){
        let spec = typeNode.spec as ArrayTypeNode;
        return "Array<" + translateTypeNode(indent, spec.subType) + ">";
    }
    else if(typeNode.kind === MyTypeNodeKind.CUSTOM){
        let spec = typeNode.spec as CustomTypeNode;
        return spec.name;
    }

    return typeNode.kind.toLowerCase();
}

export function translateBlock(indent:string, block:Block):string{
    let result = indent + "{\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, block.statements);
    
    result += indent + "}\n";

    return result;
}

export function translateStatements(indent:string, statements:Statement[]){
    let result = "";

    for (const stmt of statements) {
        result += translateStatement(indent, stmt);       
    }

    return result;
}

export function translateIfStatment(indent:string, ifStatement:IfStatement):string{
    let result = indent + "if(" + translateExpression(indent, ifStatement.expr) + "){\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, ifStatement.statements);
    
    result += indent + "}\n";

    return result;
}

export function translateWhile(indent:string, whileStatement:WhileStatement):string{
    let result = indent + "while(" + translateExpression(indent, whileStatement.expr) + "){\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, whileStatement.statements);
    
    result += indent + "}\n";

    return result;
}

export function translateDoWhile(indent:string, doWhileStatement:DoWhileStatement):string{
    let result = indent + "doWhile{\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, doWhileStatement.statements);
    
    result += indent + "}do(" + translateExpression(indent, doWhileStatement.expr) + ");\n";

    return result;
}

export function translateFor(indent:string, forStatement:ForStatement):string{

    let result = indent + "for(";
    const newIndent = indent + indentUnit;

    if(forStatement.initialExpression === null){
        result += "; ";
    }
    else if(forStatement.initialExpression instanceof Statement){
        //We pass no indentation here because in this exceptional case statement is not like a line in the program
        result += translateStatement("", forStatement.initialExpression);
        //CHAPUZ HORRIBLE D:
        //le quitamos el salto de line porque translateStatement siempre pone un salto de linea al final :(
        result = result.slice(0, result.length - 1) + " ";
    }
    else{//must be an expression
        result += translateExpression(indent, forStatement.initialExpression) + "; ";
    }

    if(forStatement.condicion === null){
        result += "; ";
    }
    else{
        result += translateExpression(indent, forStatement.condicion) + "; ";
    }

    if(forStatement.finalExpression === null){
        result += "";
    }
    else{
        result += translateExpression(indent, forStatement.finalExpression);
    }

    result += "){\n";
    
    result += translateStatements(newIndent, forStatement.statements);
    
    result += indent + "}\n";

    return result;
}

export function translateForIn(indent:string, forInStatement:ForInStatement):string{
    //BUG: cuando metamos el const aqui se perderia :(
    let result = indent + "for(let " + forInStatement.variableId + " in " + translateExpression(indent, forInStatement.enumerable) + "){\n";
    const newIndent = indent + indentUnit;

    result += translateStatements(newIndent, forInStatement.statements);
    
    result += indent + "}\n";

    return result;
}

export function translateForOf(indent:string, forOfStatement:ForOfStatement):string{
    //BUG: cuando metamos el const aqui se perderia :(
    let result = indent + "for(let " + forOfStatement.variableId + " of " + translateExpression(indent, forOfStatement.iterable) + "){\n";
    const newIndent = indent + indentUnit;

    result += translateStatements(newIndent, forOfStatement.statements);
    
    result += indent + "}\n";

    return result;
}

export function translateSwitch(indent:string, switchStatement:SwitchStatement):string{
    let result = indent + "switch(" + translateExpression(indent, switchStatement.expr) + "){\n";

    const caseIndent = indent + indentUnit;
    const statementIndent = caseIndent + indentUnit;
    
    let stmts = switchStatement.switchInstructions.statements;
    let cases = switchStatement.switchInstructions.cases;
    let defaults = switchStatement.switchInstructions.defaults;

    let stmtIndex = 0;
    let caseIndex = 0;
    let defaultIndex = 0;
    //NOTE: if a case and a default are written next to each other we can no longer
    //guarantee they will be graphed in the order they were originally written.
    //this doesn't affect the behaviour when running tho
    //TODO: honestly this whole 'for' needs some serious testing
    for(;stmtIndex < stmts.length || caseIndex < cases.length || defaultIndex < defaults.length;){//maybe we dont need the for condition to be so 'exhaustive'
        if(caseIndex < cases.length && 
            cases[caseIndex].nextStatement <= stmtIndex){

            result += caseIndent + "case " + translateExpression(caseIndent, cases[caseIndex].expr) + ":\n";
            caseIndex++;
        }
        else if(defaultIndex < defaults.length && 
            defaults[defaultIndex].nextStatement <= stmtIndex){

            result += caseIndent + "default:\n";
            defaultIndex++;
        }
        else{

            result += translateStatement(statementIndent, stmts[stmtIndex]);
            stmtIndex++;
        }
    }

    result += indent + "}\n";

    return result;
}
