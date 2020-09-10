import { Pointer } from "./Pointer"; 
import { ReturnValue, ReturnKind } from "./ReturnValue"; 
       
import { parser } from "./RunnerParser.js";
import { RuntimeInterface } from "../app/app.component";
import { Env, Scope } from "./Environment";

import { Statement } from "../Ast/Statement";

import { MyObj, MyTypeKind, CustomObj, MyType } from "./MyObj";
import { MyFunction, MyFunctionKind, GraficarTs, Parameter } from "./MyFunction";
import { MyError } from './MyError';
import { Expression, ExpressionKind, FunctionCallExpression, LiteralExpression, IdentifierExpression, MemberAccessExpression, BinaryExpression, UnaryExpression, TernaryExpression } from '../Ast/Expression';
import { Declaration } from '../Ast/Declaration';
import { Assignment } from '../Ast/Assignment';
import { AccessKind, AttributeAccess, FunctionAccess } from 'src/Ast/MemberAccess';
import { Attribute } from '@angular/core';
import { getLocaleNumberFormat } from '@angular/common';



// REGION: IO functions
let runtimeInterface:RuntimeInterface;

export function myPrint(/* pointer to static console instance, */ myObj:MyObj){
    runtimeInterface.myConsole += myObj.toPrintableString() + "\n";
}

export function resetRuntimeInterface(){
    runtimeInterface.myConsole = "";
}
// END: IO functions

//TODO: get a better name for the param runtimeInterface for the lo of god.
//NOTE: the name is like that because we cant use here
export function test(source:string, _runtimeInterface:RuntimeInterface):void{

    //varciar todas las 'interfaces' necesarias de runtimeInterface
    runtimeInterface = _runtimeInterface;
    resetRuntimeInterface();

    Env.initEnvironment();

    // we start walking that damn AST for realz here
    let root =  parser.parse(source) as Statement[];

    runStatements(root);
}

export function runStatements(statements:Statement[]):void{
    statements.forEach(statement => {
    runStatement(statement);
    });
}

export function runStatement(statement:Statement){
    // This is basically dynamic dispatching, but at least I can see it... I guess
    try {

        let child = statement.child;
        //TODO: Hacer un StatmentKind y cambiar esto por un switch de statement.kind
        if(child instanceof Expression){
            runExpression(child as Expression);
        }
        else if(child instanceof Declaration){
            throw new Error(`runStatment no implementado para Declaration`);
        }
        else if(child instanceof Assignment){
            throw new Error(`runStatment no implementado para Assignment`);
        }
        else{
            throw new Error(`runStatment no implementado para myTypeNode: ${child}`);
        }

    } catch (myError) {
        if(myError instanceof MyError){
            //throw myError;
            //TODO: que lo ponga en la tabla de errores o algo asi
            console.log(myError);
        }else{
            throw myError;
        }
    }

}

// function add
//[throws_MyError]
// Atrapa si la operacion no se puede realizar entre por los tipos de los operandos
export function runExpression(expr:Expression):ReturnValue{

    if(expr.specification instanceof BinaryExpression){

        //Chapuz: porque el orden en el que se evalua left y right expression
        //es de izquierda a derecha EXCEPTO por el operador **
        if(expr.expressionKind == ExpressionKind.POWER){
            let rightResult = runExpression(expr.specification.right).getMyObj();
            let rightType:MyType = rightResult.myType;
            let leftResult= runExpression(expr.specification.left).getMyObj();
            let leftType:MyType = leftResult.myType;

            if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                let leftValue:number = (leftResult.value as Number).valueOf();
                let rightValue:number = (rightResult.value as Number).valueOf();
                return ReturnValue.makeNumberReturn(leftValue ** rightValue);
            }
            else{
                throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
            }
        }

        //los operadores OR y AND tambien son casos especiales porque implementan
        //shorcircuiting como en C. Entonces hay casos en los que no se evaluan ambas 
        //expresiones
        if(expr.expressionKind == ExpressionKind.OR){
            throw new Error(`Binary expression no implemented for ${expr.expressionKind}`);
        }
        if(expr.expressionKind == ExpressionKind.AND){
            throw new Error(`Binary expression no implemented for ${expr.expressionKind}`);
        }
        
        let leftResult = runExpression(expr.specification.left).getMyObj();
        let leftType:MyType = leftResult.myType;
        let rightResult = runExpression(expr.specification.right).getMyObj();
        let rightType:MyType = rightResult.myType;

        switch (expr.expressionKind) {
            case ExpressionKind.LESS:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue < rightValue);
                }
                else if(leftType.kind == MyTypeKind.STRING && rightType.kind == MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue < rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.GREATER:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue > rightValue);
                }
                else if(leftType.kind == MyTypeKind.STRING && rightType.kind == MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue > rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.LESS_OR_EQUAL:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue <= rightValue);
                }
                else if(leftType.kind == MyTypeKind.STRING && rightType.kind == MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue <= rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.GREATER_OR_EQUAL:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue >= rightValue);
                }
                else if(leftType.kind == MyTypeKind.STRING && rightType.kind == MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue >= rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.EQUAL:
                // if(leftType.kind == MyTypeKind.NULL && rightType.kind != MyTypeKind.NULL
                //     ||
                //     leftType.kind != MyTypeKind.NULL && rightType.kind == MyTypeKind.NULL
                //     ||
                //     leftType.kind == MyTypeKind.UNDEFINED && rightType.kind != MyTypeKind.UNDEFINED
                //     ||
                //     leftType.kind != MyTypeKind.UNDEFINED && rightType.kind == MyTypeKind.UNDEFINED
                // )
                // {
                //     return ReturnValue.makeBooleanReturn(false);
                // }
                //Maybe we can just use the TS ==. idk :/
                //it is the easiest thing now, so fuck it 
                //TODO: Test the fuck out of this, it might not work at all
                //TODO: maybe using the value would be better i dont fucking now
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue == rightValue);
                }
                else if(leftType.kind == MyTypeKind.STRING && rightType.kind == MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue == rightValue);
                }
                else if(leftType.kind == MyTypeKind.BOOLEAN && rightType.kind == MyTypeKind.BOOLEAN){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue == rightValue);
                }

                //POTENCIAL BUG: WE CANT COMPARE POINTERS ANYMORE
                return ReturnValue.makeBooleanReturn(leftResult == rightResult);
            break;
            case ExpressionKind.NOT_EQUAL:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue != rightValue);
                }
                else if(leftType.kind == MyTypeKind.STRING && rightType.kind == MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue != rightValue);
                }
                else if(leftType.kind == MyTypeKind.BOOLEAN && rightType.kind == MyTypeKind.BOOLEAN){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue != rightValue);
                }

                //POTENCIAL BUG: WE CANT COMPARE POINTERS ANYMORE
                return ReturnValue.makeBooleanReturn(leftResult != rightResult);
            break;
            case ExpressionKind.ADDITION:
                if(leftType.kind == MyTypeKind.STRING || rightType.kind == MyTypeKind.STRING){
                    return ReturnValue.makeStringReturn(leftResult.myToString() + rightResult.myToString());
                }
                else if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(leftValue + rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.SUBSTRACTION:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(leftValue - rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.MULTIPLICATION:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(leftValue * rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.DIVISION:
                if(leftType.kind == MyTypeKind.NUMBER && rightType.kind == MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(leftValue / rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            default:
                throw new Error(`runExpression con expr.specification de tipo Binary expression no tienen implementacion para expression kind ${expr.expressionKind}`)
        }
    }
    else if(expr.specification instanceof UnaryExpression){
        throw new Error(`runExpression no implementado para ninguna UnaryExpression todavia`);
    }

    //If we reach this point in the code it means that the expression must
    //be atomic or ternary, which means that for each possible expr.expressionKind
    //there is a different type for expr.specification. 
    switch (expr.expressionKind) {
        case ExpressionKind.FUNCTION_CALL:
        {
            let functionCall = expr.specification as FunctionCallExpression;
            let functionName = functionCall.name;
            let functionArgs = functionCall.functionArgs;

            let computedArgs:Array<ReturnValue>;
            functionArgs.forEach(arg => {
                computedArgs.push(runExpression(arg));
            });

            return ReturnValue.makeMyObjReturn(Env.callFunction(functionName, computedArgs));

        }break;
        case ExpressionKind.IDENTIFIER:
        {
            let identExpression = expr.specification as IdentifierExpression;

            return Env.getVariable(identExpression.name.toString());

        }break;
        case ExpressionKind.MEMBER_ACCESS:
        {
            let memberAccessExpression = expr.specification as MemberAccessExpression;

            //TODO: think of a better name that ilustrastes the weird traversal we have to do 
            //to run the memberaccess
            let result = runExpression(memberAccessExpression.expression);

            switch (memberAccessExpression.memberAccess.accessKind) {
                case AccessKind.AttributeAccess:
                {
                    let attributeAccess = memberAccessExpression.memberAccess.access as AttributeAccess;
                    
                    return result.getMyObj().getAttribute(attributeAccess.name.toString());
                }break;

                case AccessKind.FunctionAccess:
                {
                    let functionAccess = memberAccessExpression.memberAccess.access as FunctionAccess;
                    
                    let computedArgs = new Array<ReturnValue>();
                    functionAccess.functionArguments.forEach(arg => {
                        computedArgs.push(runExpression(arg));
                    });
                    return ReturnValue.makeMyObjReturn(result.getMyObj().callFunction(functionAccess.functionName.toString(), computedArgs));
                }break;

                case AccessKind.IndexAccess:
                {
                    throw new Error(`IndexAccess no implementado todavia!!!`);
                }break;

                default:
                    break;
            }
        }break;
        case ExpressionKind.LITERAL:
        {
            let literalExpr = expr.specification as LiteralExpression;
            return ReturnValue.makeLiteralExpressionReturn(literalExpr);
        }break;
        case ExpressionKind.TERNARY:
        {
            let ternary = expr.specification as TernaryExpression;
            //BIG TODO: si es templated string hay que calcular todas sus subexpresiones
            throw new Error(`runExpression no implementado todavia para ExpresionKind.TERNARY`);
        }break;
    
        default:
            throw new Error(`runExpression no implementado para myTypeNode: ${expr}`);
    }
}