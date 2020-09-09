import { Pointer } from "./Pointer";
import { MyError } from './MyError';
import { MyType } from './MyObj';
import { Statement } from '../Ast/Statement';

export enum MyFunctionKind{
    NATIVE = 'NATIVE',
    GRAFICAR_TS = 'GRAFICAR_TS',
}

// just a function pointer
export class GraficarTs{
    // empty. and unnecessary, it is just so a MyFunction with kind GRAFICAR_TS
    // has something in its specification
}

export class Parameter{
    constructor(public paramName:string, public myType:MyType) {   }
}

export class MyNonNativeFunction{
    constructor(public params: Array<Parameter>, public statements: Array<Statement>){   }
}

export class MyFunction{
    public kind:MyFunctionKind;
    public specification:(GraficarTs | MyNonNativeFunction);

    constructor(kind:MyFunctionKind, specification:(MyNonNativeFunction | GraficarTs)){
        this.kind = kind;
        this.specification = specification;
    }

}