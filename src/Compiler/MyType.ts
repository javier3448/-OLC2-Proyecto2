import { Attribute } from '@angular/core';
import { MyTypeNode } from 'src/Ast/MyTypeNode';

export enum MyTypeKind {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',
    ARRAY = 'ARRAY',
    //an a array that can have ANY subtype. examples: the expression '[]', new Array(num);
    ALPHA_ARRAY = 'ALPHA_ARRAY',
    CUSTOM = 'CUSTOM',
    VOID = 'VOID',//Medio chapuz
    MY_CONSOLE = 'MY_CONSOLE',//Medio chapuz

    //chapuz porque typescript pv no tiene pointers
    //solo es valido cuando se estan recorriendo los typedefs
    //sirve cuando un typdef hace referencia a un type que todavia 
    //no ha sido reconocido
    //ejemplo:
    // type A = {
    //     a: string;
    //     b: B; //Aqui B se mete a la tabla de tipos con el kind: WAITING
    // }
    // type B = {//en la tabla de simbolos ya existe B pero esta en WAITING. Entonces solo escribimos la definicion sobre el
    //     a: A;
    //     b: number;
    // }
    WAITING = 'WAITING'
}

export class MyAttribute {
    constructor(
        public name:string,
        public myType:MyType
    ) {   }
}

export class TypeSignature
{
    //if null it means it is an 'anonymous' type
    name:(string | null);

    attributes:MyAttribute[];

    public constructor(name:(string | null)) {
        this.name = name;
        this.attributes = [];
    }

    //BAD: this is not consistent with how we just freaking throw a MyError 
    //     whenever something bad happens
    //Agrega de manera ordenada un nuevo atributo con el nombre attributeName y el tipo
    //attributeType al arreglo: 'attributes'
    //returns false if it could be added because there is already another
    //attribute with the same name
    public tryAddAttribute(attributeName:string, attributeType:MyType):boolean{
        //REALLY BAD PERF. because the array is sorted we could determine if it
        //contains an attribute with the same name with a binary search or
        //something and we could also add the elemente as soon as we know its
        //not reapeated
        for (const attribute of this.attributes) {
            if(attribute.name == attributeName){
                return false;
            }
        }

        this.attributes.push(new MyAttribute(attributeName, attributeType));

        //you should really be ashamed of yourself
        this.attributes.sort(function (a:MyAttribute, b:MyAttribute):number{
            if(a.name > b.name){
                return 1;
            }
            if(a.name < b.name){
                return -1;
            }
            return 0;
        });

        return true;
    }

    public isAnon():boolean{
        return this.name === null;
    }

    //retorna [-1, null] si existe un attributo con ese nombre en este typeSignature
    //MEJORA: hacer un struct para [number, (MyType | null)]
    public getAttributeOffsetAndType(name:string):[number, (MyType | null)]{
        //MEJORA: como el arreglo esta ordenado podriamos hacer una mejor busqueda
        for (let i = 0; i < this.attributes.length; i++) {
            if(this.attributes[i].name == name){
                return [i, this.attributes[i].myType];
            }
        }
        return [-1, null];
    }
}

export class MyType
{
    public kind:MyTypeKind;
    //MyType if Array
    //TypeSignature if CUSTOM
    //null for everything else
    public specification:(MyType | TypeSignature | null);

    private constructor(kind:MyTypeKind, specification:(MyType | TypeSignature | null)) {
        //assertions:
        switch (kind) {
                
            case MyTypeKind.NUMBER:
            case MyTypeKind.STRING:
            case MyTypeKind.BOOLEAN:
            case MyTypeKind.NULL:
            case MyTypeKind.MY_CONSOLE:
            case MyTypeKind.WAITING:
            case MyTypeKind.VOID:
            case MyTypeKind.ALPHA_ARRAY:
                if(specification !== null){
                    throw new Error(`No se puede construir un MyType ${kind} con tipo no null`)
                }
                break;
            case MyTypeKind.ARRAY:
                if(!(specification instanceof MyType)){
                    throw new Error(`No se puede construir: un MyType ${kind} debe tener specification de tipo: MyType`)
                }
                break;
            case MyTypeKind.CUSTOM:
                if(!(specification instanceof TypeSignature)){
                    throw new Error(`No se puede construir: un MyType ${kind} debe tener specification de tipo: TypeSignature`)
                }
                break;
        
            default:
                throw new Error(`constructor de MyType no implementado para ${kind}`);
        }

        this.kind = kind;
        this.specification =specification;
    }

    public getName():string{

        switch (this.kind) {
                
            case MyTypeKind.NUMBER:
            case MyTypeKind.STRING:
            case MyTypeKind.BOOLEAN:
            case MyTypeKind.NULL:
            case MyTypeKind.MY_CONSOLE:
            case MyTypeKind.VOID:
                return this.kind.toString();
            case MyTypeKind.ARRAY:
            {
                let subType = this.specification as MyType;
                return `Array<${subType.getName()}>`
            }break;
            case MyTypeKind.ALPHA_ARRAY:
            {
                return `Array<a'>`
            }break;

            case MyTypeKind.CUSTOM:
            {
                let signature = this.specification as TypeSignature;
                if(signature.name === null){
                    return "anonymous";
                }
                return signature.name;
            }break;

            case MyTypeKind.WAITING:
                throw new Error("kind: WAITING NO TIENE METODO TO STRING!!!");

            default:
                throw new Error(`MyType.getName no implementado para ${this.kind}`);
        }
    }

    public getTypeDescription():string{
        switch (this.kind) {
                
            case MyTypeKind.NUMBER:
            case MyTypeKind.STRING:
            case MyTypeKind.BOOLEAN:
            case MyTypeKind.NULL:
            case MyTypeKind.MY_CONSOLE:
            case MyTypeKind.VOID:
                return this.kind.toString();
            case MyTypeKind.ARRAY:
            {
                let subType = this.specification as MyType;
                return `Array<${subType.getName()}>`
            }break;
            case MyTypeKind.ALPHA_ARRAY:
            {
                return `Array<a'>`
            }break;

            case MyTypeKind.CUSTOM:
            {
                let signature = this.specification as TypeSignature;
                //MEJORA: reserve
                let result = "{ ";
                for (const attribute of signature.attributes) {
                    result += `${attribute.name}:${attribute.myType.getName()}, `
                }
                result += "}"
                return result;
            }break;

            case MyTypeKind.WAITING:
                throw new Error("kind: WAITING NO TIENE METODO getDescription!!!");

            default:
                throw new Error(`MyType.getName no implementado para ${this.kind}`);
        }
    }

    public getDefaultVal():Number{
        switch (this.kind) {
            case MyTypeKind.NUMBER:
            case MyTypeKind.BOOLEAN:
                return 0;
            case MyTypeKind.STRING:
            case MyTypeKind.ARRAY:
            case MyTypeKind.ALPHA_ARRAY://Este la verdad nunca deberia de llamar a la funcion getDefaultVal
            case MyTypeKind.CUSTOM:
                //MEJORA?: Que nullPointer se una constante global o algo asi
                return -1;//null pointer
            case MyTypeKind.VOID:
                throw new Error(`MyType.getDefaultValue no puede usarse para: ${this.kind}`);
            default:
                throw new Error(`MyType.getDefaultValue no implementado para ${this.kind}`);
        }
    }

    //MEJORA?: estos nombres se confunden el MyTypeKind
    public static STRING = new MyType(MyTypeKind.STRING, null);
    public static NUMBER = new MyType(MyTypeKind.NUMBER, null);
    public static BOOLEAN = new MyType(MyTypeKind.BOOLEAN, null);
    public static NULL = new MyType(MyTypeKind.NULL, null);
    public static VOID = new MyType(MyTypeKind.VOID, null);
    public static CONSOLE = new MyType(MyTypeKind.MY_CONSOLE, null);
    public static ALPHA_ARRAY = new MyType(MyTypeKind.ALPHA_ARRAY, null);

    public static makeCustomType(typeSignature:TypeSignature):MyType{
        return new MyType(MyTypeKind.CUSTOM, typeSignature);
    }

    public static makeWaitingType():MyType{
        return new MyType(MyTypeKind.WAITING, null);
    }

    public static makeArrayType(subType:MyType):MyType{
        return new MyType(MyTypeKind.ARRAY, subType);
    }

    //[ !!! ] compareTypes(A, B) != compareTypes(B, A)
    //Intended use: para declaraciones y asignaciones de variables: 
    //left: varType, right: exprType
    //DOESNT NOT WORK FOR EVERY TYPE COMPARISSON IN EVERY CIRCUNSTANCE OF THE COMPILATION PROCESS
    //MEJORA?: IT MIGHT BE A GOOD IDEA TO PUT ALL THE DIFFERENT KINDS OF TYPE COMPARISSONS INTO THIS FILE someday
    public static compareTypes(leftType:MyType, rightType:MyType):boolean{
        switch (leftType.kind) {
            case MyTypeKind.NUMBER:
            case MyTypeKind.BOOLEAN:
            case MyTypeKind.VOID:
            case MyTypeKind.MY_CONSOLE:
                return leftType.kind === rightType.kind;
            //TODO: ver en que lugares del compilador es posible que se de este caso
            //      (ademas de == y !=) y ver hay posibles problemas
            case MyTypeKind.NULL:
            {
                if(rightType.kind === MyTypeKind.ALPHA_ARRAY || rightType.kind === MyTypeKind.ARRAY || 
                    rightType.kind === MyTypeKind.CUSTOM || rightType.kind === MyTypeKind.STRING || 
                    rightType.kind === MyTypeKind.MY_CONSOLE){

                    return true;
                }
                return false;
            }
            case MyTypeKind.STRING:
            {
                return (rightType.kind === MyTypeKind.STRING || rightType.kind === MyTypeKind.NULL);
            }break;


            case MyTypeKind.ARRAY:
            {
                if(rightType.kind === MyTypeKind.ALPHA_ARRAY){
                    return true;
                }
                if(rightType.kind === MyTypeKind.ARRAY){
                    return this.compareTypes(leftType.specification as MyType, rightType.specification as MyType);
                }
                return false;
            }break;

            //POTENCIAL BUG:
            //I dont know if this type comparisson is possible in the lang.
            //and if it is I dont know it this is how it should behave
            case MyTypeKind.ALPHA_ARRAY:
            {
                if(rightType.kind === MyTypeKind.ALPHA_ARRAY || rightType.kind === MyTypeKind.ARRAY || rightType.kind === MyTypeKind.NULL){
                    return true;
                }
                return false;
            }break;

            case MyTypeKind.CUSTOM:
            {
                if(rightType.kind === MyTypeKind.NULL){
                    return true;
                }
                let leftSignature = leftType.specification as TypeSignature;
                //because the CustomTypes are not tied to a scope, they are global, we can 
                //just use the names as comparison
                //IMPORTANT DEFINITION: two types that have the exact same signature are NOT
                //the same unless one of them is Anon
                if(rightType.kind === MyTypeKind.CUSTOM){
                    let rightSignature = rightType.specification as TypeSignature;
                    //if neither is anon we only need to compare their names
                    if(!leftSignature.isAnon() && !rightSignature.isAnon()){
                        return leftSignature.name == rightSignature.name;
                    }
                    else{
                        let leftAttributes = leftSignature.attributes;
                        let rightAttributes = rightSignature.attributes;
                        if(leftAttributes.length != rightAttributes.length){
                            return false;
                        }

                        for (let i = 0; i < leftAttributes.length; i++) {
                            if(leftAttributes[i].name != rightAttributes[i].name){
                                return false;
                            }   
                            if(!this.compareTypes(leftAttributes[i].myType, rightAttributes[i].myType)){
                                return false;
                            }
                        }
                        return true;
                    }
                }
                else{
                    return false;
                }
            }break;


        
            default:
                throw new Error(`compareTypes no implementado para leftType: ${leftType}`)
                break;
        }
    }
}
