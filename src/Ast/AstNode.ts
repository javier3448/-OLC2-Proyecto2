export type Location = {
    line: number;
    column:number;
}

//TODO: Quitar o completar definicion
//Vamos a usar esta clase abstracta porque por alguna razon, los metodos no jalan cuando instanciamos el objeto 
//desde jison >:(((((
//No soluciono el problema de jison
//se encarga de mantener el idNode, y la linea inicial/final y la columna inicial/final
export abstract class AstNode{
    //Variable estatica para que cada instancia de nodo tenga un id unico.
    //deberia ser una variable global comun y corriente pero el export global
    //dio clavo :/.
    //Si queremos ser OOP podria ser protected static number
    public static astNodeId:number = 0;
    //Retorna el siguiente Id, sirve para casos en los que un nodo no esta atado
    //a una instancia de un objeto. Por ejemplo si queremos tener un nodo para un literal
    //number pero number como tal no esta en un nodo propio, podemos pedir el siguiente id
    //para asegurar el uniqueness del nodo
    public static getNextAstNodeId():number{
        return ++AstNode.astNodeId;
    }

    public firstLine: number;
    public firstColumn: number;

    public lastLine: number;
    public lastColumn: number;

    protected nodeId: number;

    public abstract getNodeId():number;

    //setea las variables de ubiciacion (firstLine, firstColumn, lastLine, lastColumn) y setea el nodeId
    constructor(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){
        //Common AST attributes
        this.firstLine = firstLine;
        this.firstColumn = firstColumn;
        this.lastLine = lastLine;
        this.lastColumn = lastColumn;

        this.nodeId = ++AstNode.astNodeId;
    }
}