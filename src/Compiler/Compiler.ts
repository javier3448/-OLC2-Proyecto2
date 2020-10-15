import { RuntimeInterface, TsEntry } from "../app/app.component";
import { Env, Scope } from "./Environment";
import { Global_c_ir } from "./Global_c_ir";

import { Statement, StatementKind, WhileStatement, Block, 
         IfStatement, ForStatement, ForInStatement, ForOfStatement, 
         SwitchStatement, DoWhileStatement} from "../Ast/Statement";

import { MyType, MyTypeKind, TypeSignature } from "./MyType";
import { MyFunction, MyFunctionKind, GraficarTs, Parameter, MyNonNativeFunction } from "./MyFunction";
import { MyError, MyErrorKind } from './MyError';

import { Expression, ExpressionKind, FunctionCallExpression, LiteralExpression, 
         IdentifierExpression, MemberAccessExpression, BinaryExpression, UnaryExpression, 
         TernaryExpression, ObjectLiteralExpression, ArrayLiteralExpression } from '../Ast/Expression';
import { Declaration } from '../Ast/Declaration';
import { AccessKind, AttributeAccess, FunctionAccess, IndexAccess } from 'src/Ast/MemberAccess';
import { ArrayTypeNode, CustomTypeNode, MyTypeNode, MyTypeNodeKind } from 'src/Ast/MyTypeNode';
import { GlobalInstructions } from 'src/Ast/GlobalInstructions';
import { TypeDef, AttributeNode } from "../Ast/TypeDef";
import { FunctionDef, ParamNode } from "../Ast/FunctionDef";
import { ExprResult } from "./ExprResult"

//Casi siempre que retornemos un string asi nadamas significa que estamos retorna
//el C_IR generado por algun lang construct
//Convension: poner primero el C_IR en el retorno, ejemplo: [string, AlgoMasQueNecesitemos]

// REGION: 
let runtimeInterface:RuntimeInterface;

export function graficar_ts(){
    console.log(Env.current);

    let iter = Env.current;
    let count = 0;

    while(iter != null){
        //type signatures
        for (const key in iter.myTypeSignatures) {
            let typeSignature = iter.myTypeSignatures[key];
            runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, "-", typeSignature.getName()));
        }
        //Function signatures
        for (const key in iter.myFunctions) {
            let funcSignature = iter.myFunctions[key];
            runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, funcSignature.getTypeString(), "-"));
        }
        //Variables:
        for (const key in iter.myVariables) {
            let variable = iter.myVariables[key];
            //@Fix-me
            //runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, variable.myType.getName(), variable.myObj.toPrintableString()));
        }
        iter = iter.previous;
        count++;
    }
}

export function resetRuntimeInterface(){
    runtimeInterface.tsDataSet = [];
    runtimeInterface.intermediateRepresentation = "";
}
// END: IO functions

//Tienen el ultimo temp que fue utilizado
//Si estan en 0 es porque no se utilizo ningun temp o label
export let tempCount = 0;
export let labelCount = 0;

function getNextTemp():string{
    tempCount += 1;
    return "T" + tempCount;
}

function construct_c_ir_header():string{
    //El primer numero entero que un IEEE754 no puede 
    //representar exactamente: https://stackoverflow.com/questions/3793838/which-is-the-first-integer-that-an-ieee-754-float-is-incapable-of-representing-e
    //For float, 16,777,217 (2^24 + 1).        
    //For double, 9,007,199,254,740,993 (2^53 + 1).
    let header = `#include <stdio.h> 
//TODO: Ver que tamano de stack es mejor (deberia ser mucho mas pequenno que el heap)
float heap[0xfffff];
float stack[0xfffff];
float p = 0;
float h = 0;
`;

    let temps = "";
    //temps.reverse(tempcount * algo que te diga el numero de caracteres por tep)
    //TERRIBLE PERF: si se hace un malloc cada 
    //               concatenacion de string y no hacemos el reserve
    for(let i = 1; i <= tempCount; i++){
        temps += "T" + i.toString() + ", ";
    }
    //Quitamos la ultima coma
    if(temps.length > 2){
        temps = "float " + temps.slice(0, temps.length - 2) + ';\n';
    }

    header += temps + `\nint main(){\n`;

    return header;
}

function construct_c_ir_foot():string{
    let foot = "";//cerramos el main

    //DEBUG: para debuggear facilmente las expresiones imprimimos el valor
    //       del ultimo temporal
    //       Si es T0 nuesto c_ir no compila
    foot += "\n";
    foot += `printf("%f\\n", T${tempCount});\n`;

    foot += "\nreturn 0;\n}";

    return foot;
}

export function compile(root:GlobalInstructions, _runtimeInterface:RuntimeInterface):void{

    //varciar todas las 'interfaces' necesarias de runtimeInterface
    runtimeInterface = _runtimeInterface;
    resetRuntimeInterface();

    Env.initEnvironment();

    //resetear el conteo de temps y labels
    tempCount = 0;
    labelCount = 0;

    let global_c_ir = compileGlobalInstructions(root);

    runtimeInterface.intermediateRepresentation = construct_c_ir_header();
    runtimeInterface.intermediateRepresentation += global_c_ir.statements_c_ir;
    runtimeInterface.intermediateRepresentation += construct_c_ir_foot();
}

export function compileGlobalInstructions(globalInstructions:GlobalInstructions):Global_c_ir{

    let funcs_c_ir = "";
    let statements_c_ir = "";

    for (const typeDef of globalInstructions.typeDefs) {
        try {
            compileTypeDef(typeDef);
        } catch (error) {
            if(error instanceof MyError){
                console.log(error);
                runtimeInterface.errorDataSet.push(error);
            }
            else{
                throw error;
            }
        }
    }
    //revisamos si quedo algun tipo sin definir
    for (const key in Env.global.myTypeSignatures) {
        let myType = Env.global.myTypeSignatures[key]
        if(myType.kind === MyTypeKind.WAITING){
            let myError = new MyError(`No se encontro definicion para el tipo: '${key}'. Se definira con {} para continuar la ejecucion`);
            //This error doesnt have a location
            console.log(myError);
            runtimeInterface.errorDataSet.push(myError);
            myType.kind = MyTypeKind.CUSTOM;
            myType.specification = new TypeSignature(key);
        }
            
    }

    for (const functionDef of globalInstructions.functionDefs) {
        try {
            compileFunctionDef(functionDef);
        } catch (error) {
            if(error instanceof MyError){
                console.log(error);
                runtimeInterface.errorDataSet.push(error);
            }
            else{
                throw error;
            }
        }
    }

    for (const statement of globalInstructions.statements) {
        let result = compileStatement(statement);
        statements_c_ir += result;
    }

    return new Global_c_ir(funcs_c_ir, statements_c_ir);
}

export function compileFunctionDef(functionDefNode:FunctionDef){
    throw new Error("Not implemented yet!");
}

export function compileTypeDef(typeDef:TypeDef){

    throw new Error("Not implemented yet!");
}

export function compileStatement(statement:Statement):string{

    try {
        let child = statement.child;

        switch (statement.statementKind) {
            case StatementKind.ExpressionKind:
                // No retornamos lo de expression porque no es posible que 
                // expression retorne jumper
                
                return compileExpression(child as Expression).c_ir;
            default:
                throw new Error(`runStatment no implementado para myTypeNode: ${statement.statementKind}`);
        }
    } catch (myError) {
        if(myError instanceof MyError){
            if(myError.isLocationNull()){
                myError.setLocation(statement.astNode);
            }
            console.log(myError);
            runtimeInterface.errorDataSet.push(myError);
            return;
        }else{
            throw myError;
        }
    }

}

export function compileExpression(expr:Expression):ExprResult{

    try{
        return compileExpressionImp(expr);
    }catch(myError){
        if(myError instanceof MyError){
            myError.setLocation(expr.astNode);
        }
        throw myError;
    }

    function compileExpressionImp(exp:Expression):ExprResult{

        if(expr.specification instanceof BinaryExpression){
            let leftResult = compileExpression(expr.specification.left);
            let rightResult = compileExpression(expr.specification.right);

            switch (expr.expressionKind) {
                case ExpressionKind.ADDITION:
                {
                    //revisamos errores de tipos:
                    if(leftResult.myType.kind === MyTypeKind.STRING ||
                       rightResult.myType.kind === MyTypeKind.STRING){
                        throw new Error("implementacion de suma con strings no implementado todavia!");
                    }
                    else if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        //generamos el c_ir y retornamos el ExprResult
                        let temp = getNextTemp();

                        let c_ir = leftResult.c_ir +
                                   rightResult.c_ir +
                                   `${temp} = ${leftResult.derefVal()} + ${rightResult.derefVal()};\n`;

                        return new ExprResult(MyType.numberTypeInstance, false, false, temp, c_ir);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }

                }break;
                case ExpressionKind.SUBSTRACTION:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        //generamos el c_ir y retornamos el ExprResult
                        let temp = getNextTemp();

                        let c_ir = leftResult.c_ir +
                                   rightResult.c_ir +
                                   `${temp} = ${leftResult.derefVal()} - ${rightResult.derefVal()};\n`;

                        return new ExprResult(MyType.numberTypeInstance, false, false, temp, c_ir);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.MULTIPLICATION:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        //generamos el c_ir y retornamos el ExprResult
                        let temp = getNextTemp();

                        let c_ir = leftResult.c_ir +
                                   rightResult.c_ir +
                                   `${temp} = ${leftResult.derefVal()} * ${rightResult.derefVal()};\n`;

                        return new ExprResult(MyType.numberTypeInstance, false, false, temp, c_ir);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.MODULUS:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        //generamos el c_ir y retornamos el ExprResult
                        let temp = getNextTemp();

                        let c_ir = leftResult.c_ir +
                                   rightResult.c_ir +
                                   `${temp} = ${leftResult.derefVal()} % ${rightResult.derefVal()};\n`;

                        return new ExprResult(MyType.numberTypeInstance, false, false, temp, c_ir);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.DIVISION:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        //generamos el c_ir y retornamos el ExprResult
                        let temp = getNextTemp();

                        let c_ir = leftResult.c_ir +
                                   rightResult.c_ir +
                                   `${temp} = ${leftResult.derefVal()} / ${rightResult.derefVal()};\n`;

                        return new ExprResult(MyType.numberTypeInstance, false, false, temp, c_ir);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.POWER :
                {
                    throw new Error(`operacion binaria: ${expr.expressionKind} no implementada todavia`);
                }break;
                case ExpressionKind.ASSIGNMENT:
                {
                    throw new Error(`operacion binaria: ${expr.expressionKind} no implementada todavia`);
                }break;
            

                default:
                    throw new Error(`operacion binaria: ${expr.expressionKind} no implementada todavia`);
            }
        }
        else if(expr.specification instanceof UnaryExpression){
            let unaryExpr = expr.specification as UnaryExpression;
            //El valor a aplicar la operacion unaria
            let operand = compileExpression(unaryExpr.expr);//we dont do the .getObj() because we might need the pointer for some operations
            let operandType = operand.myType;

            //At this point we know that expr.kind must be UNARY_MINUS, NEGATION, POSTFIX_INC, POSTFIX_DEC
            switch(expr.expressionKind){
                case ExpressionKind.UNARY_MINUS:
                {
                    throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                    if(operandType.kind === MyTypeKind.NUMBER){
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, `Operador '${expr.expressionKind}' no acepta los tipos: '${operandType.kind}'`);
                    }
                }break;
                case ExpressionKind.NEGATION:
                    throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                    break;
                case ExpressionKind.POSTFIX_INC:
                    throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                    break;
                case ExpressionKind.POSTFIX_DEC:
                    throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                    break;
            }
        }

        //If we reach this point in the code it means that the expression must
        //be atomic or ternary, which means that for each possible expr.expressionKind
        //there is a different type for expr.specification. 
        switch (expr.expressionKind) {
            case ExpressionKind.FUNCTION_CALL:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.IDENTIFIER:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            //The way we traverse member access is kinda weird because the way the AST is shaped
            //but we wont bother to describe it in a comment :/
            case ExpressionKind.MEMBER_ACCESS:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.LITERAL:
            {
                let lit  = expr.specification as LiteralExpression;

                if(lit.literal instanceof String){
                    throw new Error(`expression literal no implementado para: string todavia`);
                }
                else if(lit.literal instanceof Number){
                    return new ExprResult(MyType.numberTypeInstance, true, false, lit.literal.valueOf(), "");
                }
                else if(lit.literal instanceof Boolean){
                    let val = (lit.literal.valueOf() ? 1 : 0);
                    return new ExprResult(MyType.booleanTypeInstance, true, false, val, "");
                }
                else{
                    throw new Error(`expression literal no implementado para: ${lit.literal}`);
                }
            }break;
            case ExpressionKind.OBJECT_LITERAL:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.ARRAY_LITERAL:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.TERNARY:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;

            default:
                throw new Error(`runExpression no implementado para expressionKind: '${expr.expressionKind}'`);
        }
    }
}