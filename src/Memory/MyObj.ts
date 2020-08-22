import { MyType, MyTypeKind } from "./MyType";

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
// console.log(typeof a); // <---esto imprimiria MyType
export class MyObj {
    public myType : MyType;
    public value : any;

    //NO TYPECHECKING
    //hace typechecking pero no se espera que atrapemos esa exception.
    //la intencion es hacer un assert estilo c
    constructor(myType: MyType, value: any){
        this.myType = myType;
        value = value;
        //TODO: assert que my type y value esten de acuerdo
    }

    //retorna true si y solo si es de tipo number, string o boolean
    public isPrimitive():boolean{
        switch (this.myType.kind) {
            case MyTypeKind.NUMBER:
            case MyTypeKind.STRING:
            case MyTypeKind.BOOLEAN:
                return true;
            default:
                return false;
        }
    }

    public isNull():boolean{
        return this.myType.kind == MyTypeKind.NULL;
    }

    public isUndefined():boolean{
        return this.myType.kind == MyTypeKind.UNDEFINED;
    }

    //TODO?: sets y gets para hacer hacer assertions que type y value esten de acuerdo
    //Aqui ayudaria mucho poder tirar exceptions desde cualquier parte poque podriamos hacer algo como
    //setValue(){ if value is not valid {throw type error }}
    //the only problem would be that we dont have the information about the column and line at this point
    //its probably best to just to do a trySetValue that returns false if it failed 
}

//instancia unica de null y undef.
export const MyNull = new MyObj(new MyType(MyTypeKind.NULL), null);
export const MyUndefined = new MyObj(new MyType(MyTypeKind.UNDEFINED), undefined);
//TODO?: poner un asssert que no permita construir un objeto con value null 
//o undef con la unica excepcion de estos dos casos