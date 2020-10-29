import { MyType, MyTypeKind } from "./MyType";

export class Variable{
    public isConst:boolean;
    //its useful when we are reserving the space for variables 
    //in declarationsPrepass
    public isUndeclared:boolean;
    public myType:MyType;
    //The value of a variable is always a stack frame offset
    public offset:number;
    constructor(isConst:boolean, isUndeclared:boolean, myType:MyType, offset:number){

        //assertion
        if(myType.kind === MyTypeKind.VOID){
            throw new Error("No se puede crear una Variable con myType.kind VOID");
        }

        this.isConst = isConst;
        this.isUndeclared = isUndeclared;
        this.myType = myType;
        this.offset = offset;
    }
}