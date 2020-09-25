import { AstNode } from './AstNode';
import { TypeDef } from './TypeDef';
import { FunctionDefTranslator } from './FunctionDefTranslator';
import { Statement } from './Statement';
import { MyError } from 'src/Runner/MyError';

export class GlobalInstructionsTranslator {
    //Common AST attributes
    public astNode:AstNode;

    instructions:(TypeDef | FunctionDefTranslator | TypeDef)[];
    //Chapuz: para recibir los errores sintacticos del parser
    //        porque Jison no nos deja acceder a sus locales. 
    //        porque Angular no deja hacer variables estaticas
    //        porque no podemos pasar cosas al parser (a demas de la cadena de entrada)
    syntaxErrors:MyError[];

    constructor(){
        this.instructions = [];
    }

    public setAstNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){
        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);
    }
}