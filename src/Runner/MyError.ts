// Por ahora vamos a manejar los errores con exceptions.
// CONVENCION: SOLO PODEMOS ATRAPAR LOS ERRORES QUE IMPLEMENTEMOS NOSOTROS
// no vamos a usar nada de las p
export class MyError{

    public message:string;

    public firstLine:(number | null);
    public firstColumn:(number | null);
    public lastLine:(number | null);
    public lastColumn:(number | null);

    constructor(message:string) {
        this.message = message;

        this.firstLine = null;
        this.firstColumn = null;
        this.lastLine = null;
        this.lastColumn = null;
    }

    public setLocation(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){
        this.firstLine = firstLine;
        this.firstColumn = firstColumn;
        this.lastLine = lastLine;
        this.lastColumn = lastColumn;
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