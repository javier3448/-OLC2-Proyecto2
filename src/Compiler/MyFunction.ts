import { MyType } from './MyType';

//If it is native the args and the return area exchanged differently => the cir
//generated when calling it, is different. That is the only thing that chagnes

export class MyFunction{
    constructor(
        //the way they are sorted and the size of each
        //tells us all we need to push the necessary args before 
        //calling the function
        public nestingDepth:number, //que tan anidada esta. y cuantos pointers de stackframe espera
        public realName:string, //name in the c_ir might not be the same as the
                                //name that the programmer defined it with
                                //this is the thing we need to jump to the actual code
                                //generated by the function
        public params:MyType[],
        public returnType:MyType,
    ) {   }

    getTypeString():string{
        let resultString = "(";
        for (const param of this.params) {
            resultString = param.getName() + ", ";
        }
        if(resultString.length > 2){
            resultString = resultString.slice(0, resultString.length - 2);
        }
        resultString = resultString + ") => ";
        if(this.returnType === null){
            resultString = resultString + "void"
        }else{
            resultString = resultString + this.returnType.getName();
        }
        return resultString;
    }
}