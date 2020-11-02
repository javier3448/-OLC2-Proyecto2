import { MyType, MyTypeKind } from "./MyType";

export class Variable{
    public isConst:boolean;
    // its useful when we are reserving the space for variables 
    // in declarationsPrepass 
    // [!] also: it means that we cant ASSURE that the variable IS declared
    //     at that point in the code generation proccess. But it might
    //     be initialize by the time we actually run the generated
    //     c_ir.
    // In other words we only cared about isUndeclared when the variable
    // is outside the current stackFrame (when accessing globals, and
    // ancestor variables from within a nested function)
    public isUndeclared:boolean;
    public myType:MyType;
    //The value of a variable is always a stack frame offset
    public offset:number;
    constructor(isConst:boolean, isUndeclared:boolean, myType:MyType, offset:number){

        //assertions
        if(myType.kind === MyTypeKind.VOID){
            throw new Error("No se puede crear una Variable con myType.kind VOID");
        }
        //por ahora una varialbe nunca puede tener tipo AlphaArray
        else if(myType.kind === MyTypeKind.ALPHA_ARRAY){
            throw new Error("No se puede crear una Variable con myType.kind ALPHA_ARRAY");
        }
        else if(myType.kind === MyTypeKind.WAITING){
            throw new Error("No se puede crear una Variable con myType.kind WAITING!!!!!!!!!!!!");
        }

        this.isConst = isConst;
        this.isUndeclared = isUndeclared;
        this.myType = myType;
        this.offset = offset;
    }
}