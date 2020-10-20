import { AstNode } from './AstNode';
import { MyTypeNode } from './MyTypeNode';
import { Expression } from './Expression';


export class Declaration {
    //Common AST attributes
    public astNode:AstNode;

    public isConst:boolean;
    public identifier:string;
    public myTypeNode:MyTypeNode;
    public expression:(Expression | null);

    constructor(isConst:boolean, identifier:string, myTypeNode:(MyTypeNode | null), expression:(Expression | null), firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.isConst = isConst;
        this.identifier = identifier;
        this.myTypeNode = myTypeNode;
        this.expression = expression;
    }
}