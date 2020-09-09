export enum MyTypeNodeKind {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    CUSTOM = 'CUSTOM', //TODO: better name
}

export class MyTypeNode{
    public kind: MyTypeNodeKind;
    // si kind no es custom entonces name debe ser null
    public name?: string;

    // name solo es para los tipos custom
    constructor(kind:MyTypeNodeKind, name?:string){
        this.kind = kind;

        if(kind != MyTypeNodeKind.CUSTOM && name != null){
            throw new Error(`name: <${name}> debe ser null si kind no es CUSTOM`);
        }

        this.name = name;
    }

}