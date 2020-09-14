import { Pointer } from "./Pointer";
import { MyObj } from "./MyObj";
import { MyType, MyTypeKind } from "./MyType";
import { LiteralExpression } from 'src/Ast/Expression';
export enum ReturnKind{
    POINTER = 'POINTER',
    MY_OBJ = 'MY_OBJ'
}

//basically a simple union between (Pointer | MyObj)
//TODO: Think of a better name because the name ReturnValue might get confused
//with the jumpers: return; and return expr;
export class ReturnValue{
    kind:ReturnKind;
    specification:(Pointer | MyObj);

    constructor(kind:ReturnKind, specification:(Pointer | MyObj)) {
        //assertions:
        switch (kind) {
            case ReturnKind.POINTER:
                if(!(specification instanceof Pointer)){
                    throw new Error(`No se puede construir un objeto ReturnValue con kind: ${kind} y specification ${specification}`)
                }
                break;
            case ReturnKind.MY_OBJ:
                if(!(specification instanceof MyObj)){
                    throw new Error(`No se puede construir un objeto ReturnValue con kind: ${kind} y specification ${specification}`)
                }
                break;
        
            default:
                throw new Error(`new ReturnValue no implementado para: ${kind} y specification ${specification}`)
        }

        this.kind = kind;
        this.specification = specification;
    }

    // Hace la dereferencia automaticamente de ser necesario
    public getMyObj():MyObj{
        switch (this.kind) {
            case ReturnKind.MY_OBJ:
                return this.specification as MyObj;
            case ReturnKind.POINTER:
                return (this.specification as Pointer).myObj;
            default:
                throw new Error(`getMyObj no implementado para kind ${this.kind}`)
        }
    }

    public unsafeGetPointer():Pointer{
        return this.specification as Pointer;
    }

    public static makeLiteralExpressionReturn(literalExpression:LiteralExpression):ReturnValue{
        let val = literalExpression.literal;
        if(val instanceof String){
            return ReturnValue.makeStringReturn((val as String).valueOf());
        }
        else if(val instanceof Number){
            return ReturnValue.makeNumberReturn((val as Number).valueOf());
        }
        else if(val instanceof Boolean){
            return ReturnValue.makeBooleanReturn(val as Boolean);
        }
        else if(val == undefined){
            return ReturnValue.makeUndefinedReturn();
        }
        else if(val == null){
            return ReturnValue.makeNullReturn();
        }else{
            throw new Error(`makePrimitivePointer no soportado todavia para: ${val}`)
        }
    }

    public static makeMyObjReturn(myObj:MyObj):ReturnValue{
        return new ReturnValue(ReturnKind.MY_OBJ, myObj);
    }

    public static makePointerReturn(pointer:Pointer):ReturnValue{
        return new ReturnValue(ReturnKind.POINTER, pointer);
    }

    public static makeNumberReturn(n:number):ReturnValue{
        return new ReturnValue(ReturnKind.MY_OBJ, new MyObj(MyType.numberTypeInstance, new Number(n)));
    }

    public static makeStringReturn(s:string):ReturnValue{
        return new ReturnValue(ReturnKind.MY_OBJ, new MyObj(MyType.stringTypeInstance, new String(s)));
    }

    public static makeBooleanReturn(b:Boolean):ReturnValue{
        return new ReturnValue(ReturnKind.MY_OBJ, new MyObj(MyType.booleanTypeInstance, new Boolean(b)));
    }

    public static makeNullReturn():ReturnValue{
        return new ReturnValue(ReturnKind.MY_OBJ, MyObj.nullInstance);
    }

    public static makeUndefinedReturn():ReturnValue{
        return new ReturnValue(ReturnKind.MY_OBJ, MyObj.undefinedInstance);
    }
}