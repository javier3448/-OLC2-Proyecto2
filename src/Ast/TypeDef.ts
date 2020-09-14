import { AstNode } from './AstNode';
import { MyTypeNode } from "./MyTypeNode";

export class AttributeNode{
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

export class TypeDef {
    //Common AST attributes
    public astNode:AstNode;

    name:string;
    attributes:AttributeNode[];

    constructor(name:string, attributes:AttributeNode[],
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.name = name;
        this.attributes = attributes;
    }

}
