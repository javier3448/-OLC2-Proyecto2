import { AstNode } from './AstNode';

export enum MyTypeNodeKind {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    CUSTOM = 'CUSTOM', 
    ARRAY = 'ARRAY', 
    NULL = 'NULL', 
    UNDEFINED = 'UNDEFINED', 
}

export class MyTypeNode{
    public kind: MyTypeNodeKind;
    // si kind no es custom entonces name debe ser null
    public name: (string | null);
    public subNode: (MyTypeNode | null);
    public astNode: AstNode;

    // name solo es para los tipos custom
    constructor(kind:MyTypeNodeKind, name:(string | null), subNode:(MyTypeNode | null),
                    firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){

        this.astNode = new AstNode(firstLine, firstColumn, lastLine, lastColumn);

        
        //make this assertions easier to understand for fucks sake
        //assertions
        if(kind !== MyTypeNodeKind.CUSTOM && name !== null){
            throw new Error(`name: '${name}' debe ser null si kind no es CUSTOM`);
        }
        if(kind === MyTypeNodeKind.ARRAY && subNode === null){
            throw new Error(`MyTypeNode con kind array debe de tener un subNode no null`);
        }
        if(kind !== MyTypeNodeKind.ARRAY && subNode !== null){
            throw new Error(`MyTypeNode con kind array debe de tener un subNode no null`);
        }

        this.kind = kind;
        this.name = name;
        this.subNode = subNode;
    }

    public static makeNumberTypeNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.NUMBER, null, null, firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeStringTypeNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.STRING, null, null, firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeBooleanTypeNode(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.BOOLEAN, null, null, firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeCustomTypeNode(id:string, firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.CUSTOM, id, null, firstLine, firstColumn, lastLine, lastColumn);
    }

    public static makeArrayTypeNode(myTypeNode:MyTypeNode, firstLine:number, firstColumn:number, lastLine:number, lastColumn:number):MyTypeNode{
        return new MyTypeNode(MyTypeNodeKind.ARRAY, null, myTypeNode, firstLine, firstColumn, lastLine, lastColumn);
    }

}