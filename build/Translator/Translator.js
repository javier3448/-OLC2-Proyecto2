"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate = exports.translation = void 0;
var parser = require('../Translator/TranslatorParser');
exports.translation = "";
//retorna el texto traducido
//chapuz: el resultado de la traduccion se va a escribir en una variable global
//nunca puede retornar null porque se recupera 
//de los 3 tipos de erorres
function translate(sourceCode) {
    //vaciamos el buffer donde vamos a guardar la traduccion resultante
    exports.translation = "";
    var result = parser.parse(sourceCode);
    return result;
    //parse get AstNode
    //root.translate
}
exports.translate = translate;
