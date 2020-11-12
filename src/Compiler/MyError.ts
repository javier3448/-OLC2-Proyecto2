// Por ahora vamos a manejar los errores con exceptions.
// CONVENCION: SOLO PODEMOS ATRAPAR LOS ERRORES QUE IMPLEMENTEMOS NOSOTROS

import { AstNode } from 'src/Ast/AstNode';

export enum MyErrorKind{
    LEXICAL = 'Lexico',
    SINTACTIC = 'Sintactico',
    TYPE_ERROR= 'TypeError',
    //TODO: error kind muy generico
    //Solo para mientras arreglamos el constructor de MyError:
    COMPILATION = 'Compilacion',
    DEFINITION = 'DEFINITION'// cuando algo como un tipo o una funcion no se pueden definir
}

export class MyError{

    public kind:MyErrorKind;
    public message:string;

    public firstLine:(number | null);
    public firstColumn:(number | null);

    constructor(message:string) {
        this.message = message;
        this.kind = MyErrorKind.COMPILATION;
        this.firstLine = null;
        this.firstColumn = null;
    }

    //TODO: Arreglar como construimos MyError

    //esta funcion es un chapuz para no tener que revisar un monton de codigo
    //que usa el constructor(message) de MyError
    public static makeMyError(kind:MyErrorKind, message:string){
        let ret = new MyError(message);
        ret.kind = kind;
        return ret;
    }

    public setLocation(astNode:AstNode){
        this.firstLine = astNode.firstLine;
        this.firstColumn = astNode.firstColumn;
    }

    public isLocationNull():boolean{
        return this.firstLine === null || this.firstColumn === null; 
    }
}

// Porque typescript es una mierda y no hizo bien ni las
// Exceptions.
// Para saber si fuimos nosotros los que tiramos el error 
// vamos a usar instanceof
// try{
//     crashWithMyError();
// } catch (myError){
//     if(myError instanceof MyError){
//         // lo reportamos
//         // propagamos
//         // agregamos info
//         // ...lo que sea
//     }else{
//        throw error;
//     }
// }