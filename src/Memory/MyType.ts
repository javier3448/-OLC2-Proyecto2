export enum MyTypeKind {
    NUMBER,
    STRING,
    BOOLEAN,
    NULL,
    UNDEFINED,
    CUSTOM, //TODO: better name
}

//describe el tipo de un chunk of memory.
//Hicimos una clase y no un simple enum porque el usuario puede definir sus propios tipos
//y la signature de dicho tipo esta en un objeto en algun otro lugar
export class MyType{
    public kind: MyTypeKind;
    //TODO:
    // optional pointer to MyCustomType en la tabla de simbolos\
    // recordar que no podemos especificar el tipo custom solo con su nombre
    // porque pueden existir dos tipos con el mismo nombre siempre y cuando esten 
    // en diferentes scopes

    constructor(kind: MyTypeKind){
        this.kind = kind;
        //this.pointer_to_Custom = bleh;
        //TODO?: Assertions que si kind no es custom entonces pointer to custom DEBE SER null
    }

}

