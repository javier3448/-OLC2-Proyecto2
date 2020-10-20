import { AstNode } from "./AstNode";
import { Expression } from "./Expression"

export class AssignmentNode {
    //Common AST attributes
    public astNode:AstNode;

    public lvalue:Expression;
    public rvalue:Expression;

    constructor(lvalue:Expression, rvalue:Expression,
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.lvalue = lvalue;
        this.rvalue = rvalue;
    }
}