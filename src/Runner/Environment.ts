//it might be better to convine Runner.ts and Envrionment.ts into a single file, idk

import { Pointer } from "./Pointer";
import { Expression } from "../Ast/Expression"
import { MyFunction, MyFunctionKind, GraficarTs, MyNonNativeFunction } from "./MyFunction";
import { MyObj, MyType, MyTypeKind, CustomObj, MyConsole } from './MyObj';
import { MyError } from './MyError';
import { runExpression } from './Runner';

export class SymbolTableVariables{
    [key: string]: Pointer;
}
export class SymbolTableFunctions{
    [key: string]: MyFunction;
}
// export class SymbolTableTypeDefs{
//     [key: string]: TypeDef;
// }

// The current scope and all previous ones
export class Scope{
    public myVariables:SymbolTableVariables;
    public myFunctions:SymbolTableFunctions;
    //myTypeDefinitions:SymbolTableTypeDefs

    public previous:(Scope | null);

    constructor(previous:(Scope | null)) {
        this.myVariables = new SymbolTableVariables();
        this.myFunctions = new SymbolTableFunctions();

        this.previous = previous;
    }
}

export module Env{


    let global:Scope;
    let current:Scope;

    // clears the Environment and adds the default functions and variables
    export function initEnvironment():void{
        global = new Scope(null);

        global.myVariables

        //Inicializamos las variables, funciones y definiciones nativas del scope global
        global.myVariables["console"] = new Pointer(new MyObj(new MyType(MyTypeKind.MY_CONSOLE, null), new MyConsole()));
        global.myFunctions["graph_ts"] = new MyFunction(MyFunctionKind.GRAFICAR_TS, new GraficarTs());

        current = global;
    }

    //REGION: Funciones y variables nativas
    export function graficar_ts():void{
        //TODO:
        throw new Error("graficar_ts no soportado todavia!!!");
    }
    //END: Funciones y variables nativas

    //Retorna undefined si no existe el id en niguno de los scopes
    export function getVariable(id:string):Pointer{

        let iter:(Scope | null) = current;
        let myVariable:Pointer;

        // we traverse the stack of scopes until we find the first 
        // function to have the same name
        while(iter != null){
            myVariable = iter.myVariables[id];
            if(myVariable !== undefined){
                return myVariable;
            }
            iter = iter.previous;
        }
        if(myVariable == undefined){
            myVariable =  Pointer.makeUndefinedPointer();
        }

        return myVariable;
    }

    //[throws_MyError]
    //Atrapa si no exite el id en ningun scope
    //Atrapa si el numero de parametros es diferente
    //Atrapa si tiene diferente tipo de parametros
    //Atrapa cualquier error que ocurra mientras se ejecuta el codigo de la funcion
    export function callFunction(id:string, myArgs:Pointer[]):Pointer{

        let iter:(Scope | null) = current;
        let myFunctionSignature:(MyFunction | undefined);

        // we traverse the stack of scopes until we find the first 
        // function to have the same name
        while(iter != null){
            myFunctionSignature = iter.myFunctions[id];
            if(myFunctionSignature !== undefined){
                break;
            }
            iter = iter.previous;
        }
        if(myFunctionSignature == undefined){
            throw new MyError(`No existe una funcion con el nomber <${id}> en el entorno actual`);
        }

        // chapuz: revisamos si es una funcion nativa y, de ser asi, la ejecutamos
        // esto funciona por ahora solo porque una funcion nativa no puede tirar 
        // MyErro y porque ninguna func nativa recibe parametros
        if(myFunctionSignature.kind == MyFunctionKind.GRAFICAR_TS){
            let graficarTs = myFunctionSignature.specification as GraficarTs;
            if(myArgs.length != 0){
                throw new MyError(`No se puede llamar a la funcion <graficar_ts> con ${myArgs.length} argumentos`)
            }
            graficar_ts();
            return Pointer.makeUndefinedPointer();
        }

        let nonNativeFunctionSignature = myFunctionSignature.specification as MyNonNativeFunction;
        
        // we check if they have the same number of params and args
        if(myArgs.length != nonNativeFunctionSignature.params.length){
            throw new MyError(`No se puede llamar a la funcion <${id}> con ${myArgs.length} argumentos`)
        }

        // we check the correctness of the types
        for (let i = 0; i < myArgs.length; i++) {
            const pointer = myArgs[i];

            if(pointer.myObj.myType.kind == MyTypeKind.ARRAY ||
                pointer.myObj.myType.kind == MyTypeKind.CUSTOM)
            {
                throw new Error("Env.callFunction no chequea con tipos Array ni Custom TODAVIA");
            }
            //POSIBLE BUG: no se como se manejan las comparaciones en TypeScript!
            let typeArg = pointer.myObj.myType.kind;
            let typeParam = nonNativeFunctionSignature.params[i].myType.kind;
            if(typeArg !== typeParam){
                throw new MyError(`Types no compatibles en el argumento: ${i}. Se tiene: ${typeArg.toString()} se esperaba: ${typeParam.toString()}`)
            }
        }


        // TODO: We set up the environment for the function call:
        // oh... and run the fucking functions too

        throw new Error("WITHOUT FUCKING JUMPERS WE CANT RETURN FROM FUNCTIONS YET!!!!!!!!!!!!!!!!!!");
    }
}
