import { AstNode } from './AstNode';
import { MyTypeNode } from './MyTypeNode';
import { Expression } from './Expression';
import { MyType } from 'src/Compiler/MyType';
import { Variable } from '../Compiler/Variable';

//Data before Compiler.prepassDeclarations
export class UnprocessedDeclData{
    constructor(
        public isConst:boolean,
        public identifier:string,
        public myTypeNode:MyTypeNode,
    ) {   }
}

//Data after Compiler.prepassDeclarations 
export class ProcessedDeclData{
    constructor(
        //just a poiter the variable in the symbol table (with .kind = to UNDECLARED)
        public variable:Variable
    ) {   }
}


export class Declaration {
    //Common AST attributes
    public astNode:AstNode;

    public data:(ProcessedDeclData | UnprocessedDeclData);

    public expression:(Expression | null);

    constructor(isConst:boolean, identifier:string, myTypeNode:(MyTypeNode | null), expression:(Expression | null), firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.data = new UnprocessedDeclData(isConst, identifier, myTypeNode);
        this.expression = expression;
    }
}