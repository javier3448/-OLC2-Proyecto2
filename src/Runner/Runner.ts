import { Pointer } from "./Pointer"; 
       
import { parser } from "./RunnerParser.js";
import { RuntimeInterface } from "../app/app.component";
import { Env, Scope } from "./Environment";

import { Statement } from "../Ast/Statement";

import { MyObj, MyTypeKind, CustomObj, MyType } from "./MyObj";
import { MyFunction, MyFunctionKind, GraficarTs, Parameter } from "./MyFunction";
import { MyError } from './MyError';
import { Expression, ExpressionKind, FunctionCallExpression, LiteralExpression, IdentifierExpression, MemberAccessExpression } from '../Ast/Expression';
import { Declaration } from '../Ast/Declaration';
import { Assignment } from '../Ast/Assignment';
import { AccessKind, AttributeAccess, FunctionAccess } from 'src/Ast/MemberAccess';
import { Attribute } from '@angular/core';



// REGION: IO functions
let runtimeInterface:RuntimeInterface;

export function myPrint(/* pointer to static console instance, */ myObj:MyObj){
    runtimeInterface.myConsole += myObj.toString() + "\n";
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
            let result:Pointer = runExpression(child as Expression);
        }
        else if(child instanceof Declaration){
            throw new Error(`runStatment no implementado para Declaration}`);
        }
        else if(child instanceof Assignment){
            throw new Error(`runStatment no implementado para Assignment`);
        }
        else{
            throw new Error(`runStatment no implementado para myTypeNode: ${child}`);
        }

    } catch (myError) {
        if(myError instanceof MyError){
            throw myError;
        }else{
            throw myError;
        }
    }

}

export function runExpression(expr:Expression):Pointer{
    switch (expr.expressionKind) {
        case ExpressionKind.FUNCTION_CALL:
        {
            let functionCall = expr.specification as FunctionCallExpression;
            let functionName = functionCall.name;
            let functionArgs = functionCall.functionArgs;

            let computedArgs:Array<Pointer>;
            functionArgs.forEach(arg => {
                computedArgs.push(runExpression(arg));
            });

            return Env.callFunction(functionName, computedArgs);

        }break;
        case ExpressionKind.IDENTIFIER:
        {
            let identExpression = expr.specification as IdentifierExpression;

            return Env.getVariable(identExpression.name.toString());

        }break;
        case ExpressionKind.MEMBER_ACCESS:
        {
            let memberAccessExpression = expr.specification as MemberAccessExpression;

            let resultingPointer = runExpression(memberAccessExpression.expression);

            switch (memberAccessExpression.memberAccess.accessKind) {
                case AccessKind.AttributeAccess:
                {
                    //TODO: check if this actually works:
                    let attributeAccess = memberAccessExpression.memberAccess.access as AttributeAccess;
                    
                    return resultingPointer.myObj.getAttribute(attributeAccess.name.toString());
                }break;

                case AccessKind.FunctionAccess:
                {
                    //TODO: check if this actually works:
                    let functionAccess = memberAccessExpression.memberAccess.access as FunctionAccess;
                    
                    let computedArgs = new Array<Pointer>();
                    functionAccess.functionArguments.forEach(arg => {
                        computedArgs.push(runExpression(arg));
                    });
                    return resultingPointer.myObj.callFunction(functionAccess.functionName.toString(), computedArgs);
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
            //BIG TODO: si es templated string hay que calcular todas sus subexpresiones
            return Pointer.makeLiteralExpressionPointer(literalExpr);
        }break;
    
        default:
            throw new Error(`runExpression no implementado para myTypeNode: ${expr}`);
    }
}