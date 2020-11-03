import { C_ir_instruction } from './C_ir_instruction';
import { MyType, MyTypeKind } from "./MyType";

//CONVENCION: un myType NULL va a tener un number -1
export class ExprResult {
    constructor(
        public myType:MyType,
        //Basicamente nos indica si es literal.
        //Por convencion y para facilitarnos la vida un poco:
        //solo los myType number y boolean pueden ser const expr
        public isConstExpr:boolean,
        //val es string con el nombre del temp si:
        //  *constExpr es false
        //  O
        //  *myType no es boolean 
        //MEJORA:Talvez sea mejor solo guardar el numero del temporal 
        //       en vez de su string "T1234"
        //val en null cuando myType es null (i.e. void)
        public val:(Number | String | null),
        public c_ir:C_ir_instruction[],// algunas expressiones va a tener c_ir vacio
                                       // ejemplo: `null`, `413`
    ){  }

}
