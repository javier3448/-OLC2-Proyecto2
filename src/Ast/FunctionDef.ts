import { AstNode } from "./AstNode"; 
import { MyTypeNode } from "./MyTypeNode"; 
export class ParamNode{
    public astNode:AstNode;

    name:string;
    myTypeNode:MyTypeNode;

    constructor(name:string, myTypeNode:MyTypeNode,
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.name = name;
        this.myTypeNode = myTypeNode;
    }

}

export class FunctionDef {
    //Common AST attributes
    public astNode:AstNode;

    name:string;
    params:ParamNode[];
    returnType:MyTypeNode;

    constructor(name:string, params:ParamNode[]){
        this.name = name;
        this.params = params;
    }

}