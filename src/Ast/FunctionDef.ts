import { AstNode } from "./AstNode"; 
import { MyTypeNode } from "./MyTypeNode"; 
import { Statement } from './Statement';
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

    public name:string;
    public params:ParamNode[];
    //IF NULL IT MEANS IT RETURN VOID
    public returnType:(MyTypeNode | null);

    public statements:Statement[];

    constructor(name:string, params:ParamNode[], returnType:MyTypeNode, statements:Statement[],
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.name = name;
        this.params = params;
        this.returnType = returnType;
        this.statements = statements;
    }

}