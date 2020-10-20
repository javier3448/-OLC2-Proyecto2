import { C_ir_instruction } from './C_ir_instruction';
import { MyType, MyTypeKind } from "./MyType";

//MEJORA: it might be better for LValueResult to just have a pointer 
//        its variable that way we dont have to copy all the variable attributes
//        into it. Idont know if attribute lvalues will have an associated variable
//        tho, so idk.
//        the values that are in variable: type, isConst... idk
export class LValueResult {
    constructor(
        public myType:MyType,
        //Nos indica si la variable o lo que se de donde vino tiene el modificar const
        public isConst:boolean,
        //Only works if we only have two segements: stack and heap
        public isInStack:boolean,
        //contiene la direccion en memoria. ([!] NO OFFSET AL STACKFRAME POINTER: p)
        //relativa al segmento especificado en el attributo isInStack. que contiene
        //el valor del lvalue
        //solo puede ser Temp porque siempre necesitamos hacer un calculo previo, ya sea
        //conseguir un valor del heap o hacer el [p+imm]
        public addr:String,
        public c_ir:C_ir_instruction[],
    ){  }
}

