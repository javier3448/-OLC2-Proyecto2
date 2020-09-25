// Por ahora vamos a manejar los errores con exceptions.
// CONVENCION: SOLO PODEMOS ATRAPAR LOS ERRORES QUE IMPLEMENTEMOS NOSOTROS

import { AstNode } from 'src/Ast/AstNode';

export enum MyErrorKind{
    LEXICAL = 'Lexico',
    SINTACTIC = 'Sintactico',
    RUNNER = 'Ejecucion',
    TRANSLATION = 'Traduccion',
}

// no vamos a usar nada de las p
export class MyError{

    public kind:MyErrorKind;
    public message:string;

    public firstLine:(number | null);
    public firstColumn:(number | null);

    constructor(message:string) {
        //por default es runner porque la mayoria de errores que tiramos son runner
        this.kind = MyErrorKind.RUNNER;
        this.message = message;

        this.firstLine = null;
        this.firstColumn = null;
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