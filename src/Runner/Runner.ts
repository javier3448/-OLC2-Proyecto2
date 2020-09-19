import { Pointer } from "./Pointer"; 
import { ReturnValue, ReturnKind } from "./ReturnValue"; 
import { Jumper, JumperKind } from "./Jumper";
       
import { parser } from "./RunnerParser.js";
import { RuntimeInterface, TsEntry } from "../app/app.component";
import { Env, Scope } from "./Environment";

import { Statement, StatementKind, WhileStatement, Block, IfStatement, ForStatement} from "../Ast/Statement";

import { MyObj, CustomObj, compareMyTypes, MyArray } from "./MyObj";
import { MyType, MyTypeKind, TypeSignature } from "./MyType";
import { MyFunction, MyFunctionKind, GraficarTs, Parameter, MyNonNativeFunction } from "./MyFunction";
import { MyError } from './MyError';

import { Expression, ExpressionKind, FunctionCallExpression, LiteralExpression, IdentifierExpression, MemberAccessExpression, BinaryExpression, UnaryExpression, TernaryExpression, ObjectLiteralExpression, ArrayLiteralExpression } from '../Ast/Expression';
import { Declaration } from '../Ast/Declaration';
import { AccessKind, AttributeAccess, FunctionAccess, IndexAccess } from 'src/Ast/MemberAccess';
import { ArrayTypeNode, CustomTypeNode, MyTypeNode, MyTypeNodeKind } from 'src/Ast/MyTypeNode';
import { GlobalInstructions } from 'src/Ast/GlobalInstructions';
import { TypeDef, AttributeNode } from "../Ast/TypeDef";
import { FunctionDef, ParamNode } from "../Ast/FunctionDef";
import { stringify } from '@angular/compiler/src/util';
import { enableDebugTools } from '@angular/platform-browser';



// REGION: IO functions
let runtimeInterface:RuntimeInterface;

export function myPrint(/* pointer to static console instance, */ myObj:MyObj){
    runtimeInterface.myConsole += myObj.toPrintableString() + "\n";
}

export function graficar_ts(){
    //TODO:
    console.log(Env.current);

    let iter = Env.current;
    let count = 0;
    
    while(iter != null){
        //type signatures
        for (const key in iter.myTypeSignatures) {
            let typeSignature = iter.myTypeSignatures[key];
            runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, "-", typeSignature.myToString()));
        }
        //Function signatures
        for (const key in iter.myFunctions) {
            let funcSignature = iter.myFunctions[key];
            runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, funcSignature.getTypeString(), "-"));
        }
        //Variables:
        for (const key in iter.myVariables) {
            let variable = iter.myVariables[key];
            runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, variable.myObj.myType.myToString(), variable.myObj.toPrintableString()));
        }
        iter = iter.previous;
    }
    console.log(runtimeInterface.tsDataSet);
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
    let root =  parser.parse(source) as GlobalInstructions;

    runGlobalInstructions(root);
}

export function runGlobalInstructions(globalInstructions:GlobalInstructions):void{

    for (const typeDef of globalInstructions.typeDefs) {
        try {
            runTypeDef(typeDef);
        } catch (error) {
            if(error instanceof MyError){
                console.log(error);
            }
            throw error;
        }
    }
    //revisamos si quedo algun tipo sin definir
    for (const key in Env.global.myTypeSignatures) {
        let myType = Env.global.myTypeSignatures[key]
        if(myType.kind === MyTypeKind.WAITING){
            let myError = new MyError(`No se encontro definicion para el tipo: '${key}'. Se definira con {} para continuar la ejecucion`);
            console.log(myError);
            myType.kind = MyTypeKind.CUSTOM;
            myType.specification = new TypeSignature(key);
        }
            
    }

    for (const functionDef of globalInstructions.functionDefs) {
        try {
            runFunctionDef(functionDef);
        } catch (error) {
            if(error instanceof MyError){
                console.log(error);
            }
            throw error;
        }
    }

    for (const statement of globalInstructions.statements) {
        let result = runStatement(statement);
        // BIG TODO: Implementar bien los jumpers sin que se truene todo el programa
        // y/o cause comportamiento extranno a travez de funciones
        //We must check for undef too because if we throw an Exception we return undef... This will cause more bugs in other places. Fuck you typescript
        if(result !== null && result !== undefined){
            console.log(new MyError(`No se puede usar el jumper: ${result} en ejecucion global`))
        }
    }
}

export function runFunctionDef(functionDefNode:FunctionDef){

    let name = functionDefNode.name;
    //We check if it already exist for shortcircuiting
    if(Env.global.myFunctions[name] !== undefined){
        throw new MyError(`Ya existe una funcion con el nombre ${name}`);
    }

    let returnType = ((functionDefNode.returnType === null) ? null : runNonPropertyMyTypeNode(functionDefNode.returnType));

    let params = new Array<Parameter>();

    for (const paramNode of functionDefNode.params) {
        params.push(runParam(paramNode));
    }
    //We check for duplicate names, traversing the array a second time is faster than checking everytime we add one... I think
    // params.some((value:Parameter, index:number, params:Parameter[]) => {
    //     if(index > params.length - 1){
    //         return false;
    //     }
    //     else{
    //         return params[index] === params[index + 1];
    //     }
    // });//A js way of doing it, dont know if its right
    //this way is easier to understand and debug imo
    for (let i = 0; i < params.length - 1; i++) {
        if(params[i].paramName === params[i+1].paramName){
            throw new MyError(`definicion de function ${name} tiene dos veces el nombre: ${params[i].paramName}`);
        }
    }

    let statements = functionDefNode.statements;
    
    Env.global.myFunctions[name] = new MyFunction(MyFunctionKind.NON_NATIVE, new MyNonNativeFunction(params, returnType, statements));

}

export function runParam(param:ParamNode):Parameter{

    let name = param.name;
    let myType = runNonPropertyMyTypeNode(param.myTypeNode);

    return new Parameter(name, myType);
}

export function runTypeDef(typeDef:TypeDef){

    //Chequeamos si ya existe ese typedef en la tabla
    //POR AHORA SOLO CHEQUEAMOS EL GLOBAL!!!!!!

    let newTypeSignature = new TypeSignature(typeDef.name);

    for (const attribute of typeDef.attributes) {

        // there should be like a tryAndSet or maybe a way to get the reference
        // associated with the key but this is piece of shit typescript so who cares
        if(newTypeSignature.table[attribute.name] !== undefined){
            throw new MyError(`No se pudo definir el tipo: '${typeDef.name}'. atributo duplicado: '${attribute.name}'`)
            
        }
        
        let attributeType: MyType = runPropertyMyTypeNode(attribute.myTypeNode);

        newTypeSignature.table[attribute.name] = attributeType;
    }

    let typeInTable = Env.global.myTypeSignatures[typeDef.name];
    if(typeInTable !== undefined){
        if(typeInTable.kind === MyTypeKind.WAITING){
            typeInTable.kind = MyTypeKind.CUSTOM;
            typeInTable.specification = newTypeSignature;
        }
    }else{
        Env.global.myTypeSignatures[typeDef.name] = MyType.makeCustomType(newTypeSignature);
    }
}

export function runStatement(statement:Statement):(Jumper | null){
    // This is basically dynamic dispatching, but at least I can see it... I guess
    try {

        let child = statement.child;

        switch (statement.statementKind) {
            case StatementKind.ExpressionKind:
                // No retornamos lo de expression porque no es posible que 
                // expression retorne jumper
                runExpression(child as Expression);
                return null;

            case StatementKind.DeclarationKind:
            {
                let declaration = child as Declaration;

                return runDeclaration(declaration);
            }break;

            case StatementKind.BlockKind:
                return runBlock(child as Block);
                break;

            case StatementKind.BreakKind:
                return new Jumper(JumperKind.BREAK, null);
                break;

            case StatementKind.ContinueKind:
                return new Jumper(JumperKind.CONTINUE, null);
                break;

            case StatementKind.ReturnKind:
                return new Jumper(JumperKind.RETURN, null);
                break;

            case StatementKind.ReturnWithValueKind:
            {
                let returnExpression = statement.child as Expression;
                let expressionResult = runExpression(returnExpression)
                return new Jumper(JumperKind.RETURN_VALUE, expressionResult.getMyObj());
            }break;

            case StatementKind.IfKind:
                return runIfStatment(child as IfStatement);
                break;

            case StatementKind.WhileKind:
                return runWhile(child as WhileStatement);
                break;

            case StatementKind.ForKind:
                return runFor(child as ForStatement);
                break;

            default:
                throw new Error(`runStatment no implementado para myTypeNode: ${statement.statementKind}`);
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

export function runPropertyMyTypeNode(myTypeNode:MyTypeNode):MyType{

    if(myTypeNode.kind === MyTypeNodeKind.CUSTOM){
        //Chequeamos si ya existe ese typedef en la tabla
        //POR AHORA SOLO CHEQUEAMOS EL GLOBAL!!!!!!
        //stupidly bad perf. we visit the map 3 fucking times!
        let customTypeNode = myTypeNode.spec as CustomTypeNode;
        if(Env.global.myTypeSignatures[customTypeNode.name] === undefined){
            Env.global.myTypeSignatures[customTypeNode.name] = MyType.makeWaitingType(); 
            return Env.global.myTypeSignatures[customTypeNode.name];
        }else{
            return Env.global.myTypeSignatures[customTypeNode.name]; 
        }
    }
    if(myTypeNode.kind === MyTypeNodeKind.GENERIC_ARRAY || myTypeNode.kind === MyTypeNodeKind.BOXY_ARRAY){
        let arrayTypeNode = myTypeNode.spec as ArrayTypeNode;
        //It is very important that we dont call runNonPropertyMyTypeNode. Here. If we do we will get a pretty nasty bug
        return MyType.makeArrayType(runPropertyMyTypeNode(arrayTypeNode.subType));
    }

    //it must be primitive
    switch (myTypeNode.kind) {
        case MyTypeNodeKind.NUMBER:
            return MyType.numberTypeInstance; 
        case MyTypeNodeKind.STRING: 
            return MyType.stringTypeInstance; 
        case MyTypeNodeKind.BOOLEAN:
            return MyType.booleanTypeInstance;
        case MyTypeNodeKind.NULL:
            return MyType.nullTypeInstance;
        case MyTypeNodeKind.UNDEFINED:
            return MyType.undefinedTypeInstance;
        default:
            throw new Error(`runMyTypeNode no implementado para ${myTypeNode.kind}`);
    }
}

//TODO: come up with better names for both runMyTypeNode functions
//The 'NonProperty' part means that it wont create a new entry in the 
//type table if it doesnt find the target
export function runNonPropertyMyTypeNode(myTypeNode:MyTypeNode):MyType{
    if(myTypeNode.kind === MyTypeNodeKind.CUSTOM){
        //Chequeamos si ya existe ese typedef en la tabla
        //POR AHORA SOLO CHEQUEAMOS EL GLOBAL!!!!!!
        let customTypeNode = myTypeNode.spec as CustomTypeNode;
        let myType = Env.global.myTypeSignatures[customTypeNode.name];
        if(myType === undefined){
            throw new MyError(`No existe el tipo: '${customTypeNode.name}'.`);
        }
        return myType;
    }
    if(myTypeNode.kind === MyTypeNodeKind.GENERIC_ARRAY || myTypeNode.kind === MyTypeNodeKind.BOXY_ARRAY){
        let arrayTypeNode = myTypeNode.spec as ArrayTypeNode;
        //It is very important that we dont call runPropertyMyTypeNode. Here. If we do we will get a pretty nasty bug
        return MyType.makeArrayType(runNonPropertyMyTypeNode(arrayTypeNode.subType));
    }

    //it must be primitive
    switch (myTypeNode.kind) {
        case MyTypeNodeKind.NUMBER:
            return MyType.numberTypeInstance;
        case MyTypeNodeKind.STRING:
            return MyType.stringTypeInstance;
        case MyTypeNodeKind.BOOLEAN:
            return MyType.booleanTypeInstance;
        case MyTypeNodeKind.NULL:
            return MyType.nullTypeInstance;
        case MyTypeNodeKind.UNDEFINED:
            return MyType.undefinedTypeInstance;
        default:
            throw new Error(`runMyTypeNode no implementado para ${myTypeNode.kind}`);
    }
}

// function add
//[throws_MyError]
// Atrapa si la operacion no se puede realizar entre por los tipos de los operandos
export function runExpression(expr:Expression):ReturnValue{

    if(expr.specification instanceof BinaryExpression){

        //Chapuz: porque el orden en el que se evalua left y right expression
        //es de izquierda a derecha EXCEPTO por el operador **
        if(expr.expressionKind === ExpressionKind.POWER){
            let rightResult = runExpression(expr.specification.right).getMyObj();
            let rightType:MyType = rightResult.myType;
            let leftResult= runExpression(expr.specification.left).getMyObj();
            let leftType:MyType = leftResult.myType;

            if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                let leftValue:number = (leftResult.value as Number).valueOf();
                let rightValue:number = (rightResult.value as Number).valueOf();
                return ReturnValue.makeNumberReturn(leftValue ** rightValue);
            }
            else{
                throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
            }
        }

        //Caso es espcial: asignacion porque require que la expresion de la izquierda sea lvalue
        if(expr.expressionKind === ExpressionKind.ASSIGNMENT){
            let leftExpressionResult = runExpression(expr.specification.left);
            if(leftExpressionResult.kind !== ReturnKind.POINTER){
                throw new MyError(`El lado izquierdo de assignacion debe una variable o acceso a propiedad`);
            }
            //we can use unsafe here because we know returnKind must be a Pointer
            let lvalue:Pointer = leftExpressionResult.unsafeGetPointer();
            let rvalue:MyObj = runExpression(expr.specification.right).getMyObj();

            //we check types
            if(!compareMyTypes(lvalue.myObj.myType, rvalue.myType)){
                //TODO: hay casos en los que no se va a poder hacer custom = custom y este mensaje no va ayudar en nada
                throw new MyError(`No se puede asignar el tipo: '${lvalue.myObj.myType.kind}' un valor de tipo: ${rvalue.myType.kind}`);
            }

            //this is baaaaaaaaaaaaad :((((
            //All this awfulness because we put the type inside MyObj and not inside pointer :(
            //Special case. Arbitrary awful patch so everything doesnt end up as anon type all the time
            //BUG: ? if the custom type is nested inside an array we dont get the 'lvalue has the "dominant"
            //       over rvalue'
            if(lvalue.myObj.myType.kind === MyTypeKind.CUSTOM && rvalue.myType.kind === MyTypeKind.CUSTOM){
                //Si ambos son custom y se paso la prueba de compare types entonces puede darse el caso 
                //en el que lvalue force su tipo sobre rvalue
                let lvalueTypeSignature = lvalue.myObj.myType.specification as TypeSignature;
                if(lvalueTypeSignature.name != null ){
                    (rvalue.myType.specification as TypeSignature).name = lvalueTypeSignature.name;
                }
            }

            lvalue.myObj = rvalue;

            //we retunr a new ReturnValue because typescript can never return lvalue after assignment
            return ReturnValue.makeMyObjReturn(rvalue);
        }

        //los operadores OR y AND tambien son casos especiales porque implementan
        //shorcircuiting como en C. Entonces hay casos en los que no se evaluan ambas 
        //expresiones
        if(expr.expressionKind === ExpressionKind.OR){
            //we do the shortcircuiting 'implicitly'
            return ReturnValue.makeBooleanReturn(
                runExpression(expr.specification.left).getMyObj().getTruthy() || 
                runExpression(expr.specification.right).getMyObj().getTruthy()
            );
        }
        if(expr.expressionKind === ExpressionKind.AND){
            return ReturnValue.makeBooleanReturn(
                runExpression(expr.specification.left).getMyObj().getTruthy() &&
                runExpression(expr.specification.right).getMyObj().getTruthy()
            );
        }
        
        //Todos los casos de binaryExpression en los que la expresion izquierda se debe
        //evaluar anted de la derecha, siempre se evaluan las dos, y se requiere el MyObj
        //y no el pointer de ambas
        let leftResult = runExpression(expr.specification.left).getMyObj();
        let leftType:MyType = leftResult.myType;
        let rightResult = runExpression(expr.specification.right).getMyObj();
        let rightType:MyType = rightResult.myType;
        switch (expr.expressionKind) {
            case ExpressionKind.LESS:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue < rightValue);
                }
                else if(leftType.kind === MyTypeKind.STRING && rightType.kind === MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue < rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.GREATER:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue > rightValue);
                }
                else if(leftType.kind === MyTypeKind.STRING && rightType.kind === MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue > rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.LESS_OR_EQUAL:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue <= rightValue);
                }
                else if(leftType.kind === MyTypeKind.STRING && rightType.kind === MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue <= rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.GREATER_OR_EQUAL:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue >= rightValue);
                }
                else if(leftType.kind === MyTypeKind.STRING && rightType.kind === MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue >= rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.EQUAL_EQUAL:
                // if(leftType.kind === MyTypeKind.NULL && rightType.kind !== MyTypeKind.NULL
                //     ||
                //     leftType.kind !== MyTypeKind.NULL && rightType.kind === MyTypeKind.NULL
                //     ||
                //     leftType.kind == MyTypeKind.UNDEFINED && rightType.kind !== MyTypeKind.UNDEFINED
                //     ||
                //     leftType.kind !== MyTypeKind.UNDEFINED && rightType.kind === MyTypeKind.UNDEFINED
                // )
                // {
                //     return ReturnValue.makeBooleanReturn(false);
                // }
                //Maybe we can just use the TS ===. idk :/
                //it is the easiest thing now, so fuck it 
                //TODO: Test the fuck out of this, it might not work at all
                //TODO: maybe using the value would be better i dont fucking now
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue === rightValue);
                }
                else if(leftType.kind === MyTypeKind.STRING && rightType.kind === MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue === rightValue);
                }
                else if(leftType.kind === MyTypeKind.BOOLEAN && rightType.kind === MyTypeKind.BOOLEAN){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue === rightValue);
                }

                //POTENCIAL BUG: WE CANT COMPARE POINTERS ANYMORE
                return ReturnValue.makeBooleanReturn(leftResult === rightResult);
            break;
            case ExpressionKind.NOT_EQUAL:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue !== rightValue);
                }
                else if(leftType.kind === MyTypeKind.STRING && rightType.kind === MyTypeKind.STRING){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue !== rightValue);
                }
                else if(leftType.kind === MyTypeKind.BOOLEAN && rightType.kind === MyTypeKind.BOOLEAN){
                    let leftValue:string = (leftResult.value as String).valueOf();
                    let rightValue:string = (rightResult.value as String).valueOf();
                    return ReturnValue.makeBooleanReturn(leftValue !== rightValue);
                }

                //POTENCIAL BUG: WE CANT COMPARE POINTERS ANYMORE
                return ReturnValue.makeBooleanReturn(leftResult !== rightResult);
            break;
            case ExpressionKind.ADDITION:
                if(leftType.kind === MyTypeKind.STRING || rightType.kind === MyTypeKind.STRING){
                    return ReturnValue.makeStringReturn(leftResult.myToString() + rightResult.myToString());
                }
                else if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(leftValue + rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.SUBSTRACTION:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(leftValue - rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.MULTIPLICATION:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
                    let leftValue:number = (leftResult.value as Number).valueOf();
                    let rightValue:number = (rightResult.value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(leftValue * rightValue);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${leftType.kind}' y '${rightType.kind}'`)
                }
            break;
            case ExpressionKind.DIVISION:
                if(leftType.kind === MyTypeKind.NUMBER && rightType.kind === MyTypeKind.NUMBER){
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
        let unaryExpr = expr.specification as UnaryExpression;
        //El valor a aplicar la operacion unaria
        let operand = runExpression(unaryExpr.expr);//we dont do the .getObj() because we might need the pointer for some operations
        let operandType = operand.getMyObj().myType;

        //At this point we know that expr.kind must be UNARY_MINUS, NEGATION, POSTFIX_INC, POSTFIX_DEC
        switch(expr.expressionKind){
            case ExpressionKind.UNARY_MINUS:
            {
                if(operandType.kind === MyTypeKind.NUMBER){
                    let val:number = (operand.getMyObj().value as Number).valueOf();
                    return ReturnValue.makeNumberReturn(-val);
                }
                else{
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${operandType.kind}'`);
                }
            }break;
            case ExpressionKind.NEGATION:
                return ReturnValue.makeBooleanReturn(!operand.getMyObj().getTruthy());
                break;
            case ExpressionKind.POSTFIX_INC:
                if(operandType.kind !== MyTypeKind.NUMBER){//first possible error
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${operandType.kind}'`);
                }
                else if(operand.kind !== ReturnKind.POINTER){//second possible error
                    throw new MyError(`El operando de '${expr.expressionKind}' debe ser una variable o property access`);
                }
                else{//no errors

                    //numeric value of operand
                    let numericVal:number = (operand.getMyObj().value as Number).valueOf();

                    //we make a copy of the original value
                    let valueBeforeInc = ReturnValue.makeNumberReturn(numericVal);

                    //we change the original value
                    let operandPointer = (operand.specification as Pointer);
                    operandPointer.myObj = new MyObj(MyType.numberTypeInstance, new Number(numericVal + 1));

                    //return the copy
                    return valueBeforeInc;
                }
                break;
            case ExpressionKind.POSTFIX_DEC:

                if(operandType.kind !== MyTypeKind.NUMBER){//first possible error
                    throw new MyError(`Operador '${expr.expressionKind}' no acepta los tipos: '${operandType.kind}'`);
                }
                else if(operand.kind !== ReturnKind.POINTER){//second possible error
                    throw new MyError(`El operando de '${expr.expressionKind}' debe ser una variable o property access`);
                }
                else{//no errors

                    //numeric value of operand
                    let numericVal:number = (operand.getMyObj().value as Number).valueOf();

                    //we make a copy of the original value
                    let valueBeforeDec = ReturnValue.makeNumberReturn(numericVal);

                    //we change the original value
                    let operandPointer = (operand.specification as Pointer);
                    operandPointer.myObj = new MyObj(MyType.numberTypeInstance, new Number(numericVal - 1));

                    //return the copy
                    return valueBeforeDec;
                }
                break;
        }
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

            let computedArgs:Array<ReturnValue> = [];
            for (const arg of functionArgs) {
                computedArgs.push(runExpression(arg));
            }

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
                    
                    let attributeAccessResult = result.getMyObj().getAttribute(attributeAccess.name.toString());
                    return attributeAccessResult;
                }break;

                case AccessKind.FunctionAccess:
                {
                    let functionAccess = memberAccessExpression.memberAccess.access as FunctionAccess;
                    
                    let computedArgs = new Array<ReturnValue>();
                    for (const arg of functionAccess.functionArguments) {
                        computedArgs.push(runExpression(arg));
                    }

                    let functionCallResult = result.getMyObj().callFunction(functionAccess.functionName.toString(), computedArgs);
                    return ReturnValue.makeMyObjReturn(functionCallResult);
                }break;

                case AccessKind.IndexAccess:
                {
                    let indexAcces = memberAccessExpression.memberAccess.access as IndexAccess;
                    
                    let computedIndex = runExpression(indexAcces.index);
                    
                    let indexAccessResult = result.getMyObj().getIndex(computedIndex.getMyObj());

                    return ReturnValue.makePointerReturn(indexAccessResult);
                    
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
        case ExpressionKind.OBJECT_LITERAL:
        {
            let objectLiteral = expr.specification as ObjectLiteralExpression;
            let anonymousObj = new CustomObj();
            let anonymousSignature = new TypeSignature(null);
            for (const propertyNode of objectLiteral.propertyNodes) {
                //we keep reading the values of the map like 2 extra times everytime
                //we need to do a check. I cant believe typescript doesnt have a mechanism
                //to do this better
                if(anonymousObj[propertyNode.id] !== undefined){
                    throw new MyError(`Un object literal no puede tener dos propieades con el mismo nombre '${propertyNode.id}'`);
                }
                let rvalue = runExpression(propertyNode.expr).getMyObj();
                anonymousSignature.table[propertyNode.id] = rvalue.myType;
                anonymousObj[propertyNode.id] = Pointer.makeMyObjectPointer(rvalue);
            }
            return ReturnValue.makeMyObjReturn(new MyObj(MyType.makeCustomType(anonymousSignature), anonymousObj));
        }break;
        case ExpressionKind.ARRAY_LITERAL:
        {
            let expressionList = (expr.specification as ArrayLiteralExpression).expressions;

            if(expressionList.length < 1){
                return ReturnValue.makeMyObjReturn(MyObj.makeEmptyArray());
            }
            let resultingArray:MyArray = new MyArray([]);//We should do a reserve to this guy, but its typescript who the fuck cares... >:/
            let firstElement = runExpression(expressionList[0]).getMyObj();
            let typeOfElements = firstElement.myType;
            resultingArray.array.push(Pointer.makeMyObjectPointer(firstElement));
            for (let i = 1; i < expressionList.length; i++) {
                let element = runExpression(expressionList[i]).getMyObj();
                if(!compareMyTypes(typeOfElements, element.myType)){
                    throw new MyError(`No se puede agregar un tipo: ${element.myType.myToString()} a un arreglo de typo: ${typeOfElements.myToString()}`);
                }
                resultingArray.array.push(Pointer.makeMyObjectPointer(element));
            }

            return ReturnValue.makeMyObjReturn(MyObj.makeArray(typeOfElements, resultingArray));
        }break;
        case ExpressionKind.TERNARY:
        {
            let ternary = expr.specification as TernaryExpression;
            //BIG TODO: si es templated string hay que calcular todas sus subexpresiones
            throw new Error(`runExpression no implementado todavia para ExpresionKind.TERNARY`);
        }break;
    
        default:
            console.log(expr);
            throw new Error(`runExpression no implementado para expressionKind: '${expr.expressionKind}'`);
    }
}

export function runDeclaration(declaration:Declaration):null{
    let id = declaration.identifier;
    let myType:(MyType | null);
    if(declaration.myTypeNode === null){
        myType = null;
    }else{
        myType = runNonPropertyMyTypeNode(declaration.myTypeNode);
    }
    let val = (declaration.expression === null ? MyObj.undefinedInstance : runExpression(declaration.expression).getMyObj());

    //we check types
    if(myType !== null){
        //TODO: hay casos en los que no se va a poder hacer custom = custom y este mensaje no va ayudar en nada
        if(!compareMyTypes(myType, val.myType)){
            throw new MyError(`No se puede asignar el tipo: '${myType.kind}' un valor de tipo: ${val.myType.kind}`);
        }

        //this is baaaaaaaaaaaaad :((((
        //All this awfulness because we put the type inside MyObj and not inside pointer :(
        //Special case. Arbitrary awful patch so everything doesnt end up as anon type all the time
        if(myType.kind === MyTypeKind.CUSTOM && val.myType.kind === MyTypeKind.CUSTOM){
            //Si ambos son custom y se paso la prueba de compare types entonces puede darse el caso 
            //en el que lvalue force su tipo sobre rvalue
            let lvalueTypeSignature = myType.specification as TypeSignature;
            if(lvalueTypeSignature.name != null ){
                (val.myType.specification as TypeSignature).name = lvalueTypeSignature.name;
            }
        }
    }

    Env.addVariable(id, val);

    return null;
}

export function runBlock(block:Block):(Jumper | null){
    Env.pushScope();
    for (const statement of block.statements) {
        let result = runStatement(statement);
        if(result !== null){//Then it must be jumper
            Env.popScope();
            return result;
        }
    }
    Env.popScope();
    return null;
}

export function runWhile(whileStatement:WhileStatement):(Jumper | null){
    while(true){
        //runExpression can safetly throw a myError because we dont have any scopes pending
        //i.e. we havent pushed a scope yet
        let exprResult = runExpression(whileStatement.expr);
        if(!exprResult.getMyObj().getTruthy()){
            break;
        }

        Env.pushScope();
        for (const statement of whileStatement.statements) {
            let statementResult = runStatement(statement);

            if(statementResult === null){
                // We just go to the next statement because the current statement didnt
                // return a jumper
                continue;
            }
            else if(statementResult.kind === JumperKind.CONTINUE){
                // We break out of the foreach statements but not the while(true)
                // This way we dont run the statements after continue; and we go to the
                // next iteration of the while
                break;
            }
            else if(statementResult.kind === JumperKind.BREAK){
                // We must exit out of the loop and return no Jumper because we
                // 'consumed' the break jumper
                Env.popScope();
                return null;
            }
            else if(statementResult.kind === JumperKind.RETURN ||
                    statementResult.kind === JumperKind.RETURN_VALUE){
                // We must exit out of the loop and return a Jumper because we
                // a while cant 'consume' a return jumper
                Env.popScope();
                return statementResult;
            }
            else{//a sneaky assertion just in case
                throw new Error(`runWhile no implentado para resultado de bloque: ${statementResult.kind}`);
            }
        }
        Env.popScope();
    }
}

export function runIfStatment(ifStatement:IfStatement):(Jumper | null){
    let exprResult = runExpression(ifStatement.expr);
    if(!exprResult.getMyObj().getTruthy()){
        if(ifStatement.elseStatment !== null){
            return runStatement(ifStatement.elseStatment);
        }
        else{
            return null;
        }
    }

    Env.pushScope();
    for (const statement of ifStatement.statements) {
        let result = runStatement(statement);
        if(result !== null){//Then it must be jumper
            Env.popScope();
            return result;
        }
    }
    Env.popScope();
    return null;
}

export function runFor(forStatement:ForStatement):(Jumper | null){

    //We compute the initialExpression and put it in its on scope
    Env.pushScope();
    if(forStatement.initialExpression !== null){
        if(forStatement.initialExpression instanceof Expression){
            //We already pushed a scope so if runExpression throws an error we must pop it back
            try {
                runExpression(forStatement.initialExpression);
            } catch (error) {
                if(error instanceof MyError){
                    Env.popScope();
                }
                throw error;
            }
        }
        else{//It must be a statement
            if(forStatement.initialExpression.statementKind !== StatementKind.DeclarationKind){
                Env.popScope
                throw new MyError(`initialExpression de for debe ser una expresion o una declaracion. Se tiene: '${forStatement.initialExpression.statementKind}'`);
            }
            try {
                runDeclaration(forStatement.initialExpression.child as Declaration);
            } catch (error) {
                if(error instanceof MyError){
                    Env.popScope();
                }
                throw error;
            }
        }
    }
    
    while(true){
        let exprResult:ReturnValue;
        //We already pushed a scope so if runExpression throws an error we must pop it back
        try {
            exprResult = runExpression(forStatement.condicion);
        } catch (error) {
            if(error instanceof MyError){
                Env.popScope();
            }
            throw error;
        }
        if(!exprResult.getMyObj().getTruthy()){
            Env.popScope();
            return null;
        }

        //From this point on if we are done running the for statements but not the loop itself we pop once
        //if we are done with the loop (i.e. we return or we exit the while(true)) we must pop once.
        //everytime we start going thru the for statements again we must push a scope
        Env.pushScope();
        for (const statement of forStatement.statements) {
            let statementResult = runStatement(statement);

            if(statementResult === null){
                // We just go to the next statement because the current statement didnt
                // return a jumper
                continue;
            }
            else if(statementResult.kind === JumperKind.CONTINUE){
                // We break out of the foreach statements but not the while(true)
                // This way we dont run the statements after continue; and we go to the
                // next iteration of the while
                break;
            }
            else if(statementResult.kind === JumperKind.BREAK){
                // We must exit out of the loop and return no Jumper because we
                // 'consumed' the break jumper
                // we pop two times because of the scope we pushed for the initialExpression
                Env.popScope();
                Env.popScope();
                return null;
            }
            else if(statementResult.kind === JumperKind.RETURN ||
                    statementResult.kind === JumperKind.RETURN_VALUE){
                // We must exit out of the loop and return a Jumper because we
                // a while cant 'consume' a return jumper
                // we pop two times because of the scope we pushed for the initialExpression
                Env.popScope();
                Env.popScope();
                return statementResult;
            }
            else{//a sneaky assertion just in case
                throw new Error(`runFor no implentado para resultado de bloque: ${statementResult.kind}`);
            }
        }
        Env.popScope();


        //We run the finalExpression
        //at this point we already poped one of the 2 scopes we pushed.
        //if there is a error we only need to pop 1
        try {
            runExpression(forStatement.finalExpression);
        } catch (error) {
            if(error instanceof MyError){
                Env.popScope();
            }
            throw error;
        }
    }
}