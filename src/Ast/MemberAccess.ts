import { AstNode } from "./AstNode";
import { Expression } from "./Expression";


// even though we have typeof and instanceof in typescript this is necessary because 
// jison does some weird js things and sometimes we like 'loose the type and its
// functions'. idk
export enum AccessKind{
    FunctionAccess = 'FunctionAccess',         // example: foo.functionCall(zeroOrMoreExpressions)
    IndexAccess = 'IndexAccess',            // example: foo[anExpression]
    AttributeAccess = 'AttributeAccess',        // example: foo.secondName
}

export class FunctionAccess{
    constructor(public functionName:String, public functionArguments:Expression[]){   }
}

export class AttributeAccess{
    constructor(public name:String){   }
}

export class IndexAccess{
    constructor(public index:Expression){   }
}

export class MemberAccess {
    //Common AST attributes
    public astNode: AstNode;

    public accessKind: AccessKind;
    public access: (FunctionAccess | AttributeAccess | IndexAccess);

    constructor(accessKind:AccessKind, access:(FunctionAccess | AttributeAccess | IndexAccess),
                firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){
        
        //Assertions
        switch (accessKind) {
            case AccessKind.FunctionAccess:
                if(!(access instanceof FunctionAccess)){
                    throw new Error(`Constructor MemberAccess: accessKind: <${accessKind}> solo puede tener access con tipo FunctionAccess y no: <${access}>`);
                }
                break;
            case AccessKind.IndexAccess:
                if(!(access instanceof IndexAccess)){
                    throw new Error(`Constructor MemberAccess: accessKind: <${accessKind}> solo puede tener access con tipo IndexAccess y no: <${access}>`);
                }
                break;
            case AccessKind.AttributeAccess:
                if(!(access instanceof AttributeAccess)){
                    throw new Error(`Constructor MemberAccess: accessKind: <${accessKind}> solo puede tener access con tipo AttributeAccess y no: <${access}>`);
                }
                break;
        
            default:
                throw new Error(`Constructor de member access no implementado para el accessKind: <${accessKind}>`);
        }

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        this.accessKind = accessKind;
        this.access = access;
    }
}