import { ArrayType } from '@angular/compiler';
import { AstNode } from './AstNode';

export enum MyTypeNodeKind {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    CUSTOM = 'CUSTOM', 

    //We need to differentiate the two ARRAY kind for graphing purposes only
    GENERIC_ARRAY = 'GENERIC_ARRAY', //example: Array<SomeType>
    BOXY_ARRAY = 'ARRAY', //example: SomeType[]...
    
    NULL = 'NULL', 
    UNDEFINED = 'UNDEFINED', 
}

export class CustomTypeNode {
    constructor(public name:string){   }
}

//Works for both GENERIC_ARRAY and BOXY_ARRAY
export class ArrayTypeNode {
    constructor(public subType:MyTypeNode){   }
}

export class MyTypeNode{
    public astNode: AstNode;

    public kind: MyTypeNodeKind;
    // null para todo kind a excepcion de: CUSTOM, GENERIC_ARRAY, BOXY_ARRAY
    public spec: (null | CustomTypeNode | ArrayTypeNode)

    // name solo es para los tipos custom
    constructor(kind:MyTypeNodeKind, spec:(null | CustomTypeNode | ArrayTypeNode),
                    firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);
        
        //assertions
        switch (kind) {
            case MyTypeNodeKind.NUMBER:
            case MyTypeNodeKind.STRING:
            case MyTypeNodeKind.BOOLEAN:
            case MyTypeNodeKind.NULL:
            case MyTypeNodeKind.UNDEFINED:
                if(spec !== null){
                    throw new Error(`constructor de MyTypeNodeKInd espera spec: 'null' para kind: ${kind}`);
                }
            break;

            case MyTypeNodeKind.CUSTOM:
                if(!(spec instanceof CustomTypeNode)){
                    throw new Error(`constructor de MyTypeNodeKInd espera spec: 'CustomTypeNode' para kind: ${kind}`);
                }
            break;
            case MyTypeNodeKind.GENERIC_ARRAY:
            case MyTypeNodeKind.BOXY_ARRAY:
                if(!(spec instanceof ArrayTypeNode)){
                    throw new Error(`constructor de MyTypeNodeKInd espera spec: 'BoxyArrayNode' para kind: ${kind}`);
                }
                break;
        
            default:
                throw new Error(`No se puede usar el constructor de MyTypeNode con kind : ${kind}`);
        }

        this.kind = kind;
        this.spec = spec

    }

    public static makeNumberTypeNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.NUMBER, null, firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeStringTypeNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.STRING, null, firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeBooleanTypeNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.BOOLEAN, null, firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeCustomTypeNode(id:string, firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.CUSTOM, new CustomTypeNode(id), firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeGenericArrayTypeNode(myTypeNode:MyTypeNode, firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.GENERIC_ARRAY, new ArrayTypeNode(myTypeNode), firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeBoxyArrayTypeNode(myTypeNode:MyTypeNode, firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.BOXY_ARRAY, new ArrayTypeNode(myTypeNode), firstLine, firstColumn, lastLine, lastColumn);
    }

}