import { Pointer } from './Pointer';
import { MyError } from './MyError';
import { myPrint } from "./Runner";


export enum MyTypeKind {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',
    UNDEFINED = 'UNDEFINED',
    ARRAY = 'ARRAY',
    CUSTOM = 'CUSTOM',
    MY_CONSOLE = 'MY_CONSOLE'//Medio chapuz
}

export class MyType
{
    public kind:MyTypeKind;
    //Always null unless typekind is an array
    public name:string;
    public subType:(MyType | null);
    //a type siganture

    constructor(kind:MyTypeKind, subType:(MyType | null)) {
        //assertions:
        if(kind == MyTypeKind.ARRAY && subType == null){
            throw new Error("MyType constructor: no se puede crear un MyType con subType null y kind ARRAY");
        }

        this.kind = kind;
        this.subType = subType;
    }
}

// Decision: El typo del objeto se va llevar en el valor del mismo no solo va ser algo que pongamos 
// en la tabla de simbolos como en c/c++. Lo vamos a guardar en la memoria de runtime, como en java
// Nota: no estoy seguro si asi es como se llevan los tipos en c/c++ y java, pero asi pareciera.
// Entonces algo como:
//   Object
//      ^
//      |
//   MyType
// //objFactory retorna un tipo Object
// let a:Object = objFactory("quiero fabricar un tipo: MyType");
// print(typeof a); // <---esto imprimiria MyType
export class MyObj {
    public myType : MyType;
    public value : (String | Number | Boolean | MyArray | CustomObj | MyConsole | null | undefined);

    constructor(myType:MyType, value:(String | Number | Boolean | MyArray | CustomObj | MyConsole | null | undefined)) {

        //assertions
        switch (myType.kind) {
            case MyTypeKind.STRING:
                if(!(value instanceof String)){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
            case MyTypeKind.NUMBER:
                if(!(value instanceof Number)){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
            case MyTypeKind.BOOLEAN:
                if(!(value instanceof Boolean)){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
            case MyTypeKind.ARRAY :
                if(!(value instanceof MyArray)){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
            case MyTypeKind.CUSTOM:
                if(!(value instanceof MyObj)){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
            case MyTypeKind.NULL:
                if(value != null){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
            case MyTypeKind.UNDEFINED:
                if(value != undefined){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
            case MyTypeKind.MY_CONSOLE:
                if(!(value instanceof MyConsole)){
                    throw new Error(`Constructor MyObj: el myType: <${myType}> no puede tener el valor: <${value}>`);
                }
                break;
        
            default:
                throw new Error(`Constructor MyObj: no implementado para el tipo: <${myType}`);
        }

        this.myType = myType;
        this.value = value;
    }

    public toString(originalPadding:string = ""):string{

        switch (this.myType.kind) {
            case MyTypeKind.STRING:
                return originalPadding + (this.value as String);
            case MyTypeKind.NUMBER:
                return originalPadding + (this.value as Number).toString();
            case MyTypeKind.BOOLEAN:
                return originalPadding + (this.value as Boolean).toString();
            case MyTypeKind.ARRAY :
                return originalPadding + (this.value as MyArray).toString(originalPadding);
            case MyTypeKind.CUSTOM:
                return originalPadding + customObjToString(this.value as CustomObj, originalPadding);
            case MyTypeKind.NULL:
                return originalPadding + "null";
            case MyTypeKind.UNDEFINED:
                return originalPadding + "undefined";

            default:
                throw new Error(`Constructor MyObj: no implementado para el tipo: <${this.myType.kind}`);
        }
    }

    // Por ahora lo vamos a hacer como javascript, si no existe el atributo retornamos undefined
    // Si tratamos de acceder a null o undefined retornamos error
    // return pointer to undefined if the attribute doesnt exist or is undefined
    //[throws_MyError]
    //TODO: Poner que atrapa y que no
    public getAttribute(id:string):Pointer{

        switch (this.myType.kind) {
            case MyTypeKind.STRING:
            case MyTypeKind.NUMBER:
            case MyTypeKind.BOOLEAN:
            case MyTypeKind.MY_CONSOLE:
                return undefined;
            case MyTypeKind.ARRAY :
                // later we could put all the valid ids in a table or something, but for now
                // this is fine
                if(id == "length"){
                    let myArray = this.value as MyArray;
                    //just return the length of the array array of 
                    return Pointer.makeNumberPointer(myArray.array.length);
                }
            case MyTypeKind.CUSTOM:
            {
                let custom = this.value as CustomObj;
                // means custom.id is not part of the type. So, to be like typescript we need to
                // return a pointer to undefined
                if(custom[id] === undefined){
                    //return new pointer to undef
                }
                return custom[id];
            }
            case MyTypeKind.NULL:
                throw new MyError(`No se puede leer propiedad <${id}> de null`);
            case MyTypeKind.UNDEFINED:
                throw new MyError(`No se puede leer propiedad <${id}> de undefined`);

            default:
                throw new Error(`GetAttribute: no implementado para el tipo: <${this.myType.kind}`);
        }

        throw new Error(`Constructor MyObj: no implementado para el tipo: <${this.myType.kind}`);
    }

    //[throws_MyError]
    //TODO: Poner que atrapa y que no
    public callFunction(id:string, functionArguments:Pointer[]):Pointer{
        
        switch (this.myType.kind) {
            case MyTypeKind.MY_CONSOLE:
                if(id == "log"){
                    functionArguments.forEach(functionArgument => {
                        myPrint(functionArgument.myObj);
                    });
                    return Pointer.makeUndefinedPointer();
                }else{
                    throw new MyError(`<${id}> no es una funcion de <console>`);
                }

            case MyTypeKind.STRING:
            case MyTypeKind.NUMBER:
            case MyTypeKind.BOOLEAN:
            case MyTypeKind.ARRAY :
            case MyTypeKind.CUSTOM:
                throw new Error(`GetAttribute: no implementado para el tipo: <${this.myType.kind}`);
            break;

            case MyTypeKind.NULL:
                throw new MyError(`No se puede llamar la funcion <${id}> de null`);
            case MyTypeKind.UNDEFINED:
                throw new Error();
                throw new MyError(`No se puede llamar la funcion <${id}> de undefined`);

            default:
                throw new Error(`GetAttribute: no implementado para el tipo: <${this.myType.kind}`);
        }
    }
}

export class CustomObj {
    // talvez haga falta poner otra hash table para las funciones
    [key:string]: Pointer;
}


export class MyConsole {
    //This type is just so MyObj.value has something when it holds the default global console instance
}

//we add 2 spaces everytime we indent one more level
// like this:
//[
//[
//  [
//    1,
//    2,
//    3
//  ],
// porque CustomObj es [key:string]:Pointer no podemos tener funciones miembro
export function customObjToString(customObj:CustomObj, originalPadding:string):string{

    let nextPadding = ' '.repeat(2) + originalPadding;

    //Chapuz porque no se como chequear si no tienen ningum miembro el CustomObj Cosas de typescript.
    let isEmpty = true;

    let result = "{";
    for(const attributeName in customObj){
        result += "\n" + nextPadding + attributeName + ":" + customObj[attributeName].myObj.toString(nextPadding) + ","
        isEmpty = false;
    }

    if(isEmpty){
        return "{}";
    }

    result = result.slice(0, -1);
    result += "\n" + originalPadding + "}";
    
    return result;
}

export class MyArray {
    array: Array<MyObj>;

    //we dont have to do the switch for every single element. If one element has a type,
    //then all other elments must have the same type AND we can pass the subtype from
    //whoever call this function
    public toString(originalPadding:string):string{
        
        if(this.array.length < 1){
            return "[]";
        }
        
        let nextPadding:string = ' '.repeat + originalPadding;
        let result = "[";

        this.array.forEach(element => {
            result += "\n" + nextPadding + element.toString(nextPadding) + ",";
        });

        result = result.slice(0, -1);
        result += "\n" + originalPadding + "]";
        
        return result;
    }
}
