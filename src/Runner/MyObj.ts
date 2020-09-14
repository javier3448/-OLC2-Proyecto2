import { Pointer } from './Pointer';
import { MyError } from './MyError';
import { myPrint } from "./Runner";
import { ReturnValue } from './ReturnValue';
import { MyType, MyTypeKind, TypeSignature, TypeSignatureTable } from "./MyType";


//TODO: retornar mensaje
//retorna si dos tipos son compatibles
//RECORDAR: que dos custom/anonymous son compatibles si ambos tienen el mismo numero de attributos
//          con el mismo tipo
//RECORDAR: Que null y undefined son compatibles con TODOS los tipos
//[!!!] Tira exception si cualquierda de los dos tipos es ANONYMOUS
export function compareMyTypes(type1:MyType, type2:MyType):boolean{

    //Caso especial si cualquiera de los tipos es undefined o null
    if(type1.kind == MyTypeKind.NULL || type2.kind == MyTypeKind.NULL ||
        type1.kind == MyTypeKind.UNDEFINED || type2.kind == MyTypeKind.UNDEFINED){
        return true;
    }

    //Caso especial: si es array
    if(type1.kind == MyTypeKind.ARRAY && type2.kind == MyTypeKind.ARRAY){
        //TODO
        throw new Error(`Compare types para dos arrays no implementado todavia`);
    }

    if(type1.kind == MyTypeKind.CUSTOM && type2.kind == MyTypeKind.CUSTOM){
        let typeSignature1 = type1.specification as TypeSignature;
        let typeSignature2 = type2.specification as TypeSignature;

        //if they neither is anonymous we can compare their entry on the typeTable
        //(for no just the name because we only have 1 typeTable)
        if(typeSignature1.name != null && typeSignature2.name != null){
            return (typeSignature1.name == typeSignature2.name);
        }

        if(Object.keys(typeSignature1.table).length != Object.keys(typeSignature2.table).length){
            return false
        }
        //Bad performance
        let types1 = Object.values(typeSignature1.table);
        let types2 = Object.values(typeSignature2.table);
        for (let i = 0; i < Object.keys(typeSignature1.table).length; i++) {
            if(!(compareMyTypes(types1[i], types2[i]))){
                return false;
            }
        }
        return true;
    }

    if(type1.kind == type2.kind){
        return true;
    }
    else{
        return false;
    }
}

//TODO: write all the makeMethods so we dont have to use the constructor 

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
                if(!(value instanceof CustomObj)){
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

    public myToString():string{

        switch (this.myType.kind) {
            case MyTypeKind.STRING:
                return (this.value as String).toString();
            case MyTypeKind.NUMBER:
                return (this.value as Number).toString();
            case MyTypeKind.BOOLEAN:
                return (this.value as Boolean).toString();
            case MyTypeKind.ARRAY :
            {
                let myArray = this.value as MyArray;
                if (myArray.array.length < 1){
                    return "";
                }
                let result = "";
                for (const pointer of myArray.array) {
                    result += pointer.myObj.myToString() + ", ";
                }
                result.slice(0, -2);
            }break;
            //this is just how typescript does it, not my fault if it is shitty
            //it is kinda lame that we cant get the string that the console woud
            //print
            case MyTypeKind.MY_CONSOLE:
            case MyTypeKind.CUSTOM:
                return "[object Object]";
            case MyTypeKind.NULL:
                return "null";
            case MyTypeKind.UNDEFINED:
                return "undefined";

            default:
                throw new Error(`Constructor MyObj: no implementado para el tipo: <${this.myType.kind}`);
        }
    }

    public toPrintableString(originalPadding:string = ""):string{

        switch (this.myType.kind) {
            case MyTypeKind.STRING:
                return (this.value as String).toString();
            case MyTypeKind.NUMBER:
                return (this.value as Number).toString();
            case MyTypeKind.BOOLEAN:
                return (this.value as Boolean).toString();
            case MyTypeKind.ARRAY :
                return (this.value as MyArray).toString(originalPadding);
            case MyTypeKind.MY_CONSOLE:
                return "{}";
            case MyTypeKind.CUSTOM:
                return customObjToString(this.value as CustomObj, originalPadding);
            case MyTypeKind.NULL:
                return "null";
            case MyTypeKind.UNDEFINED:
                return "undefined";

            default:
                throw new Error(`Constructor MyObj: no implementado para el tipo: <${this.myType.kind}`);
        }
    }

    // Por ahora lo vamos a hacer como javascript, si no existe el atributo retornamos undefined
    // Si tratamos de acceder a null o undefined retornamos error
    // return pointer to undefined if the attribute doesnt exist or is undefined
    //[throws_MyError]
    //TODO: Poner que atrapa y que no
    //TODO: [!!!] pensar en que tiene que devolver. Mi intuicion dice que siempre debe devolver Pointer
    //pero el .length de array lo complica todo. porque tendriamos que matener un attributo length en my array
    //Y mantener el .length real y el mio de acuedo siempre
    //Por ahora retornamos ReturnValue porque si no existe el atributo retornamos undefined. Ver comentarios de Env.callFunction para mas info
    public getAttribute(id:string):ReturnValue{

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
                    //POTENCIAL BUG!!!!
                    return ReturnValue.makePointerReturn(Pointer.makeNumberPointer(myArray.array.length));
                }
            case MyTypeKind.CUSTOM:
            {
                let custom = this.value as CustomObj;
                // means custom.id is not part of the type. So, to be like typescript we need to
                // return a pointer to undefined
                if(custom[id] === undefined){
                    //return new pointer to undef
                }
                return ReturnValue.makePointerReturn(custom[id]);
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
    //TODO: consider if functionArguments should be pointers or... something else i dont fucking now
    public callFunction(id:string, functionArguments:ReturnValue[]):MyObj{
        
        switch (this.myType.kind) {
            case MyTypeKind.MY_CONSOLE:
                if(id == "log"){
                    for (const functionArgument of functionArguments) {
                        myPrint(functionArgument.getMyObj());
                    }
                    return MyObj.nullInstance;
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

    public getTruthy():boolean{
        switch (this.myType.kind) {
            case MyTypeKind.STRING:
                if((this.value as String).toString()){
                    return true;
                }
                else{
                    return false;
                }
            case MyTypeKind.NUMBER:
                if((this.value as Number).valueOf()){
                    return true;
                }
                else{
                    return false;
                }
            case MyTypeKind.BOOLEAN:
                return (this.value as Boolean).valueOf();
            case MyTypeKind.ARRAY :
            case MyTypeKind.CUSTOM:
            case MyTypeKind.MY_CONSOLE:
                return true;
            case MyTypeKind.NULL:
            case MyTypeKind.UNDEFINED:
                return false;
        
            default:
                throw new Error(`Constructor MyObj: no implementado para el tipo: '${this.myType}'`);
        }
    }

    //Para que solo tengamos una instancia de NullObject.
    //Talvez seria bueno poner privado el constructor para asegurar que no se puedan instanciar mas
    //NullObj
    //por ahora dejarlos public esta bien
    public static nullInstance = new MyObj(MyType.nullTypeInstance, null);
    //public static getNullObject()MyObj{  }

    //Para que solo tengamos una instancia de UndefinedObject.
    //Talvez seria bueno poner privado el constructor para asegurar que no se puedan instanciar mas
    //UndefinedObj
    public static undefinedInstance = new MyObj(MyType.undefinedTypeInstance, undefined);
    //public static getUndefinedObject():MyObj{   }
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
        result += "\n" + nextPadding + attributeName + ":" + customObj[attributeName].myObj.toPrintableString(nextPadding) + ","
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
    array: Array<Pointer>;

    //we dont have to do the switch for every single element. If one element has a type,
    //then all other elments must have the same type AND we can pass the subtype from
    //whoever call this function
    public toString(originalPadding:string):string{
        
        if(this.array.length < 1){
            return "[]";
        }
        
        let nextPadding:string = ' '.repeat + originalPadding;
        let result = "[";

        for (const pointer of this.array) {
            
            result += "\n" + nextPadding + pointer.myObj.toPrintableString(nextPadding) + ",";
        }

        result = result.slice(0, -1);
        result += "\n" + originalPadding + "]";
        
        return result;
    }
}
