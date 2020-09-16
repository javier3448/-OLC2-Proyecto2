import { Pointer } from "./Pointer";
import { MyError } from './MyError';
import { MyType } from './MyType';
import { Statement } from '../Ast/Statement';

export enum MyFunctionKind{
    NON_NATIVE = 'NON_NATIVE',
    GRAFICAR_TS = 'GRAFICAR_TS',
}

export class GraficarTs{
    // empty. and unnecessary, it is just so a MyFunction with kind GRAFICAR_TS
    // has something in its specification
}

export class Parameter{
    constructor(public paramName:string, public myType:MyType) {   }
}

export class MyNonNativeFunction{
    //if return type is null it means it return void
    constructor(public params: Array<Parameter>, public returnType:(MyType | null), public statements: Array<Statement>){   }
}

export class MyFunction{
    public kind:MyFunctionKind;
    public specification:(GraficarTs | MyNonNativeFunction);

    constructor(kind:MyFunctionKind, specification:(MyNonNativeFunction | GraficarTs)){
        this.kind = kind;
        this.specification = specification;
    }

}