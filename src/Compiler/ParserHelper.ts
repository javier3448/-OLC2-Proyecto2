//Este archivo solo existe porque no se como poner
//las funciones adentro del jison

//works on any string. replaces \n \t \r for newline, tab, return 
//example: javier \n alvarez => javier 
// alvarez
//for any other \. (dot represents any char) it removes the \
//example: javier \" => javier "
export function processScapeSequences(source:string):string{
    let pointer = 0;

    //we dont use the beg and end indices logic (like we did with exprBeg, exprEnd) here because the scape secuences:
    //(\n\r\t...) are 2 chars that become just one. We could do some sort of buffer
    //that flushes from beg to \ everytime we find the \ but that would be too much
    //work and complexity. We will take the perf hit
    let resultString = new String("");

    while(true){
        //i dont know if string's [] operator returns a byte a UTF-8 thingy or wahtever the fuck. oh well :/
        //so this could cause a bug someday, and because it returns a whole freaking string, its not performant at all
        let _char = source[pointer];
        if(pointer === source.length){
            return resultString.toString();
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
                    resultString += '\n';
                }
                else if(_char === 'r'){
                    resultString += '\r';
                }
                else if(_char === 't'){
                    resultString += '\t';
                }
                //anything else we dont need to add a special character, just the caracter
                //that follows \
                else{
                    resultString += _char;
                }
            }
            else{
                console.log("lol");
            }
        }
        else{
            resultString += _char;
        }
        pointer++;
    }
}
