import { AstNode } from "./AstNode";
import { Expression } from "./Expression"
import { Declaration } from "./Declaration"
import { Assignment } from "./Assignment"

//TODO: los enums no deberian ser strings
export enum StatementKind{
    ExpressionKind = 'Expression',
    DeclarationKind = 'Declaration',
    AssignmentKind = 'Assignment',
}

export class Statement {
    //Common AST attributes
    public astNode:AstNode;

    //We need a better name
    //In Rust this would be an enum Statement, with: if, ifelse, block, assignment ... and other variants
    public child:(Expression | Declaration | Assignment /* block |  | if | ifelse | ... */);

    constructor(statementKind:StatementKind, child:(Expression | Declaration | Assignment),
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        switch (statementKind) {
            case StatementKind.ExpressionKind:
                this.child = child as Expression;
                break;
            case StatementKind.DeclarationKind:
                this.child = child as Declaration;
                break;
            case StatementKind.AssignmentKind:
                this.child = child as Assignment;
                break;
            default:
                throw new Error(`Assertion Error: Construccion de Statement no implementado para el statmentKind: ${statementKind}`);
        }
    }
    
}