"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstNode = void 0;
//TODO: Quitar o completar definicion
//Vamos a usar esta clase abstracta porque por alguna razon, los metodos no jalan cuando instanciamos el objeto 
//desde jison >:(((((
//No soluciono el problema de jison
//se encarga de mantener el idNode, y la linea inicial/final y la columna inicial/final
var AstNode = /** @class */ (function () {
    //setea las variables de ubiciacion (firstLine, firstColumn, lastLine, lastColumn) y setea el nodeId
    function AstNode(firstLine, firstColumn, lastLine, lastColumn) {
        //Common AST attributes
        this.firstLine = firstLine;
        this.firstColumn = firstColumn;
        this.lastLine = lastLine;
        this.lastColumn = lastColumn;
        this.nodeId = ++AstNode.astNodeId;
    }
    //Retorna el siguiente Id, sirve para casos en los que un nodo no esta atado
    //a una instancia de un objeto. Por ejemplo si queremos tener un nodo para un literal
    //number pero number como tal no esta en un nodo propio, podemos pedir el siguiente id
    //para asegurar el uniqueness del nodo
    AstNode.getNextAstNodeId = function () {
        return ++AstNode.astNodeId;
    };
    //Variable estatica para que cada instancia de nodo tenga un id unico.
    //deberia ser una variable global comun y corriente pero el export global
    //dio clavo :/.
    //Si queremos ser OOP podria ser protected static number
    AstNode.astNodeId = 0;
    return AstNode;
}());
exports.AstNode = AstNode;
