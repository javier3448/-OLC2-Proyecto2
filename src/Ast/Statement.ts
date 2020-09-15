import { AstNode } from "./AstNode";
import { Expression } from "./Expression"
import { Declaration } from "./Declaration";

//TODO: los enums no deberian ser strings
export enum StatementKind{
    ExpressionKind = 'Expression',
    DeclarationKind = 'Declaration',

    WhileKind = 'WhileKind',

    BlockKind = 'BlockKind',

    //Jumpers
    BreakKind = 'BreakKind',
    ContinueKind = 'ContinueKind',
    ReturnKind = 'ReturnKind',
    ReturnWithValueKind = 'ReturnWithValueKind',
}

export class Block {
    constructor(public statements:Array<Statement>){   }
}

export class WhileStatement {
    constructor(public expr:Expression, public statements:Array<Statement>){  }
}

export class Statement {
    //Common AST attributes
    public astNode:AstNode;

    public statementKind:StatementKind;
    //We need a better name
    //In Rust this would be an enum Statement, with: if, ifelse, block, assignment ... and other variants
    //child null para todos jumpers que no cargan un valor
    public child:(Expression | Declaration | Block | WhileStatement | null/* | if | ifelse | ... */);

    constructor(statementKind:StatementKind, child:(Expression | Declaration | Block | WhileStatement | null ),
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        //TODO: refactor this assertion so it looks like the other ones
        switch (statementKind) {

            case StatementKind.ExpressionKind:
                if(!(child instanceof Expression)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.DeclarationKind:
                if(!(child instanceof Declaration)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.BlockKind:
                if(!(child instanceof Block)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.WhileKind:
                if(!(child instanceof WhileStatement)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            
            //Jumpers
            case StatementKind.BreakKind:
            case StatementKind.ContinueKind:
            case StatementKind.ReturnKind:
                if(child !== null){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.ReturnWithValueKind:
                if(!(child instanceof Expression)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
            default:
                throw new Error(`Assertion Error: Construccion de Statement no implementado para el statmentKind: ${statementKind}`);
        }

        this.statementKind = statementKind;
        this.child = child;
    }
    
}