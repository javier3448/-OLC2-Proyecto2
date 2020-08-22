import { MyObj } from "./MyObj";
import { MyType } from "./MyType";

//Hicimos esta clase porque ser requieren dos niveles de punteros para implementar el comportamiento pasar parametros por
//ref y setear dos simbolos al mismo objeto
//        |Symbol|*|---->|Pointer|*|----->|MyObj|
//                        ^                   ^
//                        |                   |
//        |Symbol|*|------+                   | 
//        //Si queremos que un                |
//        //simbolo sea referencia de otro    |
//        //(ejmplo: al llamar un metodo)     |
//                                            |
//        |Symbol|*|---->|Pointer|*|----------+//Si queremos que dos simbolos apunten al mismo objeto
//                                             //como al hacer asignaciones
//                                             //(a = new obj;
//                                                b = a;)
export class Pointer{
    private myObj:MyObj;

    public getValue():MyObj{
        return this.myObj.value;
    }

    public getType():MyType{
        return this.myObj.myType;
    }

    //NO TYPECHECKING
    public setValue(myObj:MyObj):void{
        let originalType = this.getType();

        if(myObj.isPrimitive()){
            this.myObj = new MyObj()
        }
        if(myObj.value instanceof Number){

        }
    }
}
