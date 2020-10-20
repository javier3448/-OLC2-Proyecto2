import { MyTypeNode } from 'src/Ast/MyTypeNode';

export enum MyTypeKind {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',
    ARRAY = 'ARRAY',
    CUSTOM = 'CUSTOM',
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

// there is probably a better way of doing this but fuck it
// fuck typescript
export class TypeSignatureTable
{
    [key: string]: MyType;
}

export class TypeSignature
{
    //if null it means it is an 'anonymous' type
    name:(string | null);
    table:TypeSignatureTable;

    public constructor(name:(string | null)) {
        this.name = name;
        this.table = new TypeSignatureTable();
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
                return this.kind.toString();
            case MyTypeKind.ARRAY:
            {
                let subType = this.specification as MyType;
                return `Array<${subType.getName()}>`
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

    public getDefaultVal():Number{
        switch (this.kind) {
            case MyTypeKind.NUMBER:
            case MyTypeKind.BOOLEAN:
                return 0;
            case MyTypeKind.STRING:
            case MyTypeKind.ARRAY:
            case MyTypeKind.CUSTOM:
                //MEJORA?: Que nullPointer se una constante global o algo asi
                return -1;//null pointer
            default:
                throw new Error(`MyType.getDefaultValue no implementado para ${this.kind}`);
        }
    }

    //TODO: un typeSignature de String con las funciones nativas
    //MEJORA?: estos nombres se confunden el MyTypeKind
    public static STRING = new MyType(MyTypeKind.STRING, null);
    public static NUMBER = new MyType(MyTypeKind.NUMBER, null);
    public static BOOLEAN = new MyType(MyTypeKind.BOOLEAN, null);
    public static NULL = new MyType(MyTypeKind.NULL, null);

    public static consoleTypeInstance = new MyType(MyTypeKind.MY_CONSOLE, null);

    public static makeCustomType(typeSignature:TypeSignature):MyType{
        return new MyType(MyTypeKind.CUSTOM, typeSignature);
    }

    public static makeWaitingType():MyType{
        return new MyType(MyTypeKind.WAITING, null);
    }

    //TODO: un typeSignature de Array con las funciones nativas de array
    public static makeArrayType(subType:MyType):MyType{
        return new MyType(MyTypeKind.ARRAY, subType);
    }

    //[ !!! ] compareTypes(A, B) != compareTypes(B, A)
    //Intended use: para declaraciones y asignaciones de variables: 
    //left: varType, right: exprType
    public static compareTypes(leftType:MyType, rightType:MyType):boolean{
        switch (leftType.kind) {
            case MyTypeKind.NUMBER:
            {
                return rightType.kind === MyTypeKind.NUMBER;
            }break;

            case MyTypeKind.BOOLEAN:
            {
                return rightType.kind === MyTypeKind.BOOLEAN;
            }break;

            case MyTypeKind.STRING:
            {
                throw new Error(`compareTypes no implementado para leftType: ${leftType}`)
            }break;

            case MyTypeKind.ARRAY:
            {
                throw new Error(`compareTypes no implementado para leftType: ${leftType}`)
            }break;

            case MyTypeKind.CUSTOM:
            {
                throw new Error(`compareTypes no implementado para leftType: ${leftType}`)
            }break;

            case MyTypeKind.MY_CONSOLE:
            {
                throw new Error(`compareTypes no implementado para leftType: ${leftType}`)
            }break;

        
            default:
                throw new Error(`compareTypes no implementado para leftType: ${leftType}`)
                break;
        }
    }
}
