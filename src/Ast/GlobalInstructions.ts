import { AstNode } from './AstNode';
import { TypeDef } from './TypeDef';
import { FunctionDef } from './FunctionDef';
import { Statement } from './Statement';

export class GlobalInstructions {
    //Common AST attributes
    public astNode:AstNode;

    typeDefs:TypeDef[];
    functionDefs:FunctionDef[];
    statements:Statement[];

    constructor(){
        this.typeDefs = new Array<TypeDef>();
        this.functionDefs = new Array<FunctionDef>();
        this.statements = new Array<Statement>();
    }

    public setAstNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){
        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);
    }

    public addTypeDef(typeDef:TypeDef){
        this.typeDefs.push(typeDef);
    }

    public addFunctionDef(functionDef:FunctionDef){
        this.functionDefs.push(functionDef);
    }

    public addStatement(statement:Statement){
        this.statements.push(statement);
    }
}