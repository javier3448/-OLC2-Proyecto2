const parser = require('../Translator/TranslatorParser');

export let translation:string = "";

//retorna el texto traducido
//chapuz: el resultado de la traduccion se va a escribir en una variable global
//nunca puede retornar null porque se recupera 
//de los 3 tipos de erorres
export function translate(sourceCode:string){
    //vaciamos el buffer donde vamos a guardar la traduccion resultante
    translation = "";
    let result = parser.parse(sourceCode);
    return result;
    //parse get AstNode
    //root.translate
}