import { RuntimeInterface, TsEntry } from "../app/app.component";
import { TypeDef } from 'src/Ast/TypeDef';
import { Statement, StatementKind, WhileStatement, Block, IfStatement, ForStatement, ForInStatement, ForOfStatement, SwitchStatement, DoWhileStatement} from "../Ast/Statement";
import { Expression, ExpressionKind, FunctionCallExpression, LiteralExpression, IdentifierExpression, 
         MemberAccessExpression, BinaryExpression, UnaryExpression, TernaryExpression, ObjectLiteralExpression, 
         ArrayLiteralExpression } from '../Ast/Expression';
import { AccessKind, AttributeAccess, FunctionAccess, IndexAccess, MemberAccess } from 'src/Ast/MemberAccess';
import { Declaration } from 'src/Ast/Declaration';
import { ArrayTypeNode, CustomTypeNode, MyTypeNode, MyTypeNodeKind } from 'src/Ast/MyTypeNode';
import { GlobalInstructionsTranslator } from 'src/Ast/GlobalInstructionsTranslator';
import { FunctionDefTranslator } from 'src/Ast/FunctionDefTranslator';
import { MyError, MyErrorKind } from 'src/Runner/MyError';
import { ParamNode } from 'src/Ast/FunctionDef';

// DECISION: Vamos a agregarle '__' id '__' a todas las funciones que esten adentro de otra.
//           luego reemplazaramos todas las llamadas a dichas funciones con el nuevo
//           nombre
// Ejemplo:
// function foo():void{
//     function bar():void{
//         function baz(){
//             foo();
//             bar();
//             baz();
//         }
//         bar();
//         if(bar() == undefined){
//             //...
//         }
//     }
//     bar();
// }
//
// se convierte en:
//
// function foo():void{
//     bar();
// }
// function __2__bar():void{
//     __2__bar();
//     if(__2__bar() == undefined){
//         //...
//     }
// }
//function __3__baz(){
//    foo();
//    __2__bar();
//    __3__baz();
//}

//staticId should be a static variable inside makeNewName. but TS doesnt like that
let staticId = 0;
export function makeNewName(oldName:string):string{
    return "__" + (++staticId) + "__" + oldName;
}

//SIMILAR TO THE Env module we use in Runner.
//but this is for renaming funcs only. and we do pass it all over the place
//as a arg instead of using a global variable
export class FuncNamesSymbolTable{
    //key:     oldName
    //value:   newname
    [key: string]: string;
}

export class FuncNamesToReplace{
    table:FuncNamesSymbolTable;
    prev:(FuncNamesToReplace | null);

    constructor(prev:(FuncNamesToReplace | null)) {
        this.table = new FuncNamesSymbolTable();
        this.prev = prev;
    }

    //return null if there is no entry for oldName in this.table or
    //in any of its previous.table
    getNewName(oldName:string):(string | null){
        let newName = this.table[oldName];
        if(newName === undefined){
            if(this.prev === null){
                return null;
            }
            return this.prev.getNewName(oldName);
        }
        return newName;
    }
}

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

export function testTranslate(root:GlobalInstructionsTranslator, _runtimeInterface:RuntimeInterface):void{

    //varciar todas las 'interfaces' necesarias de runtimeInterface
    runtimeInterface = _runtimeInterface;
    resetRuntimeInterface();

    translateGlobalInstructions(root);
}

export function resetRuntimeInterface(){
    runtimeInterface.translation = "";
}

export function translateGlobalInstructions(globalInstructions:GlobalInstructionsTranslator):void{

    let result = "";

    for (const instruction of globalInstructions.instructions) {
        if(instruction instanceof FunctionDefTranslator){
            result += "\n";
            result += translateFunctionDef("", instruction, new FuncNamesToReplace(null));
            result += "\n";
        }
        else if(instruction instanceof TypeDef){
            result += "\n";
            result += translateTypeDef("", instruction);
            result += "\n";
        }
        else{//Must be a statement
            result += translateStatement("", instruction, new FuncNamesToReplace(null));
        }
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

//returnedValue[0] is the translation of the function itself.
//returnedValue[1] is the translation of its subFunctions
export function translateFunctionDef(indent:string, functionDef:FunctionDefTranslator, funcNamesToReplace:FuncNamesToReplace):string{

    //result will contain the resulting string of this functionDef
    //we dont need to check for new names here (in functionDef.name) because everytime we change the name of a subFunction
    //we change the name in its node as well
    let result = indent + "function " + functionDef.name + "(" + trasnlateCommaSeparatedParams(indent, functionDef.params) + "):" + translateTypeNode(indent, functionDef.returnType) + "{\n";
    let newIndent = indent + indentUnit;

    //hacemos un nuevo scope para esta functionDef
    let newScope = new FuncNamesToReplace(funcNamesToReplace);

    //agregamos todas las subfunciones de esta function a newScope
    for (let i = 0; i < functionDef.functionDefsTranslator.length; i++) {
        let subFunctionDef = functionDef.functionDefsTranslator[i];
        //Solo debemos chequear que no existan nombre repetidos en el mismo scope, no sus anteriores
        if(newScope.table[subFunctionDef.name] !== undefined){
            let myError = new MyError(`Ya existe una funcion con el nombre: ${subFunctionDef.name} adentro de la funcion: ${functionDef.name}. Se omitira la segunda definicion`);
            myError.setLocation(subFunctionDef.astNode);
            myError.kind = MyErrorKind.TRANSLATION;
            console.log(myError);
            runtimeInterface.errorDataSet.push(myError);
            //Quitamos la funcion repetida del nodo functionDef.
            functionDef.functionDefsTranslator.splice(i, 1);
        }
        else{
            let newName = makeNewName(subFunctionDef.name);
            newScope.table[subFunctionDef.name] = newName; 
            subFunctionDef.name = newName;
        }
    }

    //We translate this funcs statements with the newNames (newScope) to replace
    for (const statement of functionDef.statements) {
        result += translateStatement(newIndent, statement, newScope);
    }

    result += indent + "}\n";

    //Perf: way too many string concats there has to be a better way
    for (const subFunctionDef of functionDef.functionDefsTranslator) {
        result += translateFunctionDef(indent, subFunctionDef, newScope);
    }

    return result;
}

export function translateStatement(indent:string, statement:Statement, funcNamesToReplace:FuncNamesToReplace){
    let child = statement.child;

    switch (statement.statementKind) {
        case StatementKind.ExpressionKind:
            // No retornamos lo de expression porque no es posible que 
            // expression retorne jumper
            
            return indent + translateExpression(indent, child as Expression, funcNamesToReplace) + ";\n";

        case StatementKind.DeclarationKind:
            return translateDeclaration(indent, child as Declaration, funcNamesToReplace);

        case StatementKind.BlockKind:
            return translateBlock(indent, child as Block, funcNamesToReplace);

        case StatementKind.BreakKind:
            return indent + "break;\n";

        case StatementKind.ContinueKind:
            return indent + "continue;\n";

        case StatementKind.ReturnKind:
            return indent + "return;\n";

        case StatementKind.ReturnWithValueKind:
            return indent + "return " + translateExpression(indent, (child as Expression), funcNamesToReplace) + ";";

        case StatementKind.IfKind:
            return translateIfStatment(indent, child as IfStatement, funcNamesToReplace);

        case StatementKind.WhileKind:
            return translateWhile(indent, child as WhileStatement, funcNamesToReplace);

        case StatementKind.DoWhileKind:
            return translateDoWhile(indent, child as DoWhileStatement, funcNamesToReplace);

        case StatementKind.ForKind:
            return translateFor(indent, child as ForStatement, funcNamesToReplace);

        case StatementKind.ForInKind:
            return translateForIn(indent, child as ForInStatement, funcNamesToReplace);

        case StatementKind.ForOfKind:
            return translateForOf(indent, child as ForOfStatement, funcNamesToReplace);

        case StatementKind.SwitchKind:
            return translateSwitch(indent, child as SwitchStatement, funcNamesToReplace);

        default:
            throw new Error(`translateStatment no implementado para myTypeNode: ${statement.statementKind}`);
    }
}

export function translateExpression(indent:string, expr:Expression, funcNamesToReplace:FuncNamesToReplace):string{

    let result = "";
    let spec = expr.specification;
    
    if(spec instanceof UnaryExpression){

        switch (expr.expressionKind) {
            case ExpressionKind.UNARY_MINUS:
                result += '-' + translateExpression(indent, spec.expr, funcNamesToReplace);
                break;
            case ExpressionKind.NEGATION:
                result += 'NOT' + translateExpression(indent, spec.expr, funcNamesToReplace);
                break;
            case ExpressionKind.POSTFIX_INC:
                result += translateExpression(indent, spec.expr, funcNamesToReplace) + '++';
                break;
            case ExpressionKind.POSTFIX_DEC:
                result += translateExpression(indent, spec.expr, funcNamesToReplace) + '--';
                break;
        }
    }
    else if(spec instanceof BinaryExpression){
        result = `${translateExpression(indent, spec.left, funcNamesToReplace)} ${expr.expressionKind} ${translateExpression(indent, spec.right, funcNamesToReplace)}`
    }
    else if(spec instanceof TernaryExpression){
        result = `${translateExpression(indent, spec.left, funcNamesToReplace)} ? ${translateExpression(indent, spec.middle, funcNamesToReplace)} : ${translateExpression(indent, spec.right, funcNamesToReplace)}`
    }
    else if(spec instanceof IdentifierExpression){
        result = spec.name;
    }
    else if(spec instanceof FunctionCallExpression){
        let realName:string;

        let newName = funcNamesToReplace.getNewName(spec.name);
        if(newName !== null){
            realName = newName;
        }
        else{
            realName = spec.name;
        }

        result = realName + "(" + trasnlateCommaSeparatedExpressions(indent, spec.functionArgs, funcNamesToReplace) + ")";
    }
    else if(spec instanceof LiteralExpression){
        result = translateLiteralExpression(indent, spec, funcNamesToReplace);
    }
    else if(spec instanceof MemberAccessExpression){
        result = translateMemberAccess(indent, spec, funcNamesToReplace);
    }
    else if(spec instanceof ObjectLiteralExpression){
        result = translateObjectLiteral(indent, spec, funcNamesToReplace);
    }
    else if(spec instanceof ArrayLiteralExpression){
        result = translateArrayLiteral(indent, spec, funcNamesToReplace);
    }
    else{
        let a = spec;
    }

    return result;
}

export function translateLiteralExpression(indent:string, lit:LiteralExpression, funcNamesToReplace:FuncNamesToReplace):string{
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

export function translateMemberAccess(indent:string, memberAccessExpression:MemberAccessExpression, funcNamesToReplace:FuncNamesToReplace):string{

    let result = translateExpression(indent, memberAccessExpression.expression, funcNamesToReplace);

    let access = memberAccessExpression.memberAccess.access;
    
    if(access instanceof FunctionAccess){
        result += "." + access.functionName + "(";

        let args = access.functionArguments;
        if(args.length < 1){
            result += ")";
        }
        else{
            result += translateExpression(indent, args[0], funcNamesToReplace);
            for (let i = 1; i < args.length; i++) {
                result += ", " + translateExpression(indent, args[i], funcNamesToReplace);
            }
            result += ")";
        }
    }
    else if(access instanceof IndexAccess){
        result += "[" + translateExpression(indent, access.index, funcNamesToReplace) + "]";
    }
    else if(access instanceof AttributeAccess){
        result += "." + access.name;
    }

    return result;

}

export function translateObjectLiteral(indent:string, objectLiteral:ObjectLiteralExpression, funcNamesToReplace:FuncNamesToReplace):string{
    let result = "{";
    let properties = objectLiteral.propertyNodes;
    if(properties.length < 1){
        result += "}";
    }
    else{
        result += properties[0].id + ": " + translateExpression(indent, properties[0].expr, funcNamesToReplace);
        for (let i = 1; i < properties.length; i++) {
            result += ", " + properties[i].id + ": " + translateExpression(indent, properties[i].expr, funcNamesToReplace);
        }
        result += "}";
    }
    return result;
}

export function translateArrayLiteral(indent:string, arrayLiteral:ArrayLiteralExpression, funcNamesToReplace:FuncNamesToReplace):string{
    return "[" + trasnlateCommaSeparatedExpressions(indent, arrayLiteral.expressions, funcNamesToReplace) + "]";
}

export function trasnlateCommaSeparatedExpressions(indent:string, expressions:Expression[], funcNamesToReplace:FuncNamesToReplace):string{

    let result = "";

    if(expressions.length < 1){
        return result;
    }
    else{
        result += translateExpression(indent, expressions[0], funcNamesToReplace);
        for (let i = 1; i < expressions.length; i++) {
            result += ", " + translateExpression(indent, expressions[i], funcNamesToReplace);
        }
    }
    return result;
}

export function trasnlateCommaSeparatedParams(indent:string, params:ParamNode[]):string{

    let result = "";

    if(params.length < 1){
        return result;
    }
    else{
        result += params[0].name + ":" + translateTypeNode(indent, params[0].myTypeNode);
        for (let i = 1; i < params.length; i++) {
            result += ", " + params[i].name + ":" + translateTypeNode(indent, params[i].myTypeNode);
        }
    }
    return result;
}

export function translateDeclaration(indent:string, decl:Declaration, funcNamesToReplace:FuncNamesToReplace):string{

    let result = indent + "let " + decl.identifier;

    if(decl.myTypeNode !== null){
        result += ":" + translateTypeNode(indent, decl.myTypeNode);
    }

    if(decl.expression !== null){
        result += " = " + translateExpression(indent, decl.expression, funcNamesToReplace);
    }

    result += ";\n";

    return result;
}

//bodge, a bit dangerous: in typeNode is null it translates to 'void'
export function translateTypeNode(indent:string, typeNode:(MyTypeNode | null)):string{

    //Casos especiales:
    if(typeNode === null){
        return 'void';
    }
    else if(typeNode.kind === MyTypeNodeKind.BOXY_ARRAY){
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

export function translateBlock(indent:string, block:Block, funcNamesToReplace:FuncNamesToReplace):string{
    let result = indent + "{\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, block.statements, funcNamesToReplace);
    
    result += indent + "}\n";

    return result;
}

export function translateStatements(indent:string, statements:Statement[], funcNamesToReplace:FuncNamesToReplace){
    let result = "";

    for (const stmt of statements) {
        result += translateStatement(indent, stmt, funcNamesToReplace);       
    }

    return result;
}

export function translateIfStatment(indent:string, ifStatement:IfStatement, funcNamesToReplace:FuncNamesToReplace):string{
    let result = indent + "if(" + translateExpression(indent, ifStatement.expr, funcNamesToReplace) + "){\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, ifStatement.statements, funcNamesToReplace);
    
    result += indent + "}\n";

    return result;
}

export function translateWhile(indent:string, whileStatement:WhileStatement, funcNamesToReplace:FuncNamesToReplace):string{
    let result = indent + "while(" + translateExpression(indent, whileStatement.expr, funcNamesToReplace) + "){\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, whileStatement.statements, funcNamesToReplace);
    
    result += indent + "}\n";

    return result;
}

export function translateDoWhile(indent:string, doWhileStatement:DoWhileStatement, funcNamesToReplace:FuncNamesToReplace):string{
    let result = indent + "doWhile{\n";

    const newIndent = indent + indentUnit;
    
    result += translateStatements(newIndent, doWhileStatement.statements, funcNamesToReplace);
    
    result += indent + "}do(" + translateExpression(indent, doWhileStatement.expr, funcNamesToReplace) + ");\n";

    return result;
}

export function translateFor(indent:string, forStatement:ForStatement, funcNamesToReplace:FuncNamesToReplace):string{

    let result = indent + "for(";
    const newIndent = indent + indentUnit;

    if(forStatement.initialExpression === null){
        result += "; ";
    }
    else if(forStatement.initialExpression instanceof Statement){
        //We pass no indentation here because in this exceptional case statement is not like a line in the program
        result += translateStatement("", forStatement.initialExpression, funcNamesToReplace);
        //CHAPUZ HORRIBLE D:
        //le quitamos el salto de line porque translateStatement siempre pone un salto de linea al final :(
        result = result.slice(0, result.length - 1) + " ";
    }
    else{//must be an expression
        result += translateExpression(indent, forStatement.initialExpression, funcNamesToReplace) + "; ";
    }

    if(forStatement.condicion === null){
        result += "; ";
    }
    else{
        result += translateExpression(indent, forStatement.condicion, funcNamesToReplace) + "; ";
    }

    if(forStatement.finalExpression === null){
        result += "";
    }
    else{
        result += translateExpression(indent, forStatement.finalExpression, funcNamesToReplace);
    }

    result += "){\n";
    
    result += translateStatements(newIndent, forStatement.statements, funcNamesToReplace);
    
    result += indent + "}\n";

    return result;
}

export function translateForIn(indent:string, forInStatement:ForInStatement, funcNamesToReplace:FuncNamesToReplace):string{
    //BUG: cuando metamos el const aqui se perderia :(
    let result = indent + "for(let " + forInStatement.variableId + " in " + translateExpression(indent, forInStatement.enumerable, funcNamesToReplace) + "){\n";
    const newIndent = indent + indentUnit;

    result += translateStatements(newIndent, forInStatement.statements, funcNamesToReplace);
    
    result += indent + "}\n";

    return result;
}

export function translateForOf(indent:string, forOfStatement:ForOfStatement, funcNamesToReplace:FuncNamesToReplace):string{
    //BUG: cuando metamos el const aqui se perderia :(
    let result = indent + "for(let " + forOfStatement.variableId + " of " + translateExpression(indent, forOfStatement.iterable, funcNamesToReplace) + "){\n";
    const newIndent = indent + indentUnit;

    result += translateStatements(newIndent, forOfStatement.statements, funcNamesToReplace);
    
    result += indent + "}\n";

    return result;
}

export function translateSwitch(indent:string, switchStatement:SwitchStatement, funcNamesToReplace:FuncNamesToReplace):string{
    let result = indent + "switch(" + translateExpression(indent, switchStatement.expr, funcNamesToReplace) + "){\n";

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

            result += caseIndent + "case " + translateExpression(caseIndent, cases[caseIndex].expr, funcNamesToReplace) + ":\n";
            caseIndex++;
        }
        else if(defaultIndex < defaults.length && 
            defaults[defaultIndex].nextStatement <= stmtIndex){

            result += caseIndent + "default:\n";
            defaultIndex++;
        }
        else{

            result += translateStatement(statementIndent, stmts[stmtIndex], funcNamesToReplace);
            stmtIndex++;
        }
    }

    result += indent + "}\n";

    return result;
}
