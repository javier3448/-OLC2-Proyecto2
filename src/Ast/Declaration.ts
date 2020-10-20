import { AstNode } from './AstNode';
import { MyTypeNode } from './MyTypeNode';
import { Expression } from './Expression';

export enum DeclarationModifier{
    LET,
    CONST,
}

export function declModToString(declMod:DeclarationModifier){
    if(declMod === DeclarationModifier.LET){
        return "let";
    }else if(declMod === DeclarationModifier.CONST){
        return "const";
    }else{
        throw new Error(`declModToString no implementado para ${declMod} todavia`);
    }
}

export class Declaration {
    //Common AST attributes
    public astNode:AstNode;

    public modifier:DeclarationModifier;
    public identifier:string;
    public myTypeNode:MyTypeNode;
    public expression:(Expression | null);

    constructor(identifier:string, myTypeNode:(MyTypeNode | null), expression:(Expression | null), firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.identifier = identifier;
        this.myTypeNode = myTypeNode;
        this.expression = expression;
    }
}