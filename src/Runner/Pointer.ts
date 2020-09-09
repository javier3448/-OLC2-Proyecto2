import { MyObj, MyType, MyTypeKind } from "./MyObj";
import { LiteralExpression } from 'src/Ast/Expression';

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
    public myObj:MyObj;

    constructor(myObj:MyObj){
        this.myObj = myObj;
    }

    public static makeLiteralExpressionPointer(literalExpression:LiteralExpression):Pointer{
        let val = literalExpression.literal;
        if(val instanceof String){
            return Pointer.makeStringPointer((val as String).valueOf());
        }
        else if(val instanceof Number){
            return Pointer.makeNumberPointer((val as Number).valueOf());
        }
        else if(val instanceof Boolean){
            return Pointer.makeBooleanPointer(val as Boolean);
        }
        else if(val == undefined){
            return Pointer.makeUndefinedPointer();
        }
        else if(val == null){
            return Pointer.makeNullPointer();
        }else{
            throw new Error(`makePrimitivePointer no soportado todavia para: ${val}`)
        }
    }

    public static makeNumberPointer(n:number):Pointer{
        return new Pointer(new MyObj(new MyType(MyTypeKind.NUMBER, null), new Number(n)));
    }

    public static makeStringPointer(s:string):Pointer{
        return new Pointer(new MyObj(new MyType(MyTypeKind.STRING, null), new String(s)));
    }

    public static makeBooleanPointer(b:Boolean):Pointer{
        return new Pointer(new MyObj(new MyType(MyTypeKind.BOOLEAN, null), new Boolean(b)));
    }

    public static makeNullPointer():Pointer{
        return new Pointer(new MyObj(new MyType(MyTypeKind.NULL, null), undefined));
    }

    public static makeUndefinedPointer():Pointer{
        return new Pointer(new MyObj(new MyType(MyTypeKind.UNDEFINED, null), null));
    }
    //the copy methods
}
