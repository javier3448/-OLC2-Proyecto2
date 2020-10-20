//it might be better to convine Runner.ts and Envrionment.ts into a single file, idk

import { Expression } from "../Ast/Expression"
import { MyFunction, MyFunctionKind, GraficarTs, MyNonNativeFunction } from "./MyFunction";
import { MyType, MyTypeKind, TypeSignature } from "./MyType";
import { MyError } from './MyError';
import { compileExpression, compileStatement, graficar_ts } from './Compiler';

//WHY THE FUCK DONT WE HAVE A FUCKING HASHTABLE IN FUCKING TYPESCRIPT!!!!!!!
export class SymbolTableVariables{
    [key: string]: Variable;
}
export class SymbolTableFunctions{
    [key: string]: MyFunction;
}
//ERROR PRONE: necesitamos que la clase MyType tenga el nombre del tipo para
//             hacer mejores reportes de errores pero no se como hacer en typescript para hacer
//             una hashtable si tener que hacer un key, value pair.
//             Entonces vamos a tener el nombre del tipo como indice en SymbolTalbeTypeSignatures y 
//             como attributo en MyType y tenemos que asegurar la invariante que ambos strings deben 
//             ser identicos
//Si symbolTableTypeSignature[key] return undefined it means there is no entry
//for that key. IF IT RETURNS myType with kind WAITING it means the key 
//is "waiting" (i.e someone reference that typebut it hasnt been defined yet)
export class SymbolTableTypeSignatures{
    [key: string]: MyType;
}

export class Variable{
    constructor(
        public isConst:boolean,
        public type:MyType,
        //The value of a variable is always a stack frame offset
        public offset:number
    ){   }
}

export enum ScopeKind{
    FUNCTION_SCOPE,
    IF,
    WHILE,
    FOR,
    GLOBAL,
    BLOCK, //a plain old {}
}

//TODO: todo next project: dont use a link list for the scopes.
//      a dynamic array has better perf and its not that hard to implement if you
//      put tags in each scope to not search after outside the 'stack frame' (outside the function)
//BIG TODO: document the definition of stack frame in our lang 
//          (define what the p pointer does and all that)

// The current scope and all previous ones
// ALL VARIABLES IN A SCOPE MUST BE IN STACK FRAME
export class Scope{
    //we need the total size of all variables in a stack frame
    //so we can do the stackframe change before calling a diferent function
    //example:
    //p = p + (sizeof all allocated stack vars before the func call)
    //call func
    //p = p - (sizeof all allocated stack vars before the func call)
    //we could use myVariables.length but typescript is stupid and the
    //only way to get the length of myVariables is to iterate thru it
    public size:number;

    public kind:ScopeKind;
    //TODO: Assert the following invariant in the constructor or something
    //null para todo scopeKind excepto function
    public name:(string | null);

    public myVariables:SymbolTableVariables;
    public myFunctions:SymbolTableFunctions;

    public previous:(Scope | null);

    private constructor(size:number, kind:ScopeKind, name:string, previous:(Scope | null)) {
        this.size = size;
        this.kind = kind;
        this.name = name;
        this.myVariables = new SymbolTableVariables();
        this.myFunctions = new SymbolTableFunctions();

        this.previous = previous;
    }

    public static makeGlobal(){
        return new Scope(0, ScopeKind.GLOBAL, null, null);
    }

    public static makeWhile(previous:Scope){
        return new Scope(0, ScopeKind.WHILE, null, previous);
    }

    public static makeIf(previous:Scope){
        return new Scope(0, ScopeKind.IF, null, previous);
    }

    //TODO: static make of all the other ScopeKinds

    //TODO:
    // public static makeFunctionScope(previous:Scope, myFunctionSignature:MyFunctionSignature){
    //     //[!]: Remember that the size depends on the return 
    //     //value and params inside the functionSignature. same with the name
    //     //return new Scope(
    // }
    

    public getName():string{
        switch (this.kind) {
            case ScopeKind.FUNCTION_SCOPE:
                return "Function_scope"
            case ScopeKind.IF:
                return "If"
            case ScopeKind.WHILE:
                return "While"
            case ScopeKind.FOR:
                return "For"
            case ScopeKind.GLOBAL:
                return "Global"
        
            default:
                throw new Error(`Scope.getName() no implementado para: ${this.kind} todavia!`);
        }
    }
}

export module Env{

    //Como no se pueden definir tipos adentro de un scope o adentro del cuerpo
    //la tabla de simbolos de tipos es global y no va estar dentro de la clase
    //Scope
    export let typeSignatures:SymbolTableTypeSignatures = new SymbolTableTypeSignatures();

    export let global:Scope;
    export let current:Scope;

    // clears the Environment and adds the default functions and variables
    export function initEnvironment():void{
        global = Scope.makeGlobal();

        global.myVariables;

        //Inicializamos los tipos primitivos y Cosole
        //FOR DEBUG ONLY:
        typeSignatures["string"] = MyType.STRING;
        typeSignatures["number"] = MyType.NUMBER;
        typeSignatures["boolean"] = MyType.BOOLEAN;
        typeSignatures["null"] = MyType.NULL;

        // global.myTypeSignatures["Console"] = MyType.consoleTypeInstance;

        //Inicializamos las variables, funciones y definiciones nativas del scope global
        global.myFunctions["graficar_ts"] = new MyFunction(MyFunctionKind.GRAFICAR_TS, new GraficarTs());
        //global.myVariables["console"] = Pointer.makeMyObjectPointer(new MyObj(MyType.consoleTypeInstance, new MyConsole()));

        current = global;
    }

    //REGION: Funciones y variables nativas
    //END: Funciones y variables nativas

    //[throws_MyError]
    //Atrapa si ya exite el id en el current scope
    //[!] Can't do type checking
    export function addVariable(id:string, isConst:boolean, type:MyType):Number{
        //ver si ya existe en el current scope

        if(current.myVariables[id] !== undefined){
            throw new MyError(`No se agregar una variable con el nombre '${id}' porque existe un variable con el mismo nomber en el mismo scope`);
        }

        //WE DONT NEED TO GET THE OFFSET OF THE VARIABLE FROM OUTSIDE THIS
        //METHOD BECAUSE IT ONLY DEPENDS ON CURRENT SIZE OF THIS SCOPE
        let varOffset = current.size
        current.myVariables[id] = new Variable(isConst, type, varOffset);
        current.size += 1;
        return varOffset
    }

    //MEJORA: better name
    //The purpose of this class is to be the type tha getVariable returns.
    //getVariable must tell its caller if the returned variable is in the global scope
    //because if it is it doesnt map to stack[p + variable.val] it maps to stack[variable.val]
    export class ResultingVariable{
        constructor(
            public isGlobal:boolean,
            public variable:Variable,
        ){   } 
    }

    //if null is returned there is no variable with that id in the stack frame or the global variables
    //in the current scope or the previous ones (we stop searching once we find the first)
    //i.e. ReturnValue can only be Pointer of NullInstance
    //only returns variables in the same stack frame so we can
    //safely assume its number is an offset of the current p
    //stack[p+Variable.value]
    export function getVariable(id:string):(ResultingVariable | null){

        let iter:(Scope | null) = current;
        let variable:Variable;

        //MEJORAR: Porfavor mejorar todo este flujo de busqueda :/

        //search all the scopes in the stack frame of Env.current and return the first variable with that id
        //if we find no coincidences we check the globalScope and set a special flag in the returned
        //value
        //if we dont find a variable with that id we return null
        while(iter !== null){
            variable = iter.myVariables[id];
            if(variable !== undefined){
                let isGlobal = iter.kind === ScopeKind.GLOBAL;
                return new ResultingVariable(isGlobal, variable);
            }
            iter = iter.previous;

            if(iter.kind === ScopeKind.FUNCTION_SCOPE){
                //if we reach a function_scope our last hope is that 
                //the variable is in the global scope
                variable = global.myVariables[id];
                if(variable !== undefined){
                    return new ResultingVariable(true, variable);
                }
                else{
                    return null;
                }
            }
        }

        return null;
    }

    /*
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
            throw new MyError(`No existe una funcion con el nomber '${id}' en el entorno actual`);
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
        //CHAPUZ MAXIMO
        //We solved the nested functions problem by not unrolling all the way back to global when 
        //we call a function that is inside anotherone. :(
        //we know a function was defined inside another because it begins with '__'
        //The part that made me give up is that we have to translate first so the info of who is the
        //parent of the function is lost. unless we encode it in the function name which would be
        //hard and stupid.
        //And there is no time left
        //BUG: if we call a nested function it can access variables that were defined by whoever
        //called the parent function
        if(!id.startsWith("__")){
            Env.current = global;
        }
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
            let stmtResult = compileStatement(stmt);
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
            throw new MyError(`La funcion '${id}:' debe retornar un valor de tipo: '${returnType.getName()}`)
        }
    }

    export function pushScope(){
        current = new Scope(current);
    }

    export function popScope(){
        current = current.previous;
    }
    */
}
