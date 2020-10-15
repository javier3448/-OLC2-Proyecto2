import { MyType, MyTypeKind } from "./MyType";

//CONVENCION: un myType NULL va a tener un number 0
//            quisiera que fuera 0xffffffff (-1) pero 
//            eso no se puede en typescript :(
export class ExprResult {
    constructor(
        public myType:MyType,
        //Basicamente nos indica si es literal.
        //Por convencion y para facilitarnos la vida un poco:
        //solo los myType number y boolean pueden ser const expr
        public isConstExpr:boolean,
        public isLValue:boolean,
        //val es string con el nombre del temp si:
        //  *constExpr es false
        //  O
        //  *myType no es boolean 
        public val:(number | string | null),
        public c_ir:string,// algunas expressiones va a tener c_ir vacio
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
