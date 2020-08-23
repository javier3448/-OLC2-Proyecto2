import { translate } from "../Translator/Translator";

import fs from 'fs';
// test1
{
    let inputFile:string = './TestFiles/input1.myts';

    let source = fs.readFileSync(inputFile).toString();

    console.log(source);
    let root = translate(source);
    console.log(root);
    console.log(root.children[0]);
}
