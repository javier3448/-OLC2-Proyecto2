//it might be better to convine Runner.ts and Envrionment.ts into a single file, idk

import { Expression } from "../Ast/Expression"
import { MyFunction } from "./MyFunction";
import { MyType, MyTypeKind, TypeSignature } from "./MyType";
import { MyError } from './MyError';
import { Variable } from './Variable';
import { Label } from "./C_ir_instruction";

//WHY THE FUCK DONT WE HAVE A FUCKING HASHTABLE IN FUCKING TYPESCRIPT!!!!!!!
export class SymbolTableVariables{
    [key: string]: Variable;
}
export class SymbolTableFunctions{
    [key: string]: MyFunction;
}

//ERROR PRONE: necesitamos que la clase MyType tenga el nombre del tipo para
//             hacer mejores reportes de errores pero no se como hacer en typescript para hacer
//             una hashtable sin tener que hacer un key, value pair.
//             Entonces vamos a tener el nombre del tipo como indice en SymbolTalbeTypeSignatures y 
//             como attributo en MyType y tenemos que asegurar la invariante que ambos strings deben 
//             ser identicos
//Si symbolTableTypeSignature[key] return undefined it means there is no entry
//for that key. IF IT RETURNS myType with kind WAITING it means the key 
//is "waiting" (i.e someone reference that typebut it hasnt been defined yet)
export class SymbolTableTypeSignatures{
    [key: string]: MyType;
}

export enum ScopeKind{
    FUNCTION_SCOPE,
    IF,
    WHILE,
    DO_WHILE,
    FOR,
    FOR_OF,
    FOR_IN,
    SWITCH,
    //el for hace dos scopes diferentes para que cosas como:
    //let i:number = 20;
    //for(let i:number = 0; i < 10; i++){
    //    let i:number = 10;
    //}
    //sean posibles
    //works for 'forof' and 'forin' as well
    AUX_FOR,
    GLOBAL,
    BLOCK, //a plain old {}
}

export class ReturnJumper{
    constructor(
        //puntero al tipo en la tabla de simbolos donde esta el function signature
        public myType:MyType,
        public label:Label
    ) {   }
}
//indica las tags a las que hay que hacer el goto en caso de
//encontrar un statement con:
//*return;
//*break;
//*continue;
//Se supone que solo hay que pasarlas entre statements (i.e. las expresiones no lo necesitan)
//el bucle se encarga de mantenarla. prevJumpAdress + {nuevo break, nuevo continue} = al jumpAddress que se le va 
//a pasar a todos sus statement
// . . . 
export class JumperSet{
    constructor(
        public continueJumper:(Label | null),
        public breakJumper:(Label | null),
        public returnJumper:(ReturnJumper | null),
    ) {   }

    isEmpty():boolean{
        return this.continueJumper === null && 
               this.breakJumper === null && 
               this.returnJumper === null;
    }

    public static makeEmpty():JumperSet{
        return new JumperSet(null, null, null);
    }
}

//TODO: todo next project: dont use a link list for the scopes.
//      a dynamic array has better perf and its not that hard to implement if you
//      put tags in each scope to not search after outside the 'stack frame' (outside the function)
//BIG TODO: document the definition of stack frame in our lang 
//          (define what the p pointer does and all that)

// The current scope and all previous ones
// ALL VARIABLES IN A SCOPE MUST BE IN STACK FRAME
// MEJORA?: talvez seria bueno separar la pila de scopes en diferentes
//          pilas estilo DOD. Porque la mayoria de veces que iteramos a 
//          travez de ella no necesitamos el todo lo que esta en el scope
//MEJORA!: This whole class is a mess and it seems way bigger than it should
//         be
export class Scope{
    //we need the total size of all variables in a stack frame
    //so we can do the stackframe change before calling a diferent function
    //example:
    //p = p + (sizeof all allocated stack vars before the func call)
    //call func
    //p = p - (sizeof all allocated stack vars before the func call)
    //[!!!!!] myVariables.length != size !!!! because the compiler adds additional
    //parameters to nested function because we have to pass the stackframe pointers of their
    //ancestors
    public size:number;

    public kind:ScopeKind;
    //TODO: Assert the following invariant in the constructor or something
    //MEJORA?: seria mejor que esto solo fuera un puntero a la functionSignature
    //null para todo scopeKind excepto function
    private name:(string | null);
    //null para todo scopeKind excepto FUNCTION_SCOPE y GLOBAL
    public nestingDepth:(number | null);

    public myVariables:SymbolTableVariables;
    public myFunctions:SymbolTableFunctions;

    //MEJORA:La mayoria de scopes van a tener esto en empty. Entonces es un buen candidato
    //       para tener una lista separada para esto
    public jumperSet:JumperSet;

    public previous:(Scope | null);

    private constructor(size:number, kind:ScopeKind, jumperSet:JumperSet, name:(string | null), nestingDepth:(number | null), previous:(Scope | null)) {
        this.size = size;
        this.kind = kind;
        this.jumperSet = jumperSet;
        this.name = name;
        this.nestingDepth = nestingDepth;
        this.myVariables = new SymbolTableVariables();
        this.myFunctions = new SymbolTableFunctions();

        this.previous = previous;
    }

    public static makeGlobal(){
        return new Scope(0, ScopeKind.GLOBAL, JumperSet.makeEmpty(), null, -1, null);
    }

    public static makeWhile(previous:Scope, continueJumper:Label, breakJumper:Label){
        return new Scope(0, ScopeKind.WHILE, new JumperSet(continueJumper, breakJumper, null), null, null, previous);
    }

    public static makeDoWhile(previous:Scope, continueJumper:Label, breakJumper:Label){
        return new Scope(0, ScopeKind.DO_WHILE, new JumperSet(continueJumper, breakJumper, null), null, null, previous);
    }

    public static makeAuxFor(previous:Scope){
        return new Scope(0, ScopeKind.AUX_FOR, new JumperSet(null, null, null), null, null, previous);
    }

    public static makeFor(previous:Scope, continueJumper:Label, breakJumper:Label){
        return new Scope(0, ScopeKind.FOR, new JumperSet(continueJumper, breakJumper, null), null, null, previous);
    }

    public static makeForOf(previous:Scope, continueJumper:Label, breakJumper:Label){
        return new Scope(0, ScopeKind.FOR_OF, new JumperSet(continueJumper, breakJumper, null), null, null, previous);
    }

    public static makeForIn(previous:Scope, continueJumper:Label, breakJumper:Label){
        return new Scope(0, ScopeKind.FOR_IN, new JumperSet(continueJumper, breakJumper, null), null, null, previous);
    }

    public static makeSwitch(previous:Scope, breakJumper:Label){
        return new Scope(0, ScopeKind.SWITCH, new JumperSet(null, breakJumper, null), null, null, previous);
    }

    public static makeFunction(previous:Scope, funcName:string, nestingDepth:number, returnType:MyType, returnLabel:Label){
        return new Scope(0, ScopeKind.FUNCTION_SCOPE, new JumperSet(null, null, new ReturnJumper(returnType, returnLabel)), funcName, nestingDepth, previous);
    }

    public static makeIf(previous:Scope){
        return new Scope(0, ScopeKind.IF, JumperSet.makeEmpty(), null, null, previous);
    }

    public static makeBlock(previous:Scope){
        return new Scope(0, ScopeKind.BLOCK, JumperSet.makeEmpty(), null, null, previous);
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
                return this.name;
            case ScopeKind.IF:
                return "If"
            case ScopeKind.WHILE:
                return "While"
            case ScopeKind.DO_WHILE:
                return "DoWhile"
            case ScopeKind.FOR:
                return "For"
            case ScopeKind.FOR_OF:
                return "ForOf"
            case ScopeKind.FOR_IN:
                return "ForIn"
            case ScopeKind.GLOBAL:
                return "Global"
        
            default:
                throw new Error(`Scope.getName() no implementado para: ${this.kind} todavia!`);
        }
    }

}

//MEJORA: better names for ResultingVariable and ResultingVariableKind
export enum VarLocation{
    GLOBAL,
    CURRENT_STACK_FRAME,
    ANCESTOR_STACK_FRAME //(displayIndex) -------------------------\
            //                                                      \
            //The value of the variable will be in stack[stack[p + displayIndex] + variable.offset]
            //This whole thing is because we can access variables that are outside the current 
            //stackframe and that are not globals. Because nested functions.
}
//The purpose of this class is to be the type tha getVariable returns.
//getVariable must tell its caller if the returned variable is in the global frame or a on a 
//frame of a parent function
//because if it is it doesnt map to stack[p + variable.val] it maps to stack[variable.val]
export class ResultingVariable{
    constructor(
        public location:VarLocation,
        //null for every location except OUTSIDE
        public displayIndex:(null | number), 
        //idea: return like a mem access or reg 
        public variable:Variable,
    ){   } 
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
        typeSignatures = new SymbolTableTypeSignatures();
        funcNameCount = 1;
        global = Scope.makeGlobal();

        //Inicializamos las variables, funciones y definiciones nativas del scope global
        //@Volatile @addVariable once we know its symbolo in myVariables is undefined
        let varOffset = global.size
        global.myVariables["console"] = new Variable(true, false, MyType.CONSOLE, varOffset);
        global.size += 1;

        current = global;
    }

    //REGION: Funciones y variables nativas
    //END: Funciones y variables nativas

    //[throws_MyError]
    //Atrapa si ya exite el id en el current scope
    //[!] Can't do type checking
    export function addVariable(id:string, isConst:boolean, type:MyType):Variable{
        //MEJORA: hacer la consulta a la hashtable solo una vez.
        //        no lo hago asi porque no se si typescript devuelbe una copia o algo asi? :(
        if(current.myVariables[id] === undefined){
            //@Volatile @addVariable once we know its symbol in myVariables is undefined
            let varOffset = current.size
            current.myVariables[id] = new Variable(isConst, false, type, varOffset);
            current.size += 1;
            return current.myVariables[id];
        }
        else{
            //We check if it is marked as undeclared, just mark it as declared and
            //return the offset
            if(current.myVariables[id].isUndeclared){
                current.myVariables[id].isUndeclared = false;
                return current.myVariables[id];
            }
            else{
                throw new MyError(`No se agregar una variable con el nombre '${id}' porque existe un variable con el mismo nomber en el mismo scope`);
            }
        }

    }

    //[throws_MyError]
    //Atrapa si ya exite el id en el current scope
    //retorna un puntero a la funcSignature recien insertado
    export function addFuncSignature(level:number, name:string, paramTypes:MyType[], returnType:MyType):(MyFunction | null){
        //ASSERTION:
        //solo se pueden agrear funcSignatures a Scopes con kind: GLOBAL o FUNCTION_SCOPE.
        if(current.kind !== ScopeKind.GLOBAL && current.kind !== ScopeKind.FUNCTION_SCOPE){
            throw new Error("solo se pueden agrear funcSignatures a Scopes con kind: GLOBAL o FUNCTION_SCOPE.");
        }

        //MEJORA: hacer la consulta a la hashtable solo una vez.
        //        no lo hago asi porque no se si typescript devuelbe una copia o algo asi? :(
        if(current.myFunctions[name] !== undefined){
            throw new MyError(`No se agregar una funcion con el nombre '${name}' porque existe una funcion con el mismo nomber en el mismo scope`);
        }

        let c_ir_name = getFunc_c_ir_name(name);
        current.myFunctions[name] = new MyFunction(level, c_ir_name, paramTypes, returnType);
        return current.myFunctions[name];
    }

    let funcNameCount:number = 1;
    function getFunc_c_ir_name(programmerName:string):string{
        let result = "_" + funcNameCount + "_" + programmerName;
        funcNameCount += 1;
        return result;
    }

    //[throws_MyError] 
    //Atrapa si ya existe el id en el current scope
    export function reserveVariable(id:string, isConst:boolean, myType:MyType):Variable{
        //Assertion
        //solo se puede usar en kind FUNCTION y GLOBAL porque son los unicos entornos
        //que pueden tener definiciones de funciones adentro y necesitamos saber las posiciones
        //de las variables que estan afuera de la funcion antes de generar el c_ir de la funcion
        if(current.kind !== ScopeKind.FUNCTION_SCOPE && current.kind !== ScopeKind.GLOBAL){
            throw new Error(`No se pues utlizar la funcion reserveVariable con el current.kind ${current.kind}`);
        }

        if(current.myVariables[id] !== undefined){
            throw new MyError(`No se agregar una variable con el nombre '${id}' porque existe un variable con el mismo nomber en el mismo scope`);
        }

        let varOffset = current.size;
        let variable = new Variable(isConst, true, myType, varOffset);
        current.myVariables[id] = variable;
        current.size += 1;

        return variable;
    }


    //if null is returned there is no variable with that id in the stack frame or the global variables
    //in the current scope or the previous ones (we stop searching once we find the first)
    export function getVariable(id:string):(ResultingVariable | null){
        let iter:(Scope | null) = current;
        let displayIndex:(number | null) = null;
        let variable:Variable;

        //MEJORAR: Porfavor mejorar todo este flujo de busqueda :/

        //search all the scopes in the stack frame of Env.current and return the first variable with that id
        //if we find no coincidences we check the globalScope and set a special flag in the returned
        //value
        //if we dont find a variable with that id we return null
        while(iter !== null){
            variable = iter.myVariables[id];
            if(variable !== undefined){
                if(iter.kind === ScopeKind.GLOBAL){
                    return new ResultingVariable(VarLocation.GLOBAL, null, variable);
                }
                else if(displayIndex === null){
                    return new ResultingVariable(VarLocation.CURRENT_STACK_FRAME, null, variable);
                }
                else{
                    return new ResultingVariable(VarLocation.ANCESTOR_STACK_FRAME, displayIndex, variable);
                }
            }

            //TODO: test
            if(iter.kind === ScopeKind.FUNCTION_SCOPE){
                displayIndex = iter.nestingDepth  - 1;
            }
            iter = iter.previous;
        }

        return null;
    }

    //null si no estamos en un function scope que tenga un retorno no void
    export function getReturnOffset():(null | number){
        let iter:(Scope | null) = current;

        //search all the scopes in the scope stack, return the nesting depth of the first FUNCTION_SCOPE
        //or GLOBAL we find
        while(iter !== null){
            if(iter.kind === ScopeKind.FUNCTION_SCOPE || iter.kind === ScopeKind.GLOBAL){
                //BAD: constante "@return" quemada
                if(iter.myVariables["@return"] === undefined){
                    return null;
                }
                else{
                    return iter.myVariables["@return"].offset;
                }
            }

            iter = iter.previous;
        }

        throw new Error("Assert failed: No existe FUNCTION_SCOPE ni GLOBAL_SCOPE en el stack de scopes (esto es imposible porque siempre tendria que existir el global scope hasta el fondo)");
    }

    //if null is returned there is no function with that name in the scopestack
    export function getFunction(funcName:string):(MyFunction | null){

        let iter:(Scope | null) = current;
        let myFunction:MyFunction;

        //search all the scopes in the stack frame of Env.current and return the first function with that name
        //if we find no coincidences we check the globalScope and set a special flag in the returned
        //value
        //if we dont find a variable with that id we return null
        while(iter !== null){
            myFunction = iter.myFunctions[funcName];
            if(myFunction !== undefined){
                return myFunction;
            }

            iter = iter.previous;
        }

        return null;
    }

    export function getCallerNestingDepth():number{
        let iter:(Scope | null) = current;

        //search all the scopes in the scope stack, return the nesting depth of the first FUNCTION_SCOPE
        //or GLOBAL we find
        while(iter !== null){
            if(iter.kind === ScopeKind.FUNCTION_SCOPE || iter.kind === ScopeKind.GLOBAL){
                return iter.nestingDepth;
            }

            iter = iter.previous;
        }

        throw new Error("Assert failed: No existe FUNCTION_SCOPE ni GLOBAL_SCOPE en el stack de scopes (esto es imposible porque siempre tendria que existir el global scope hasta el fondo)");
    }

    export function getBreakLabel():(Label | null){
        let iter:(Scope | null) = current;

        //search all the scopes in the scope stack, return the nesting depth of the first FUNCTION_SCOPE
        //or GLOBAL we find
        while(iter !== null){
            if(iter.jumperSet.breakJumper !== null){
                return iter.jumperSet.breakJumper;
            }

            if(iter.kind === ScopeKind.FUNCTION_SCOPE || iter.kind === ScopeKind.GLOBAL){
                return null;
            }

            iter = iter.previous;
        }

        throw new Error("no deberiamos de llegar a este punto en la funcion");
    }

    export function getContinueLabel():(Label | null){
        let iter:(Scope | null) = current;

        //search all the scopes in the scope stack, return the nesting depth of the first FUNCTION_SCOPE
        //or GLOBAL we find
        while(iter !== null){
            if(iter.jumperSet.continueJumper !== null){
                return iter.jumperSet.continueJumper;
            }

            if(iter.kind === ScopeKind.FUNCTION_SCOPE || iter.kind === ScopeKind.GLOBAL){
                return null;
            }

            iter = iter.previous;
        }

        throw new Error("no deberiamos de llegar a este punto en la funcion");
    }


    export function getReturnJumper():(ReturnJumper | null){
        let iter:(Scope | null) = current;

        //search all the scopes in the scope stack, return the nesting depth of the first FUNCTION_SCOPE
        //or GLOBAL we find
        while(iter !== null){

            if(iter.kind === ScopeKind.FUNCTION_SCOPE){
                //here we could def go get the return var if there is any
                return iter.jumperSet.returnJumper;
            }

            if(iter.kind === ScopeKind.GLOBAL){
                return null;
            }

            iter = iter.previous;
        }

        throw new Error("no deberiamos de llegar a este punto en la funcion");
    }

    //TODO: documentar las diferencias de pasar el size cuando pusheamos un scope
    //      funcion a cuando pusheamos cualquier otro scope

    export function pushWhileScope(continueJumper:Label, breakJumper:Label){
        current = Scope.makeDoWhile(current, continueJumper, breakJumper);
        current.size = current.previous.size;
    }

    export function pushDoWhileScope(continueJumper:Label, breakJumper:Label){
        current = Scope.makeDoWhile(current, continueJumper, breakJumper);
        current.size = current.previous.size;
    }

    export function pushIfScope(){
        current = Scope.makeIf(current);
        current.size = current.previous.size;
    }

    export function pushBlockScope(){
        current = Scope.makeBlock(current);
        current.size = current.previous.size;
    }

    export function pushFuncScope(funcName:string, nestingDepth:number, returnType:MyType, returnLabel:Label,){
        current = Scope.makeFunction(current, funcName, nestingDepth, returnType, returnLabel);
        //NO APLICA LA TRANSFERENCIA DE SIZE PORQUE ES OTRO STACKFRAME!
        //current.size = current.previous.size;
    }

    export function pushAuxForScope(){
        current = Scope.makeAuxFor(current);
        current.size = current.previous.size;
    }

    export function pushForScope(continueJumper:Label, breakJumper:Label){
        current = Scope.makeFor(current, continueJumper, breakJumper);
        current.size = current.previous.size;
    }

    export function pushForOfScope(continueJumper:Label, breakJumper:Label){
        current = Scope.makeForOf(current, continueJumper, breakJumper);
        current.size = current.previous.size;
    }

    export function pushForInScope(continueJumper:Label, breakJumper:Label){
        current = Scope.makeForIn(current, continueJumper, breakJumper);
        current.size = current.previous.size;
    }

    export function pushSwitchScope(breakJumper:Label){
        current = Scope.makeSwitch(current, breakJumper);
        current.size = current.previous.size;
    }

    export function popScope(){
        current = current.previous;
    }

    
}
