import { MyObj} from "./MyObj";
import { MyType, MyTypeKind } from "./MyType";
import { LiteralExpression } from 'src/Ast/Expression';

//Hicimos esta clase porque se requieren dos niveles de punteros para implementar el comportamiento pasar parametros por
//ref y setear dos simbolos al mismo objeto
//        |Symbol|*|---->|Pointer|*|----->|MyObj|
//                        ^                   ^
//                        |                   |
//        |Symbol|*|------+                   | 
//        //Si queremos que un                |
//        //simbolo sea referencia de otro    |
//        //(ejemplo: al llamar un metodo)    |
//                                            |
//        |Symbol|*|---->|Pointer|*|----------+//Si queremos que dos simbolos apunten al mismo objeto
//                                             //como al hacer asignaciones
//                                             //(a = new obj;
//                                                b = a;)
export class Pointer{
    public myObj:MyObj;

    private constructor(myObj:MyObj){
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
        else if(val === undefined){
            return Pointer.makeUndefinedPointer();
        }
        else if(val === null){
            return Pointer.makeNullPointer();
        }else{
            throw new Error(`makePrimitivePointer no soportado todavia para: ${val}`)
        }
    }

    public static makeNumberPointer(n:number):Pointer{
        return new Pointer(new MyObj(MyType.numberTypeInstance, new Number(n)));
    }

    public static makeStringPointer(s:string):Pointer{
        return new Pointer(new MyObj(MyType.stringTypeInstance, new String(s)));
    }

    public static makeBooleanPointer(b:Boolean):Pointer{
        return new Pointer(new MyObj(MyType.booleanTypeInstance, new Boolean(b)));
    }

    public static makeNullPointer():Pointer{
        return new Pointer(MyObj.nullInstance);
    }

    public static makeUndefinedPointer():Pointer{
        return new Pointer(MyObj.undefinedInstance);
    }
    
    public static makeMyObjectPointer(myObj:MyObj):Pointer{
        return new Pointer(myObj);
    }
}
