//THIS FILE ONLY EXISTS BECAUSE I REALLY DONT WANT TO MAKE THIS WHOLE FUNCTIONS IN JAVASCRIPT
//SO IT CANT BE INSIDE THE .jison

import { TemplateString } from "../Ast/Expression"; 
import { parser as templateStringParser } from "./TemplateStringParser.js";

//something to isolate the expressions inside the string template
//THIS FUNCTION DOES NOT WORK AT ALL IF source IS NOT ACCEPTED BY 
//REGEX: (\`[^`]*\`)
export function stringTemplateParser(source:string):TemplateString{

    let templateString = new TemplateString();

    //The thing that guides the lexing
    let pointer = 1;//we begin at 1 because the first char will always be `

    //we dont use the beg and end indices logic (like we did with exprBeg, exprEnd) here because the scape secuences:
    //(\n\r\t...) are 2 chars that become just one. We could do some sort of buffer
    //that flushes from beg to \ everytime we find the \ but that would be too much
    //work and complexity. We will take the perf hit
    let stringChunkBuffer:String = new String("");

    //when recovering the expression inside ${ HERE } we need to keep count
    //of how many opening braces we find inside so we know if a closing brace
    //corresponds to the closing brace of ${ or its closing an opening brace inside
    //${ HERE }

    //  a  b    c  d
    // ${  {    }  }
    // we need to know that 'c' is closing 'b' not 'a'
    //example that shows the problem:
    //console.log(`hello this is an object literal member: ${10 * {a:13}.a}. Isnt that cool?`);

    while(true){
        //i dont know if string's [] operator returns a byte a UTF-8 thingy or wahtever the fuck. oh well :/
        //so this could cause a bug someday, and because it returns a whole freaking string, its not performant at all
        let _char = source[pointer];
        if(_char === '`'){
            //we do the new String before the push because typescript if fucking retarded and
            //I dont fukcing know at what point my stringChunkBuffer goes from String to string
            templateString.values.push(new String(stringChunkBuffer));
            return templateString;
        }
        else if(_char === '$'){

            //we peek the next char if its '{' we have to find the indexes where the expression
            //begins and ends so we can pass it to the stringTemplateParser
            //else we just put '$' in the string buffer
            if(source[pointer + 1] === '{'){
                pointer += 2;//we 'accept' the '{' so we gotta move the pointer after it
                //we do the new String before the push because typescript if fucking retarded and
                //I dont fukcing know at what point my stringChunkBuffer goes from String to string
                templateString.values.push(new String(stringChunkBuffer));
                stringChunkBuffer = new String("");
                let braceCounter = 1;
                let exprBeg = pointer;//the expression string starts after '{'
                let exprEnd:number;

                while(true){
                    _char = source[pointer];
                    if(_char === '{'){
                        braceCounter++;
                    }
                    else if(_char === '}'){
                        braceCounter--;
                        if(braceCounter == 0){
                            exprEnd = pointer;//ends right at '}' (non inclusive)
                            let exprResult = templateStringParser.parse(source.slice(exprBeg, exprEnd));
                            if(exprResult === null){
                                //@FIXME: reportar error sintactico en la expression
                                console.log("Error sintactico adentro de ${HERE}");
                            }
                            else{
                                templateString.values.push(exprResult);
                            }
                            break;
                        }
                    }
                    else if(_char === '`'){
                        //@FIXME: report an error
                        console.log("syntax error no matching {");
                        return templateString;
                    }
                    else{
                        //do nothing
                    }
                    pointer++;
                }
            }
            else{
                stringChunkBuffer += source[pointer];
            }
        }
        else if(_char === '\\'){
            //the outer if is a chapuz para evitar que cerrar un template string con \` cause problemas
            //solo es para mientras no hagamos una regex que no acepte \` en la terminacion de 
            //stringTemplate. This whole thing is dumb please make a good regex or a better 
            //that doesn't need regex
            if(!(source[pointer + 1] === '`' //we *peek* the next char
                && (pointer + 1 == source.length - 1)//is peek the last char?
            )){
                pointer++; //we have to check the next char
                _char = source[pointer];
                
                if(_char === 'n'){
                    stringChunkBuffer += '\n';
                }
                else if(_char === 'r'){
                    stringChunkBuffer += '\r';
                }
                else if(_char === 't'){
                    stringChunkBuffer += '\t';
                }
                //anything else we dont need to add a special character, just the caracter
                //that follows \
                else{
                    stringChunkBuffer += _char;
                }
            }

        }
        else{
            stringChunkBuffer += _char;
        }
        pointer++;
    }
}