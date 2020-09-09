// Se usa para hacer composicion
export class AstNode{
    //Variable estatica para que cada instancia de nodo tenga un id unico.
    //deberia ser una variable global comun y corriente pero el export global
    //dio clavo :/
    //Si queremos ser OOP podria ser protected static number
    public static AST_COUNT:number = 0;
    //Retorna el siguiente Id, sirve para casos en los que un nodo no esta atado
    //a una instancia de un objeto. Por ejemplo si queremos tener un nodo para un literal
    //number pero number como tal no esta en un nodo propio, podemos pedir el siguiente id
    //para asegurar el uniqueness del nodo
    public static getNextAstNodeId():number{
        return ++AstNode.AST_COUNT;
    }

    public firstLine: number;
    public firstColumn: number;

    public lastLine: number;
    public lastColumn: number;

    //Completely unnecessary|clutters our node object for no good reason
    //The id only helps graphviz create non duplicate nodes it has no purpose
    //on the real AST
    //
    private astNodeId: number;

    // TODO: quitar y reemplazar todas las veces que es utilizado por:
    // Grapher.getNextGraphvizId()
    public getId():number{
        return this.astNodeId;
    }

    constructor(firstLine:number, firstColumn:number, lastLine:number, lastColumn:number){
        this.firstLine = firstLine;
        this.firstColumn = firstColumn;

        this.lastLine = lastLine;
        this.lastColumn = lastColumn;

        this.astNodeId = AstNode.getNextAstNodeId();
    }
}