//it might be better to convine Runner.ts and Envrionment.ts into a single file, idk

import { Pointer } from "./Pointer";
import { Expression } from "../Ast/Expression"
import { MyFunction, MyFunctionKind, GraficarTs, MyNonNativeFunction } from "./MyFunction";
import { MyObj, MyType, MyTypeKind, CustomObj, MyConsole, compareMyTypes } from './MyObj';
import { MyError } from './MyError';
import { runExpression } from './Runner';
import { ReturnValue } from './ReturnValue';

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
        global.myVariables["console"] = Pointer.makeMyObjectPointer(new MyObj(new MyType(MyTypeKind.MY_CONSOLE, null), new MyConsole()));
        global.myFunctions["graph_ts"] = new MyFunction(MyFunctionKind.GRAFICAR_TS, new GraficarTs());

        current = global;
    }

    //REGION: Funciones y variables nativas
    export function graficar_ts():void{
        //TODO:
        throw new Error("graficar_ts no soportado todavia!!!");
    }
    //END: Funciones y variables nativas

    //[throws_MyError]
    //Atrapa si ya exite el id en el current scope
    //Atrapa si myType y val no son iguales
    export function addVariable(id:string, myType:(MyType | null), val:MyObj){
        //ver si ya existe en el current scope

        if(current.myVariables[id] !== undefined){
            return new MyError(`No se agregar una variable con el nombre ${id} porque existe un variable con el mismo nomber en el mismo scope`);
        }
        if(current.myFunctions[id] !== undefined){
            return new MyError(`No se agregar una variable con el nombre ${id} porque existe un funcion con el mismo nomber en el mismo scope`);
        }
        //BIG TODO: Agregar un chequeo para que no colisione con las definiciones de variables tampoco

        if(myType != null){
            if(!compareMyTypes(myType, val.myType)){
                return new MyError(`No se agregar una variable con el nombre ${id} porque existe un funcion con el mismo nomber en el mismo scope`);
            }
        }

        current.myVariables[id] = Pointer.makeMyObjectPointer(val);
    }

    //Retorna undefined si no existe el id en niguno de los scopes
    //if ReturnValue is not a pointer then it means the variable doesnt exist
    //in the current scope or the previous ones
    //i.e. ReturnValue can only be Pointer of NullInstance
    export function getVariable(id:string):ReturnValue{

        let iter:(Scope | null) = current;
        let myVariable:Pointer;

        // we traverse the stack of scopes until we find the first 
        // function to have the same name
        while(iter != null){
            myVariable = iter.myVariables[id];
            if(myVariable !== undefined){
                return ReturnValue.makePointerReturn(myVariable);
            }
            iter = iter.previous;
        }
        if(myVariable == undefined){
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
            //we return 'void' which is 'undefined' in typescript
            return MyObj.undefinedInstance;
        }

        let nonNativeFunctionSignature = myFunctionSignature.specification as MyNonNativeFunction;
        
        // we check if they have the same number of params and args
        if(myArgs.length != nonNativeFunctionSignature.params.length){
            throw new MyError(`No se puede llamar a la funcion <${id}> con ${myArgs.length} argumentos`)
        }

        // we check the correctness of the types
        for (let i = 0; i < myArgs.length; i++) {
            const resultValue = myArgs[i];

            if(resultValue.getMyObj().myType.kind == MyTypeKind.ARRAY ||
                resultValue.getMyObj().myType.kind == MyTypeKind.CUSTOM)
            {
                throw new Error("Env.callFunction no chequea con tipos Array ni Custom TODAVIA");
            }
            //POSIBLE BUG: no se como se manejan las comparaciones en TypeScript!
            let typeArg = resultValue.getMyObj().myType.kind;
            let typeParam = nonNativeFunctionSignature.params[i].myType.kind;
            if(typeArg !== typeParam){
                throw new MyError(`Types no compatibles en el argumento: ${i}. Se tiene: ${typeArg.toString()} se esperaba: ${typeParam.toString()}`)
            }
        }


        // TODO: We set up the environment for the function call:
        // oh... and run the fucking functions too

        throw new Error("WITHOUT FUCKING JUMPERS WE CANT RETURN FROM FUNCTIONS YET!!!!!!!!!!!!!!!!!!");
    }

    export function pushScope(){
        current = new Scope(current);
    }

    export function popScope(){
        current = current.previous;
    }
}
