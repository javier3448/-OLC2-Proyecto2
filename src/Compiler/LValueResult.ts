import { C_ir_instruction, MemKind } from './C_ir_instruction';
import { MyType, MyTypeKind } from "./MyType";

export class LValueResult {
    constructor(
        public myType:MyType,
        //Nos indica si la variable o lo que se de donde vino tiene el modificar const
        public isConst:boolean,
        //answers the question: address relative to what memorySegment? (heap or stack)
        public memKind:MemKind,
        //contiene la direccion en memoria. ([!] NO OFFSET AL STACKFRAME POINTER: p)
        //relativa al segmento especificado en el attributo isInStack. que contiene
        //el valor del lvalue
        //El unico caso en el que addr es un imm es si no se requiere de un valor
        //de runtime como lo es el puntero 'p' y el puntero 'h'
        //Ejemplo: si el lvalue es de una variable global addr es immediate
        public addr:(String | Number),
        public c_ir:C_ir_instruction[],
    ){  }
}

