//it might be better to convine Runner.ts and Envrionment.ts into a single file, idk

import { Pointer } from "./Pointer";
import { Expression } from "../Ast/Expression"
import { MyFunction, MyFunctionKind, GraficarTs, MyNonNativeFunction } from "./MyFunction";
import { MyType, MyTypeKind, TypeSignature } from "./MyType";
import { MyObj, CustomObj, MyConsole, compareMyTypes } from './MyObj';
import { MyError } from './MyError';
import { runExpression, runStatement, graficar_ts } from './Runner';
import { ReturnKind, ReturnValue } from './ReturnValue';
import { Jumper, JumperKind } from './Jumper';

export class SymbolTableVariables{
    [key: string]: Pointer;
}
export class SymbolTableFunctions{
    [key: string]: MyFunction;
}
//BIG TODO: pensar donde poner el string con el nombre del tipo
//Si symbolTableTypeSignature[key] return undefined it means there is no entry
//for that key. IF IT RETURNS NULL it means the key is "waiting" (i.e someone 
//reference that typebut it hasnt been defined yet)
export class SymbolTableTypeSignatures{
    [key: string]: MyType;
}

// The current scope and all previous ones
export class Scope{
    public myVariables:SymbolTableVariables;
    public myFunctions:SymbolTableFunctions;
    public myTypeSignatures:SymbolTableTypeSignatures;

    public previous:(Scope | null);

    constructor(previous:(Scope | null)) {
        this.myVariables = new SymbolTableVariables();
        this.myFunctions = new SymbolTableFunctions();
        this.myTypeSignatures = new SymbolTableTypeSignatures(); 

        this.previous = previous;
    }
}

export module Env{

    export let global:Scope;
    export let current:Scope;

    // clears the Environment and adds the default functions and variables
    export function initEnvironment():void{
        global = new Scope(null);

        global.myVariables

        //Inicializamos los tipos primitivos y Cosole
        //FOR DEBUG ONLY:
        //FIXME
        //TODO TODO TODO TODO: Uncomment it!
        // global.myTypeSignatures["string"] = MyType.stringTypeInstance;
        // global.myTypeSignatures["number"] = MyType.numberTypeInstance;
        // global.myTypeSignatures["boolean"] = MyType.booleanTypeInstance;
        // global.myTypeSignatures["null"] = MyType.nullTypeInstance;
        // global.myTypeSignatures["undefined"] = MyType.undefinedTypeInstance;

        // global.myTypeSignatures["Console"] = MyType.consoleTypeInstance;

        //Inicializamos las variables, funciones y definiciones nativas del scope global
        global.myFunctions["graficar_ts"] = new MyFunction(MyFunctionKind.GRAFICAR_TS, new GraficarTs());
        global.myVariables["console"] = Pointer.makeMyObjectPointer(new MyObj(MyType.consoleTypeInstance, new MyConsole()));

        current = global;
    }

    //REGION: Funciones y variables nativas
    //END: Funciones y variables nativas

    //[throws_MyError]
    //Atrapa si ya exite el id en el current scope
    export function addVariable(id:string, val:MyObj){
        //ver si ya existe en el current scope

        if(current.myVariables[id] !== undefined){
            throw new MyError(`No se agregar una variable con el nombre '${id}' porque existe un variable con el mismo nomber en el mismo scope`);
        }

        current.myVariables[id] = Pointer.makeMyObjectPointer(val);
    }

    //[?] do we need a assignVariable to go with the addVariable?

    //Retorna undefined si no existe el id en niguno de los scopes
    //if ReturnValue is not a pointer then it means the variable doesnt exist
    //in the current scope or the previous ones
    //i.e. ReturnValue can only be Pointer of NullInstance
    export function getVariable(id:string):ReturnValue{

        let iter:(Scope | null) = current;
        let myVariable:Pointer;

        // we traverse the stack of scopes until we find the first 
        // function to have the same name
        while(iter !== null){
            myVariable = iter.myVariables[id];
            if(myVariable !== undefined){
                return ReturnValue.makePointerReturn(myVariable);
            }
            iter = iter.previous;
        }
        if(myVariable === undefined){
            return ReturnValue.makeUndefinedReturn();
        }

        return ReturnValue.makePointerReturn(myVariable);
    }

    //[throws_MyError]
    //Atrapa si no exite el id en ningun scope
    //Atrapa si el numero de parametros es diferente
    //Atrapa si tiene diferente tipo de parametros
    //Atrapa cualquier error que ocurra mientras se ejecuta el codigo de la funcion
    export function callFunction(id:string, myArgs:ReturnValue[]):MyObj{

        let iter:(Scope | null) = current;
        let myFunctionSignature:(MyFunction | undefined);

        // we traverse the stack of scopes until we find the first 
        // function to have the same name
        while(iter !== null){
            myFunctionSignature = iter.myFunctions[id];
            if(myFunctionSignature !== undefined){
                //this would be a good example of a goto
                break;
            }
            iter = iter.previous;
        }
        if(myFunctionSignature === undefined){
            throw new MyError(`No existe una funcion con el nomber <${id}> en el entorno actual`);
        }

        // chapuz: revisamos si es una funcion nativa y, de ser asi, la ejecutamos
        // esto funciona por ahora solo porque una funcion nativa no puede tirar 
        // MyErro y porque ninguna func nativa recibe parametros
        // POSSIBLE BUG: We dont push the scope and all that when calling this native func, is no necessary for
        // now but still be mindful of it
        if(myFunctionSignature.kind === MyFunctionKind.GRAFICAR_TS){
            let graficarTs = myFunctionSignature.specification as GraficarTs;
            if(myArgs.length !== 0){
                throw new MyError(`No se puede llamar a la funcion <graficar_ts> con ${myArgs.length} argumentos`)
            }
            graficar_ts();
            //we return 'void' which is 'undefined' in typescript
            return MyObj.undefinedInstance;
        }

        let nonNativeFunctionSignature = myFunctionSignature.specification as MyNonNativeFunction;
        let params = nonNativeFunctionSignature.params;
        
        // we check if they have the same number of params and args
        if(myArgs.length !== params.length){
            throw new MyError(`No se puede llamar a la funcion <${id}> con ${myArgs.length} argumentos`)
        }

        // At this point our function signature is a non_native kind
        // [Think]: goto would help avoid missing pops here... just saying
        let oldCurrent = Env.current;
        Env.current = global;
        Env.pushScope();

        // Should the arrays indices be passed by reference too?? for now they are
        // if we wanted them to not be passed by reference:
        // We cant make that happen from here, the easiest way would be to have array index
        // access never return a Pointer REturnType, BUT that would mean that we couldn't
        // use it to assign stuff: array[0] = someObj; wouldnt be possible
        // we would have to do some crazy bodging, there is no way around I think

        // We set up the environment for the function call: (i.e. the function arguments)
        // we check the correctness of the types and assing each pointer to the param name in a new scope
        for (let i = 0; i < myArgs.length; i++) {
            const resultValue = myArgs[i];

            let typeArg = resultValue.getMyObj().myType;
            let typeParam =params[i].myType;
            if(!compareMyTypes(typeArg, typeParam)){
                Env.popScope();
                Env.current = oldCurrent;
                throw new MyError(`Types no compatibles en el argumento: ${i}. Se tiene: ${typeArg.toString()} se esperaba: ${typeParam.toString()}`)
            }
            //If resultValue is of type (CUSTOM or ARRAY) And it is a pointer we pass the param by pointer, if not we copy the MyObj
            if((typeArg.kind === MyTypeKind.CUSTOM || typeArg.kind === MyTypeKind.ARRAY) &&
                resultValue.kind === ReturnKind.POINTER)
            {
                //unsafe but its ok because we added a brand new scope
                Env.current.myVariables[params[i].paramName] = resultValue.unsafeGetPointer();
            }
            else{
                Env.current.myVariables[params[i].paramName] = Pointer.makeMyObjectPointer(resultValue.getMyObj());
            }
            
        }

        //We run the function's code
        let returnType =  (myFunctionSignature.specification as MyNonNativeFunction).returnType;//Can be null (represents void)
        let statements = (myFunctionSignature.specification as MyNonNativeFunction).statements;
        for (const stmt of statements) {
            //Recordar que las exceptions se atrapan en runStatement
            let stmtResult = runStatement(stmt);
            if(stmtResult === null){
                continue;
            }
            //Be mindful that if we throw and exception we dont have to return anything
            switch(stmtResult.kind){
                case JumperKind.BREAK:
                case JumperKind.CONTINUE:
                    Env.popScope();
                    Env.current = oldCurrent;
                    throw new MyError(`Fallo la llamada a funcion '${id}': ${stmtResult.kind} a traves del limete de funcion`)
                case JumperKind.RETURN:
                    Env.popScope();
                    Env.current = oldCurrent;
                    if(returnType === null){
                        return MyObj.undefinedInstance;//Return without errors :D
                    }else{
                        throw new MyError(`No se puede retornar un valor en una fucion tipo :void`)
                    }
                case JumperKind.RETURN_VALUE:
                    //by this point stmtReslt.value cannot be null
                    Env.popScope();
                    Env.current = oldCurrent;
                    if(compareMyTypes(returnType, stmtResult.value.myType)){
                        return stmtResult.value;//Return without errors :D
                    }else{
                        throw new MyError(`No se puede retornar un tipo en una fucion tipo :void`)
                    }

            }
        }
        Env.popScope();
        Env.current = oldCurrent;
        if(returnType === null){
            return MyObj.undefinedInstance;//Return without errors :D
        }else{
            throw new MyError(`La funcion '${id}:' debe retornar un valor de tipo: '${returnType.myToString()}`)
        }
    }

    export function pushScope(){
        current = new Scope(current);
    }

    export function popScope(){
        current = current.previous;
    }
}
