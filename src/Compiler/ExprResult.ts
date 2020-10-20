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
        public val:(Number | String | null),
        public c_ir:C_ir_instruction[],// algunas expressiones va a tener c_ir vacio
                                       // ejemplo: `null`, `413`
    ){  }

    //bad name :/
    //retorna el valor en c_ir de val en forma de string para que pueda ser usado
    //por otro lang construct en su c_ir
    //ejemplo:
    //un 10 const expr tiene un val number, entonces retornaria el string: '10'
    //un T10 retorna el string 'T10'
    //null tira error
    derefVal():string{
        if(this.myType.kind === MyTypeKind.NULL){
            throw new Error("No se puede hacer deref");
        }
        return this.val.toString();
    }
}
