import { StringLiteralByte } from './StringLiteralByte'
//Este archivo solo existe porque no se como poner
//las funciones adentro del jison

//returns a 0 terminated array of numbers with the ascii 'number' of each 
//character of the source string
//works on any string. replaces \n \t \r for ascii 'number' of newline, tab, return 
//example: javier \n => 106 97 118 105 101 114 10 00
//for any other \. (dot represents any char) it removes the \
//example: javier \" => 106 97 118 105 101 114 32 34 00
export function toStringLiteralBytes(source:string):StringLiteralByte[]{
    let pointer = 0;

    //MEJORA: reserve
    let stringLiteralBytes:StringLiteralByte[] = [];

    while(true){
        //i dont know if string's [] operator returns a byte a UTF-8 thingy or wahtever the fuck. oh well :/
        //so this could cause a bug someday, and because it returns a whole freaking string, its not performant at all
        let _char = source[pointer];
        if(pointer === source.length){
            //MEJORA: nos podemos ahorar este malloc
            stringLiteralBytes.unshift(new StringLiteralByte(true, stringLiteralBytes.length));
            return stringLiteralBytes;
        }
        else if(_char === '\\'){
            //the following if is a chapuz para evitar que un string que termine con 
            //\ de problema
            if(pointer + 1 !== source.length)//if the next char out of bounds we do 
                                             //nothing let the next cycle of the while deal with it
            {
                pointer++; //we have to check the next char
                _char = source[pointer];
                
                if(_char === 'n'){
                    stringLiteralBytes.push(new StringLiteralByte(false, '\n'.charCodeAt(0)));
                }
                else if(_char === 'r'){
                    stringLiteralBytes.push(new StringLiteralByte(false, '\r'.charCodeAt(0)));
                }
                else if(_char === 't'){
                    stringLiteralBytes.push(new StringLiteralByte(false, '\t'.charCodeAt(0)));
                }
                //anything else we dont need to add a special character, just the caracter
                //that follows \
                else{
                    stringLiteralBytes.push(new StringLiteralByte(false, _char.charCodeAt(0)));
                }
            }
        }
        else{
            stringLiteralBytes.push(new StringLiteralByte(false, _char.charCodeAt(0)));
        }
        pointer++;
    }
}
