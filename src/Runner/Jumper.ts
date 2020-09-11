import { MyObj } from "./MyObj";
export enum JumperKind{
    BREAK = 'BREAK',
    CONTINUE = 'CONTINUE',
    RETURN = 'RETURN',
    RETURN_VALUE = 'RETURN_VALUE',
}

export class Jumper{
    
    kind:JumperKind;
    //if value is null then it means it can't be RETURN_VALUE
    value:(MyObj | null);

    constructor(kind:JumperKind, value:(MyObj | null)) {
        //Assertions
        if(kind == JumperKind.RETURN_VALUE && value == null){
            throw new Error("constructor de jumper no valido para RETURN_VALUE y valu = null");
        }
        if(kind != JumperKind.RETURN_VALUE && value != null){
            throw new Error(`constructor de jumper no valido para ${kind} y value = null`);
        }

        this.kind = kind;
        this.value = value;

    }

}