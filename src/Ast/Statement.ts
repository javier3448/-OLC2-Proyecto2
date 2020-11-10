import { AstNode } from "./AstNode";
import { Expression } from "./Expression"
import { Declaration } from "./Declaration";
import { state } from '@angular/animations';
import { MyTypeNode } from './MyTypeNode';

export enum StatementKind{
    ExpressionKind = 'Expression',
    DeclarationKind = 'Declaration',

    WhileKind = 'WhileKind',
    DoWhileKind = 'DoWhileKind',
    IfKind = 'IfKind',
    SwitchKind = 'SwitchKind',
    ForKind = 'ForKind',
    ForOfKind = 'ForOfKind',
    ForInKind = 'ForInKind',

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

export class IfStatement {
    constructor(public expr:Expression, public statements:Array<Statement>, public elseStatment:(null | Statement)){  }
}

export class SwitchStatement {
    constructor(
        public expr:Expression,
        public switchInstructions:SwitchInstruction[],
    ){  }
}

export class SwitchCase {
    constructor(
        public expr:Expression
    ) {   }
}

export class SwitchDefault {
    //... This class its only here because I want to be able
    //to use instance of when dealing with a variable type 'SwitchInstruction'
}

type SwitchInstruction = (Statement | SwitchCase | SwitchDefault)

export class WhileStatement {
    constructor(public expr:Expression, public statements:Array<Statement>){  }
}

export class DoWhileStatement {
    constructor(public statements:Array<Statement>, public expr:Expression){  }
}

export class ForStatement {
    constructor(
        //If inicialExpression is Statement it can only be a declaration statement
        public initialExpression:(Expression | Statement),
        public condicion:(Expression | null), 
        public finalExpression:(Expression | null), 
        public statements:Array<Statement>
    ){  }
}

export class ForInStatement {
    constructor(
        public isConst:boolean,
        public variableId:string,
        public variableType:MyTypeNode,
        public enumerable:Expression, 
        public statements:Statement[],
    ){  }
}

export class ForOfStatement {
    constructor(
        public isConst:boolean,
        public variableId:string,
        public variableType:MyTypeNode,
        public iterable:Expression, 
        public statements:Statement[],
    ){  }
}

export class Statement {
    //Common AST attributes
    public astNode:AstNode;

    public statementKind:StatementKind;
    //We need a better name
    //In Rust this would be an enum Statement, with: if, ifelse, block, assignment ... and other variants
    //child expression para ReturnWithValueKind
    //child null para todos los otros jumpers 
    public child:(Expression | Declaration | Block | WhileStatement | DoWhileStatement | ForStatement | ForOfStatement | ForInStatement | SwitchStatement | null );

    constructor(statementKind:StatementKind, child:(Expression | Declaration | Block | WhileStatement | DoWhileStatement | ForStatement | ForOfStatement | ForInStatement | SwitchStatement | null ),
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

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
            case StatementKind.IfKind:
                if(!(child instanceof IfStatement)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.WhileKind:
                if(!(child instanceof WhileStatement)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.DoWhileKind:
                if(!(child instanceof DoWhileStatement)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.ForKind:
                if(!(child instanceof ForStatement)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.ForOfKind:
                if(!(child instanceof ForOfStatement)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.ForInKind:
                if(!(child instanceof ForInStatement)){
                    throw new Error(`constructor de statement no valido para ${statementKind} y ${child}`);
                }
                break;
            case StatementKind.SwitchKind:
                if(!(child instanceof SwitchStatement)){
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
                break;
            default:
                throw new Error(`Assertion Error: Construccion de Statement no implementado para el statmentKind: ${statementKind}`);
        }

        this.statementKind = statementKind;
        this.child = child;
    }
    
}