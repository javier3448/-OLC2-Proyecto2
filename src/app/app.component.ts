import { Component, OnInit } from '@angular/core';
import { MyError, MyErrorKind } from 'src/Compiler/MyError';

import { graphAst } from "../Grapher";
import { parser as parser } from "../Compiler/CompilerParser.js";

import { compile as compile } from "../Compiler/Compiler"
import { optimize as optimize } from "../Optimizer/Optimizer"
import { GlobalInstructions } from 'src/Ast/GlobalInstructions';
import { graphviz } from 'd3-graphviz';
import { wasmFolder } from '@hpcc-js/wasm';
import { C_ir_instruction, c_ir_instructions_toString } from 'src/Compiler/C_ir_instruction';


//Representacion de una entrada a un scope del Environment
export class TsEntry{
  constructor(
    public scope:string,
    public name:string,
    public myType:string,
    public value:string,
  ){   }

}

export class OptimizationEntry{
  constructor(
    //BAD: should be an enum
    public regla:string,
    public tipo:string,
    public removedCode:(String | null),
    public addedCode:(String | null),
    public line:string,
  ){   }
}

//Si ts fuera un lenguaje de verdad esta clase no seria necesaria
//solo mandariamos un puntero al string donde esta la consola al runner :(
//MEJORA: better name, it just has the 'datasets' to print errors and symbol table
export class OutputInterface {
  tsDataSet:TsEntry[] = [];
  errorDataSet:MyError[] = [];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'Proyecto1';

  //No podemos hacer que la rutime interface sea estatica porque los ngmodules
  //no funcionan 
  outputInterface: OutputInterface = new OutputInterface();
  optimizations:OptimizationEntry[] = [];

  dotSourceAst:string = "";

  c_ir_string:string = "";
  //The following 3 vars are used to build a string representation of the c_ir so the programmer
  //can actually see it
  c_ir_header:string = "";
  //All the instructions that are there because of the programmer's high level code
  c_ir_global_instructions:C_ir_instruction[] = [];


  optimized_c_ir_string:string = "";
  //The header and the footer are the same for bot the optimized and un optimized version
  optimized_c_ir_global_instructions:C_ir_instruction[] = [];

  sourceString:string;

  ngOnInit(): void {

    wasmFolder('https:cdn.jsdelivr.net/npm/@hpcc-js/wasm@0.3.13/dist');

    {
    let testString = `
(((3 * 3) + 4) - 80 + 40.00 * 2 + 358.50 - (29 / 14.50)) - (0.50) + ((5750 * 2) - 11800 + 1.0);
//lastT == 70
`;
    }
  
    {
    let testString = `
true AND true OR false AND false AND false OR NOT true;
//lastT = 1;
`;
    }

    {
    let testString = `
let a:number = (((3 * 3) + 4) - 80 + 40.00 * 2 + 358.50 - (29 / 14.50)) - (0.50) + ((5750 * 2) - 11800 + 1.0);
let b:number; //0
const c:number;//Error
const d:number = 10; //SymbolTable must have this variable with .isConst == true
//stack[0] == 70;
//stack[1] == 0;
//stack[2] == 10;
`;
    }

    {
    let testString = `
let a:number = 10;
a = 1;
//stack[0] == 1;
`;
    }

    {
  let testString = `
let acc:number = 1;
while(true){
  let inc:number = 1;
  acc = acc + inc;
  //console.log(acc);
}
  `;
    }

    //testear las 5 condiciones de declaracion; (estan en una foto del cuaderno en el celular)
    {
    let testString = `
let a:number = true;//should be an error bu we should still reserve the space for a
//console.log(a);//tiene que ser 0
//stack[0] = 0
    `;
    }

    {
    let testString = `
let a:number = b;//should be an error but we should still reserve the space for a
let b:number = 20;
//console.log(a);//tiene que ser 0
//stack[0] = 0;
//stack[1] = 20;
    `;
    }

    {
      let testString = `
a();
func a(){
  b=1;//shouldnt be an error!
}
let b = 10;
    `;
    }

    {
      let testString = `
let a:number = 20;
let a:number = 10;//should be an error and this statement should deleted in the first pass!
      `;
    }

    {
      let testString = `
  let a:aNonExistantCustomType = 1;//should be an error and this statement should be deleted in the first pass!
      `;
    }

    {
    let testString = `
let a:string = "hello";
console.log(a);
let b:number = console.log(10) + 10;
    `;
    }

    {
    let testString = `
function print(a:number):number{
  console.log(a + 20);
}
    `;
    }

    //PENDING: actually call the thing and use declarations
    {
    let testString = `
function print(a:number):number{
  console.log(a + 10);
  function print(a:number):number{
    console.log(a + 20);
	function print(a:number):number{
	  console.log(a + 30);
  	}
  }
  function pront(a:number):number{
    console.log(a + 40);
  }
}
    `;
    }

    {
    let testString = `
function print10times(s:string):void{
  let count:number = 0;
  while(count < 10){
    console.log(s);
    count = count + 1;
  }
} 
function print10TimesAndReturn(s:string):number{
  let count:number = 0;
  while(count < 10){
    console.log(s);
    count = count + 1;
  }
}
print10times("hello");
console.log(print10TimesAndReturn("Ten times"));
    `;
    }

    {
    let testString = `
function print10times(s:string):void{
  let count:number = 0;
  while(count < 10){
    console.log(s);
    count = count + 1;
   	break;
  }
} 
function print10TimesAndReturn(s:string):number{
  let count:number = 0;
  while(count < 10){
    console.log(s);
    count = count + 1;
  }
  return 4141;
} 
function printForever(s:string):number{
  let count:number = 0;
  while(count < 10){
    console.log(s);
    continue;
    count = count + 1;
  }
}
print10times("hello");
console.log(print10times("ERROR"));//shoud be an error
console.log(print10TimesAndReturn("Javier"));
printForever("FOR EVER");
    `;
    }

    {
    let testString = `
let a:number[] = [10,20,30,40,50];
console.log(a[0]);
console.log(a[1]);
console.log(a[2]);
console.log(a[3]);
console.log(a[4]);
let b:boolean[] = new Array(5);
console.log(b[0]);
console.log(b[1]);
console.log(b[2]);
console.log(b[3]);
console.log(b[4]);
//console.log(a.length);
//luego probar con b[0][1][2]
//y b[0].length
//y que b[0] se le pueda metar otro array
//y new Array(5);
//let b:boolean[] = new Array(5);
// for(let i:number = 0; i < a.length; i++){
//   console.log(a[i]);
//   console.log(NOT b[i]);
// }
    `;
    }

    {
    let testString = `
let a:number[][] = [[10,20,30,40,50], [60,70,80,90,100]];
graficar_ts();
console.log(a[0][0]);//10
console.log(a[0][1]);//20
console.log(a[0][2]);//30
console.log(a[0][3]);//40
console.log(a[0][4]);//50
console.log(a[1][0]);//60
console.log(a[1][1]);//70
console.log(a[1][2]);//80
console.log(a[1][3]);//90
console.log(a[1][4]);//100
let b:boolean[] = new Array(5);
console.log(b[0]);
console.log(b[1]);
console.log(b[2]);
console.log(b[3]);
console.log(b[4]);
//console.log(a.length);
//luego probar con b[0][1][2]
//y b[0].length
//y que b[0] se le pueda metar otro array
//y new Array(5);
//let b:boolean[] = new Array(5);
// for(let i:number = 0; i < a.length; i++){
//   console.log(a[i]);
//   console.log(NOT b[i]);
// }
    `;
    }

    {
    let testString = `
let a:number[][] = [[10,20,30,40,50], [60,70,80,90,100]];
graficar_ts();
console.log(a[0][0]);//10
console.log(a[0][1]);//20
console.log(a[0][2]);//30
console.log(a[0][3]);//40
console.log(a[0][4]);//50
console.log(a[1][0]);//60
console.log(a[1][1]);//70
console.log(a[1][2]);//80
console.log(a[1][3]);//90
console.log(a[1][4]);//100
let b:boolean[] = new Array(5);
console.log(b[0]);
console.log(b[1]);
console.log(b[2]);
console.log(b[3]);
console.log(b[4]);
//console.log(a.length);
//luego probar con b[0][1][2]
//y b[0].length
//y que b[0] se le pueda metar otro array
//y new Array(5);
//let b:boolean[] = new Array(5);
// for(let i:number = 0; i < a.length; i++){
//   console.log(a[i]);
//   console.log(NOT b[i]);
// }
    `;
    }

    {
    let testString = `
let a:number[][] = [[10,20,30,40], [60,70,80,90,100,200]];
graficar_ts();
console.log(a.length);//2
console.log(a[0].length);//5
console.log(a[1].length);//6

console.log((new Array(10)).length);
//console.log(a.length);
//luego probar con b[0][1][2]
//y b[0].length
//y que b[0] se le pueda metar otro array
//y new Array(5);
//let b:boolean[] = new Array(5);
// for(let i:number = 0; i < a.length; i++){
//   console.log(a[i]);
//   console.log(NOT b[i]);
// }
    `;
    }

    {
    let testString = `
console.log(!false);//true
console.log(true&&true);//true
console.log(true||false);//true
    `;
    }

    //test postFix increment and decrement
    {
      let testString = `
let a:number = 1;
console.log(a++);//prints 1
console.log(a);//prints 2
let b:number = 1;
console.log(b--);//prints 1
console.log(b);//prints 0
      `
    }

    //OLD BUG: it wouldn't generate code for console.log(a+b+c); because
    //it would say c wasn't initialized yet
    {
      let testString = `
let a:number = 12345678;
let b:number = 41414141;
let c:number = 88888888;
suma(10, 20);
function suma(a:number, b:number):void
{
  console.log(a+b+c);
}
console.log(a);
console.log(b);
console.log(c);
      `;
    }

    {
      let testString = `
let a:Array<string> =(["Javier", "Antonio", "Alvarez", "Gonzalez"]);
for(let i:number = 0; i < a.length; i++){
  console.log(a[i]);
}
//Javier
//Antonio
//Alvarez
//Gonzalez
      `;
    }

    {
    let testString = `
let i:number = 987654321;
for(let i:number = 0; i < 5; i++){
    let i:number = 41;
    console.log(i);
}
//imprime 41 5 veces
//41
//41
//41
//41
//41
    `;
    }

    //OLD BUG: prints 0.
    //     we didnt put anything in the estack when we hit the return Expr; statement
    {
    let testString = `
function h():number{
  return 100;
}
console.log(h());
    `;
    }

    //OLD BUG: printed nothing, because we didnt add the arg c_ir when generating
    //         call to a function
    {
    let testString = `
function tail(strs:string[]):string[]{
  let result:string[] = new Array(strs.length - 1);
  for(let i:number = 1; i < strs.length; i++){
    result[i - 1] = strs[i];
  }
  return result;
}
let a:Array<string> = tail(["Javier", "Antonio", "Alvarez", "Gonzalez"]);
for(let i:number = 0; i < a.length; i++){
  console.log(a[i]);
}
//Antonio
//Alvarez
//Gonzalez
    `;
    }

    {
    let testString = `
let s:string = " Es un numero";
let a:number = 1234;
let b:number = -1234;
let c:number = 12345678.12345;
let d:number = -12345678.12345;
let e:number = 87654321.65432;
let f:number = -87654321.65432;
let g:number = 0;
let h:number = 0.12345;
let i:number = -0.12345;
console.log(a + s);
console.log(b + s);
console.log(c + s);
console.log(d + s);
console.log(e + s);
console.log(f + s);
console.log(g + s);
console.log(h + s);
console.log(i + s);;
// 1234 Es un numero
// -1234 Es un numero
// 12345678.12345 Es un numero
// -12345678.12345 Es un numero
// 87654321.65432 Es un numero
// -87654321.65432 Es un numero
// 0 Es un numero
// 0.12345 Es un numero
// -0.12345 Es un numero
    }
    `;
    }

    //string concatenation with '+'
    {
  let testString = `
console.log(10 + 10);//20
console.log(10 + true);//11
console.log(false + 10);//10
console.log("This a number: " + 10);//This is a number 10
console.log(10 + ", is a number");//10, is a number
console.log("This a bool: " + true);//This is a bool 10
console.log(false + ", is a bool");//false, is a bool
console.log("This a string: " + "string");//This is a string string
console.log("string" + ", is a string");//string, is a string
  `;
    }

    //'if' test
    {
    let testString = `
let a:boolean = true;
if(a){
  console.log("PASS");
}
a = false;
if(a){
  console.log("FAIL");
}
else{
  console.log("PASS");
}
let b:number = 10;
if(b == 10){
  console.log("b es 10");
}else if(b == 20){
  console.log("b es 20");
}else if(b == 30){
  console.log("b es 30");
}else{
  console.log("b no es ni 10, ni 20, ni 30");
}
    `;
    }

    {
    let testString = `
console.log(2 ** 24);
//16777216
    `;
    }

    {
    let testString = `
//TODO: quitar
//optimization demo:
let a:number = 10;
//reglas 6,7,8 y 9 no se pueden forzar
//pero aveces pasan solitas
a + 0;//regla 10
a - 0;//regla 11
a * 1;//regla 12
a / 1;//regal 13
a * 2;//regal 14
a * 0;//regal 15
a / 0;//regal 16
while(true){
    console.log("este codigo no se elimina");
    break;
    console.log(2 ** 4 - 9 * (8 - 6 * (3 ** 2 - 6 * 5 - 7 * (9 + 7 ** 3) + 10) - 5 ) + 8 * (36 / 6 - 5 * ( 2 * 3)));
    console.log("este codigo si se elimina");
}
let b:boolean = true;
if(b){
    console.log("this should printed");
}
function tail(strs:string[]):string[]{
    let result:string[] = new Array(strs.length - 1);
    for(let i:number = 1; i < strs.length; i++){
        result[i - 1] = strs[i];
    }
    return result;
}
function head(strs:string[]):string{
    return strs[0];
}
function ml_list_constructor(head:string, tail:string[]):string[]{
    let result:string[] = new Array(tail.length + 1);
    result[0] = head;
    for(let i:number = 0; i < tail.length; i++){
        result[i+1] = tail[i];
    }
    return result;
}
function contains(str:string, strs:Array<string>):boolean{
    function imp(strs:Array<string>):boolean{
        if(strs.length == 0){
            return false;
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == str){
                return true;
            }
            else{
                return imp(tail_strs);
            }
        }
    }
    return imp(strs);
}
function replace(target:string, replacement:string, strs:Array<string>):string[]{
    function imp(strs:Array<string>):string[]{
        if(strs.length == 0){
            return [];
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == target){
                return ml_list_constructor(replacement, tail_strs);
            }
            else{
                return ml_list_constructor(head_strs, imp(tail_strs));
            }
        }
    }
    return imp(strs);
}
function replaceAll(target:string, replacement:string, strs:Array<string>):string[]{
    function imp(strs:Array<string>):string[]{
        if(strs.length == 0){
            return [];
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == target){
                return ml_list_constructor(replacement, imp(tail_strs));
            }
            else{
                return ml_list_constructor(head_strs, imp(tail_strs));
            }
        }
    }
    return imp(strs);
}
function replaceInListOfLists(target:string, replacement:string, lists_of_strs:string[][]):string[][]{
    function helper_head(list_of_lists:string[][]):string[]{
        return list_of_lists[0];
    }
    function helper_tail(list_of_lists:string[][]):string[][]{
        let result:string[][] = new Array(list_of_lists.length - 1);
        for(let i:number = 1; i < list_of_lists.length; i++){
            result[i-1] = list_of_lists[i];
        }
        return result;
    }
    function helper_ml_list_constructor(head:string[], tail:string[][]):string[][]{
        let result:string[][] = new Array(tail.length + 1);
        result[0] = head;
        for(let i:number = 0; i < tail.length; i++){
            result[i+1] = tail[i];
        }
        return result;
    }
    function imp(lists_of_strs:string[][]):string[][]{
        function helperReplaceAll(strs:string[]):string[]{
            function imp(strs:Array<string>):string[]{
                if(strs.length == 0){
                    return [];
                }
                else{
                    let head_strs:string = head(strs);
                    let tail_strs:string[] = tail(strs);
                    if(head_strs == target){
                        return ml_list_constructor(replacement, imp(tail_strs));
                    }
                    else{
                        return ml_list_constructor(head_strs, imp(tail_strs));
                    }
                }
            }
            return imp(strs);
        }
        if(lists_of_strs.length == 0){
            return [];
        }
        else{
            let head_list_of_strings:string[] = helper_head(lists_of_strs);
            let tail_list_of_strings:string[][] = helper_tail(lists_of_strs);
            return helper_ml_list_constructor(helperReplaceAll(head_list_of_strings), imp(tail_list_of_strings));
        }
    }
    return imp(lists_of_strs);
}
//No la vamos a hacer estilo funcional por ahora porque que hueva
function print_list(list:string[]):void{
    console.log("[");
    for(let i:number = 0; i < list.length; i++){
        console.log("  [" + i + "]:" + list[i]);
    }
    console.log("]");
}
//No la vamos a hacer estilo funcional por ahora porque que hueva
function print_list_of_lists(list:string[][]):void{
    function print_list(list:string[]):void{
        console.log("  [");
        for(let i:number = 0; i < list.length; i++){
            console.log("    [" + i + "]:" + list[i]);
        }
        console.log("  ]");
    }
    console.log("[");
    for(let i:number = 0; i < list.length; i++){
        console.log("  [" + i + "]:");
        print_list(list[i]);
    }
    console.log("]");
}
print_list(ml_list_constructor("head", ["tail", "tail2"]));
console.log(contains("Pararrayos", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
console.log(contains("Alvarez", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replace("Bicho", ":)", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replaceAll("Bicho", ":D", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replace("nan", "FAIL", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replaceAll("nan", "FAIL", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list_of_lists(replaceInListOfLists("Bicho", ":O", [["Pasta", "Ganar", "Bicho", "Bicho", "Mercado", "Rayos", "Agua", "Bicho"],
                                                         ["Mono","Bicho","Alpaca","Buey","Ratón","Yak","Chinchilla","Bicho"],
                                                         ["Bicho", "Erizo", "Mariposa", "Pez" , "betta", "Hurón", "Bicho", "Serpiente", "Ciervo"],
                                                         ["Calamar", "Cisne", "Bicho", "Tigre", "Perico", "Bicho", "Poni", "Canario"]]));
// [
//   [0]:head,
//   [1]:tail,
//   [2]:tail2
// ]
// true
// false
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]::),
//   [5]:Bicho,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]:Bicho
// ]
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]::D,
//   [5]::D,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]::D
// ]
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]:Bicho,
//   [5]:Bicho,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]:Bicho
// ]
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]:Bicho,
//   [5]:Bicho,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]:Bicho
// ]
// [
//   [0]:[
//     [0]:Pasta,
//     [1]:Ganar,
//     [2]::O,
//     [3]::O,
//     [4]:Mercado,
//     [5]:Rayos,
//     [6]:Agua,
//     [7]::O
//   ],
//   [1]:[
//     [0]:Mono,
//     [1]::O,
//     [2]:Alpaca,
//     [3]:Buey,
//     [4]:Ratón,
//     [5]:Yak,
//     [6]:Chinchilla,
//     [7]::O
//   ],
//   [2]:[
//     [0]::O,
//     [1]:Erizo,
//     [2]:Mariposa,
//     [3]:Pez,
//     [4]:betta,
//     [5]:Hurón,
//     [6]::O,
//     [7]:Serpiente,
//     [8]:Ciervo
//   ],
//   [3]:[
//     [0]:Calamar,
//     [1]:Cisne,
//     [2]::O,
//     [3]:Tigre,
//     [4]:Perico,
//     [5]::O,
//     [6]:Poni,
//     [7]:Canario
//   ]
// ]
  `;
    }

    {
    let testString = `
let s:string = "Hello.";
console.log(s.charAt(1));//e
console.log(s.toUpperCase());//HELLO.
console.log(s.toLowerCase());//hello.
console.log(s.concat(" And Goodbye!"));//Hello. And Goodbye!
    `;
    }

    //Test: STRING == STRING
    {
    let testString = `
let a:string = "hello";
console.log(a == "hello");//true
console.log(a.toUpperCase().toLowerCase() == "hello");//true
console.log("hello" == "hellO");//false
console.log("hello" == "hellos");//false
console.log("hello" == "");//false
    `;
    }

    //Test: STRING != STRING
    {
    let testString = `
let a:string = "hello";
console.log(a != "hello");//false
console.log(a.toUpperCase().toLowerCase() != "hello");//false
console.log("hello" != "hellO");//true
console.log("hello" != "hellos");//true
console.log("hello" != "");//true
`;
    }

    //OLD BUG: prints false for both contains (first should be true)
    //         it was because we didnt pass the current stack frame when we do compileFuncCall
    //         with callee.depth == caller.depth + 1
    {
    let testString = `
  function tail(strs:string[]):string[]{
      let result:string[] = new Array(strs.length - 1);
      for(let i:number = 1; i < strs.length; i++){
          result[i - 1] = strs[i];
      }
      return result;
  }
  function head(strs:string[]):string{
      return strs[0];
  }
  function contains(str:string, strs:Array<string>):boolean{
      function imp(strs:Array<string>):boolean{
          if(strs.length == 0){
              return false;
          }
          else{
              let head_strs:string = head(strs);
              let tail_strs:string[] = tail(strs);
              if(head_strs == str){
                  return true;
              }
              else{
                  return imp(tail_strs);
              }
          }
      }
      return imp(strs);
  }
  console.log(contains("Pararrayos", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));//true
  console.log(contains("Alvarez", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));//false
    `;
    }

    //OLD BUG: ruins everything as soon as we call replace
    //OLD BUG: replace doesnt work when it matches and it doesnt work when it doesnt
    //         many many things didnt work because we didnt back up things properly and
    //         we didnt tell the rest of the AST "we have used some additional stack
    //         space, please dont use, for it is ours"
    //PASSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
    //FUCKING PASSSSSSSS! :D
    //USE IT AS REGRESION TEST PLEASE. BEFORE YOU CHECKIN and whenever you make a big change
    {
    let testString = `
function tail(strs:string[]):string[]{
    let result:string[] = new Array(strs.length - 1);
    for(let i:number = 1; i < strs.length; i++){
        result[i - 1] = strs[i];
    }
    return result;
}
function head(strs:string[]):string{
    return strs[0];
}
function ml_list_constructor(head:string, tail:string[]):string[]{
    let result:string[] = new Array(tail.length + 1);
    result[0] = head;
    for(let i:number = 0; i < tail.length; i++){
        result[i+1] = tail[i];
    }
    return result;
}
function contains(str:string, strs:Array<string>):boolean{
    function imp(strs:Array<string>):boolean{
        if(strs.length == 0){
            return false;
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == str){
                return true;
            }
            else{
                return imp(tail_strs);
            }
        }
    }
    return imp(strs);
}
function replace(target:string, replacement:string, strs:Array<string>):string[]{
    function imp(strs:Array<string>):string[]{
        if(strs.length == 0){
            return [];
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == target){
                return ml_list_constructor(replacement, tail_strs);
            }
            else{
                return ml_list_constructor(head_strs, imp(tail_strs));
            }
        }
    }
    return imp(strs);
}
function replaceAll(target:string, replacement:string, strs:Array<string>):string[]{
    function imp(strs:Array<string>):string[]{
        if(strs.length == 0){
            return [];
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == target){
                return ml_list_constructor(replacement, imp(tail_strs));
            }
            else{
                return ml_list_constructor(head_strs, imp(tail_strs));
            }
        }
    }
    return imp(strs);
}
function replaceInListOfLists(target:string, replacement:string, lists_of_strs:string[][]):string[][]{
    function helper_head(list_of_lists:string[][]):string[]{
        return list_of_lists[0];
    }
    function helper_tail(list_of_lists:string[][]):string[][]{
        let result:string[][] = new Array(list_of_lists.length - 1);
        for(let i:number = 1; i < list_of_lists.length; i++){
            result[i-1] = list_of_lists[i];
        }
        return result;
    }
    function helper_ml_list_constructor(head:string[], tail:string[][]):string[][]{
        let result:string[][] = new Array(tail.length + 1);
        result[0] = head;
        for(let i:number = 0; i < tail.length; i++){
            result[i+1] = tail[i];
        }
        return result;
    }
    function imp(lists_of_strs:string[][]):string[][]{
        function helperReplaceAll(strs:string[]):string[]{
            function imp(strs:Array<string>):string[]{
                if(strs.length == 0){
                    return [];
                }
                else{
                    let head_strs:string = head(strs);
                    let tail_strs:string[] = tail(strs);
                    if(head_strs == target){
                        return ml_list_constructor(replacement, imp(tail_strs));
                    }
                    else{
                        return ml_list_constructor(head_strs, imp(tail_strs));
                    }
                }
            }
            return imp(strs);
        }
        if(lists_of_strs.length == 0){
            return [];
        }
        else{
            let head_list_of_strings:string[] = helper_head(lists_of_strs);
            let tail_list_of_strings:string[][] = helper_tail(lists_of_strs);
            return helper_ml_list_constructor(helperReplaceAll(head_list_of_strings), imp(tail_list_of_strings));
        }
    }
    return imp(lists_of_strs);
}
//No la vamos a hacer estilo funcional por ahora porque que hueva
function print_list(list:string[]):void{
    console.log("[");
    for(let i:number = 0; i < list.length; i++){
        console.log("  [" + i + "]:" + list[i]);
    }
    console.log("]");
}
//No la vamos a hacer estilo funcional por ahora porque que hueva
function print_list_of_lists(list:string[][]):void{
    function print_list(list:string[]):void{
        console.log("  [");
        for(let i:number = 0; i < list.length; i++){
            console.log("    [" + i + "]:" + list[i]);
        }
        console.log("  ]");
    }
    console.log("[");
    for(let i:number = 0; i < list.length; i++){
        console.log("  [" + i + "]:");
        print_list(list[i]);
    }
    console.log("]");
}
print_list(ml_list_constructor("head", ["tail", "tail2"]));
console.log(contains("Pararrayos", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
console.log(contains("Alvarez", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
//we already print something wrong at this point and maybe we corrupted the heap
//or god knows what
print_list(replace("Bicho", ":)", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replaceAll("Bicho", ":D", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replace("nan", "FAIL", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replaceAll("nan", "FAIL", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list_of_lists(replaceInListOfLists("Bicho", ":O", [["Pasta", "Ganar", "Bicho", "Bicho", "Mercado", "Rayos", "Agua", "Bicho"],
                                                         ["Mono","Bicho","Alpaca","Buey","Ratón","Yak","Chinchilla","Bicho"],
                                                         ["Bicho", "Erizo", "Mariposa", "Pez" , "betta", "Hurón", "Bicho", "Serpiente", "Ciervo"],
                                                         ["Calamar", "Cisne", "Bicho", "Tigre", "Perico", "Bicho", "Poni", "Canario"]]));
// [
//   [0]:head,
//   [1]:tail,
//   [2]:tail2
// ]
// true
// false
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]::),
//   [5]:Bicho,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]:Bicho
// ]
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]::D,
//   [5]::D,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]::D
// ]
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]:Bicho,
//   [5]:Bicho,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]:Bicho
// ]
// [
//   [0]:Pasta,
//   [1]:Ceremonia,
//   [2]:Ganancias,
//   [3]:Disciplina,
//   [4]:Bicho,
//   [5]:Bicho,
//   [6]:Mercado,
//   [7]:Pararrayos,
//   [8]:Agua,
//   [9]:Bicho
// ]
// [
//   [0]:[
//     [0]:Pasta,
//     [1]:Ganar,
//     [2]::O,
//     [3]::O,
//     [4]:Mercado,
//     [5]:Rayos,
//     [6]:Agua,
//     [7]::O
//   ],
//   [1]:[
//     [0]:Mono,
//     [1]::O,
//     [2]:Alpaca,
//     [3]:Buey,
//     [4]:Ratón,
//     [5]:Yak,
//     [6]:Chinchilla,
//     [7]::O
//   ],
//   [2]:[
//     [0]::O,
//     [1]:Erizo,
//     [2]:Mariposa,
//     [3]:Pez,
//     [4]:betta,
//     [5]:Hurón,
//     [6]::O,
//     [7]:Serpiente,
//     [8]:Ciervo
//   ],
//   [3]:[
//     [0]:Calamar,
//     [1]:Cisne,
//     [2]::O,
//     [3]:Tigre,
//     [4]:Perico,
//     [5]::O,
//     [6]:Poni,
//     [7]:Canario
//   ]
// ]
    `;
    }

    //OLD BUG: we coulnt call functions from another function where both funcs had
    //         diplay.size = 0
    {
    let testString = `
function aux(a:number):void{
    console.log(a);
}
function log(a:number):void{
    aux(a);
}
log(30);
    `;
    }

    //OLD BUG: it would just print 2
    //         Honestly I dont even remember what was the problem, we didnt recover the backedUp
    //         regs I think?
    //         Then it happened because we didnt calculate again the value of nextStackFrameBegin
    {
    let testString = `
function factorial(a:number):number{
    if(a < 2){
        return 1;
    }
    return a * factorial(a-1);
}
console.log(factorial(10));//3628800 
`;
  }

          let testString = `
function tail(strs:string[]):string[]{
    let result:string[] = new Array(strs.length - 1);
    for(let i:number = 1; i < strs.length; i++){
        result[i - 1] = strs[i];
    }
    return result;
}
function head(strs:string[]):string{
    return strs[0];
}
function ml_list_constructor(head:string, tail:string[]):string[]{
    let result:string[] = new Array(tail.length + 1);
    result[0] = head;
    for(let i:number = 0; i < tail.length; i++){
        result[i+1] = tail[i];
    }
    return result;
}
function contains(str:string, strs:Array<string>):boolean{
    function imp(strs:Array<string>):boolean{
        if(strs.length == 0){
            return false;
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == str){
                return true;
            }
            else{
                return imp(tail_strs);
            }
        }
    }
    return imp(strs);
}
function replace(target:string, replacement:string, strs:Array<string>):string[]{
    function imp(strs:Array<string>):string[]{
        if(strs.length == 0){
            return [];
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == target){
                return ml_list_constructor(replacement, tail_strs);
            }
            else{
                return ml_list_constructor(head_strs, imp(tail_strs));
            }
        }
    }
    return imp(strs);
}
function replaceAll(target:string, replacement:string, strs:Array<string>):string[]{
    function imp(strs:Array<string>):string[]{
        if(strs.length == 0){
            return [];
        }
        else{
            let head_strs:string = head(strs);
            let tail_strs:string[] = tail(strs);
            if(head_strs == target){
                return ml_list_constructor(replacement, imp(tail_strs));
            }
            else{
                return ml_list_constructor(head_strs, imp(tail_strs));
            }
        }
    }
    return imp(strs);
}
function replaceInListOfLists(target:string, replacement:string, lists_of_strs:string[][]):string[][]{
    function helper_head(list_of_lists:string[][]):string[]{
        return list_of_lists[0];
    }
    function helper_tail(list_of_lists:string[][]):string[][]{
        let result:string[][] = new Array(list_of_lists.length - 1);
        for(let i:number = 1; i < list_of_lists.length; i++){
            result[i-1] = list_of_lists[i];
        }
        return result;
    }
    function helper_ml_list_constructor(head:string[], tail:string[][]):string[][]{
        let result:string[][] = new Array(tail.length + 1);
        result[0] = head;
        for(let i:number = 0; i < tail.length; i++){
            result[i+1] = tail[i];
        }
        return result;
    }
    function imp(lists_of_strs:string[][]):string[][]{
        function helperReplaceAll(strs:string[]):string[]{
            function imp(strs:Array<string>):string[]{
                if(strs.length == 0){
                    return [];
                }
                else{
                    let head_strs:string = head(strs);
                    let tail_strs:string[] = tail(strs);
                    if(head_strs == target){
                        return ml_list_constructor(replacement, imp(tail_strs));
                    }
                    else{
                        return ml_list_constructor(head_strs, imp(tail_strs));
                    }
                }
            }
            return imp(strs);
        }
        if(lists_of_strs.length == 0){
            return [];
        }
        else{
            let head_list_of_strings:string[] = helper_head(lists_of_strs);
            let tail_list_of_strings:string[][] = helper_tail(lists_of_strs);
            return helper_ml_list_constructor(helperReplaceAll(head_list_of_strings), imp(tail_list_of_strings));
        }
    }
    return imp(lists_of_strs);
}
//No la vamos a hacer estilo funcional por ahora porque que hueva
function print_list(list:string[]):void{
    console.log("[");
    for(let i:number = 0; i < list.length; i++){
        console.log("  [" + i + "]:" + list[i]);
    }
    console.log("]");
}
//No la vamos a hacer estilo funcional por ahora porque que hueva
function print_list_of_lists(list:string[][]):void{
    function print_list(list:string[]):void{
        console.log("  [");
        for(let i:number = 0; i < list.length; i++){
            console.log("    [" + i + "]:" + list[i]);
        }
        console.log("  ]");
    }
    console.log("[");
    for(let i:number = 0; i < list.length; i++){
        console.log("  [" + i + "]:");
        print_list(list[i]);
    }
    console.log("]");
}
print_list(ml_list_constructor("head", ["tail", "tail2"]));
console.log(contains("Pararrayos", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
console.log(contains("Alvarez", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replace("Bicho", ":)", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replaceAll("Bicho", ":D", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replace("nan", "FAIL", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list(replaceAll("nan", "FAIL", ["Pasta", "Ceremonia", "Ganancias", "Disciplina", "Bicho", "Bicho", "Mercado", "Pararrayos", "Agua", "Bicho"]));
print_list_of_lists(replaceInListOfLists("Bicho", ":O", [["Pasta", "Ganar", "Bicho", "Bicho", "Mercado", "Rayos", "Agua", "Bicho"],
                                                         ["Mono","Bicho","Alpaca","Buey","Ratón","Yak","Chinchilla","Bicho"],
                                                         ["Bicho", "Erizo", "Mariposa", "Pez" , "betta", "Hurón", "Bicho", "Serpiente", "Ciervo"],
                                                         ["Calamar", "Cisne", "Bicho", "Tigre", "Perico", "Bicho", "Poni", "Canario"]]));
// [
//   [0]:head
//   [1]:tail
//   [2]:tail2
// ]
// true
// false
// [
//   [0]:Pasta
//   [1]:Ceremonia
//   [2]:Ganancias
//   [3]:Disciplina
//   [4]::)
//   [5]:Bicho
//   [6]:Mercado
//   [7]:Pararrayos
//   [8]:Agua
//   [9]:Bicho
// ]
// [
//   [0]:Pasta
//   [1]:Ceremonia
//   [2]:Ganancias
//   [3]:Disciplina
//   [4]::D
//   [5]::D
//   [6]:Mercado
//   [7]:Pararrayos
//   [8]:Agua
//   [9]::D
// ]
// [
//   [0]:Pasta
//   [1]:Ceremonia
//   [2]:Ganancias
//   [3]:Disciplina
//   [4]:Bicho
//   [5]:Bicho
//   [6]:Mercado
//   [7]:Pararrayos
//   [8]:Agua
//   [9]:Bicho
// ]
// [
//   [0]:Pasta
//   [1]:Ceremonia
//   [2]:Ganancias
//   [3]:Disciplina
//   [4]:Bicho
//   [5]:Bicho
//   [6]:Mercado
//   [7]:Pararrayos
//   [8]:Agua
//   [9]:Bicho
// ]
// [
//   [0]:
//   [
//     [0]:Pasta
//     [1]:Ganar
//     [2]::O
//     [3]::O
//     [4]:Mercado
//     [5]:Rayos
//     [6]:Agua
//     [7]::O
//   ]
//   [1]:
//   [
//     [0]:Mono
//     [1]::O
//     [2]:Alpaca
//     [3]:Buey
//     [4]:Rat≤n
//     [5]:Yak
//     [6]:Chinchilla
//     [7]::O
//   ]
//   [2]:
//   [
//     [0]::O
//     [1]:Erizo
//     [2]:Mariposa
//     [3]:Pez
//     [4]:betta
//     [5]:Hur≤n
//     [6]::O
//     [7]:Serpiente
//     [8]:Ciervo
//   ]
//   [3]:
//   [
//     [0]:Calamar
//     [1]:Cisne
//     [2]::O
//     [3]:Tigre
//     [4]:Perico
//     [5]::O
//     [6]:Poni
//     [7]:Canario
//   ]
// ]
    `;

    //BUG: El c_ir generado tira error pero igual pareciera compilar y funcionar bien. :/
    //     es por el orden en que definimos y llamamos a lol1
    {
    let testString = `
function lol():void{
    lol1();
}
function lol1():void{
    console.log("lol");
}
lol();
`;
    }

    {
        let testString = `
type A = {
    nombre:string,
    apellido:string,
}
let a:A = { apellido:"Alvarez", nombre:"Javier" };//This should work perfectly fine
console.log(a.nombre + " " + a.apellido);
        `;
    }

    {
    let testString = `
type A = {
    a:string,
    b:number,
    c:B
} 
type B = {
    a:boolean
}
    `;
    }

    {
        let testString = `
    type A = {
        a: string;
        b: B;
    }
    type B = {
        a: A;
        b: number;
    }
    
    let a:A = {
        a:"a1", 
        b : { 
            a: {
                a:"a1", 
                b : { 
                    a: {
                        a:"a2", 
                        b: null
                    },
                    b: 30
                }
            },
            b: 20
        }
    };
    //TODO: hacer un logA and logB
    logA(a);`
        ;
        }

        {
    let testString = `
type A = {
    a: number,
    b: string,
}
let a:A = { a: 10, b: "s" };
console.log("a:" + a.a);//a:10
console.log("b:" + a.b);//b:s
console.log("c:" + a.c);//deberia ser error
a.a = 20;
a.b = 20;//should be a type error
a.b = "Javier";
console.log("a:" + a.a);//a:20
console.log("b:" + a.b);//b:Javier
a = null;
//console.log("a:" + a.a);//undefined behavior 
//console.log("b:" + a.b);//undefined behavior 
    `;
        }

        {
    let testString = `
//ERRORS:
//10 ? "FAIL" : "FAIL";//condicion de ternary no es tipo boolean
//true ? "FAIL" : 10;//tipos diferentes en expression ternaria
//let b:string = true ? 10 : 20;//string no compatible con number
let flag:boolean = true;
console.log(flag ? "PASS" : "FAIL");//PASS
flag = false;
console.log(flag ? "FAIL" : "PASS");//PASS
    `;
        }

    {
    let testString = `
let n:number = 0;
do{
  console.log("PASS");
  if(n > 0){
    console.log("FAIL");
  }
  n++;
}while(false);
    `
    }

    {
        let testString = `
function aux():boolean{
    console.log("PASS");
    return false;
}
do{
    continue;
    console.log("FAIL");
}while(aux());
        `;
    }

    {
    let testString = `
let a:number = 20;
switch(a){
  case 10:
    console.log("ten");
  break;
  case 20:
    console.log("twenty");
  break;
  case 30:
    console.log("thirty");
  break;
  case 40:
    console.log("forty");
  break;
  case 50:
    console.log("fifty");
  break;
  default:
    console.log("none");
}
    `;
    }

    //test de examen final:
        {
        let testString = `
function function1(a:number, b:number, c:number):number{
	let arr:number[][][] = new Array(a);
    for(let i:number = 0; i < arr.length; i++){
    	arr[i] = new Array(b);
        for(let e:number = 0; e < arr[i].length; e++){
            arr[i][e] = new Array(c);
        }
    }
    arr[3][6][9] = 77;
    return arr[3][6][9];
}
console.log(function1(4,7,10));
        `;
        }

        {
    let testString = `
console.log("**********forof array**********");
for (const iterator:number of [1,2,3,4,5]) {
    console.log(iterator);
}
// console.log("**********forin array**********");
// for (const iterator:number in [1,2,3,4,5]) {
//     console.log(iterator);
// }
//The name of each attribute is lost at compile time so 'forin'
//doesnt work for arrays
console.log("**********forin object**********");
for (const iterator:number in [1,2,3,4,5]) {//should be an error
    console.log(iterator);
}
    `;
        }

    //Archivos de Entrada/Basicas/Basicos.ts
    //PASS: 
    //pero:
    //No imprime Aritmeticas 100 porque 36 ** 0.5 no se puede
    //No imprime Logica 2 porque no podemos hacer && entre boolean y number
        {
    let testString = `
    let val1:number = 0;
    let val2:number = 0;
    let val3:number = 0;
    let a:number = 0;
    let b:number = 0;
    val1 = 7 - (5 + 10 * (20 / 5 - 2 + 4 * (5 + 2 * 3)) - 8 * 3 ** 2) + 50 * (6 * 2); //214
    val2 = 2 ** 4 - 9 * (8 - 6 * (3 ** 2 - 6 * 5 - 7 * (9 + 7 ** 3) + 10) - 5 ) + 8 * (36 / 6 - 5 * ( 2 * 3)); //-133853
    val3 = (8 ** 3 * 36 ** 0.5 - 2 ** 5 + 2 ** 3 + 16 ** 0.5 + 2) / 3; //-1018 
    let val4:number = val1+val2+val3+val4; //Error, comentar despues de reportar
    //let val4 = val1 - val2 + val3; //El resultado es 135085
    if(val1 - val2 + val3 == 135085){
        console.log('Aritmeticas 100');
    }
    let String_3: string;
    let String_4: string;
    let int2_:number;
    let TRUE :boolean = true;
    let FALSE :boolean = false;
    int2_ = 45;
    int2_ --; 
    String_3 = (int2_ > 77 || FALSE) + "," + (int2_ < 78 && TRUE) + "," + (int2_ + 10 <= int2_ || FALSE) + "," + (!!!!!!!!!!!! (int2_ + 10 >= int2_));
    String_4 = (int2_ >= 77 || -1 < 100) + "," + (int2_ > 78 && 100 + 0);
    console.log("Lógica 1" + " = " + String_3); //false,true,false,true
    console.log("Lógica 2" + " = " + String_4); //true,false
    let relacionaes : boolean = (a == 0) != (44.3 < 44.4) == (2**5 == 31 + 2 % 1);
    relacionaes = relacionaes == (b == a) != ((532 > 532)) == (String_3 == "false,true,false,true") == (String_4 == "true,false");
    if(relacionaes){
        console.log("Relacionels 100");
    }
    else{
        console.log("Relacionales 0");
    }
    /***********************/
    const dimension:number = 3;
    //Error porque una constante debe estar asginada
    //Si no reporta el error -0.5 en declaracion de variables
    const dim2:number;
    let arreglo : string[] = ["Estudiante1", "Estudiante2", "Estudiante3"];
    //Posicion 0 - 2 para estudiante 1
    //Posicion 3 - 5 para estudiante 2
    //Posicion 6 - 8 para estudiante 3
    let tablero : number[] = [0,0,0,0,0,0,0,0,0];
    let estado : boolean[] = [false, false, false, false, false, false, false, false, false];
    function agregar(i : number, j : number, nota : number) : boolean{
        if(!estado[i * dimension + j]){
            tablero[i * dimension + j] = nota;
            estado[i*dimension + j] = true;
            return true;
        }
        console.log("Posicion ocupada");
        return false;
    }
    function imprimirPromedio(estudiante : number):void{
        let promedio:number = (tablero[estudiante * dimension + 0] + tablero[estudiante * dimension + 1] + tablero[estudiante * dimension + 2])/3;
        console.log("Promedio Estudiante " + arreglo[estudiante] +  " = " + promedio);
    }
    //Error porque es una constante
    //Si no reporta el error -0.5 en asignacion de variables
    dimension = 30;
    //Notas estudiante 1
    agregar(0,0, 90);
    agregar(0,1, 95);
    agregar(0,2, 92);
    //Notas estudiante 2
    agregar(1,0, 85);
    agregar(1,1, 90);
    agregar(1,2, 100);
    //Notas estudiante 3
    agregar(2,0, 20);
    agregar(2,1, 100);
    agregar(2,2, 100);
    //Imprimir Promedios
    imprimirPromedio(0); //92.33 -> + 0.5
    imprimirPromedio(1); //91.66 -> + 0.5
    imprimirPromedio(2); //70 -> + 0.5
    //Debe imprimir posicion ocupada -> + 0.5
    agregar(2,0, -1);
/*
Aritmeticas 100
Lógica 1 = false,true,false,true
Lógica 2 = true,false
Relacionels 100
Promedio Estudiante  Estudiante1  =  92.33333333333333
Promedio Estudiante  Estudiante2  =  91.66666666666667
Promedio Estudiante  Estudiante3  =  73.33333333333333
Posicion ocupada
*/
    `;
        }

        //Archivos de Entrada/Intermedio/intermedio.ts
        //PASS
        {
    let testString = `
    let array:number[] = [32, 21, 7, 89, 56, 909, 109, 2];
    let indice:string = "indice " + array[0];
    console.log("***********************************************************************");
    console.log("***********                TERNARIO                    ****************");
    console.log("***********************************************************************");
    console.log(indice == "indice 32" ? 'TERNARIO BIEN' : 'TERNARIO MALO');
    console.log('\\n');
    console.log("***********************************************************************");
    console.log("***********                 IF                         ****************");
    console.log("***********************************************************************");
    if (array[4] > 50) {
        console.log("IF CORRECTO");
    } else if (array[4] == 56) {
        console.log("IF INCORRECTO");
    } else {
        console.log("IF INCORRECTO");
    }
    
    console.log('\\n');
    console.log("***********************************************************************");
    console.log("***********                 SWITCH                     ****************");
    console.log("***********************************************************************");
    switch (array[array.length - 1] + "") {
        case "1":
            console.log("SWITCH MALO");
        case "2":
            console.log("SWITCH BIEN");
        case "3":
            console.log("SWITCH BIEN");
        default:
            console.log("SWITCH BIEN");
    }
    
    
    console.log('\\n');
    console.log("***********************************************************************");
    console.log("***********                 WHILE                      ****************");
    console.log("***********************************************************************");
    let index:number = 0;
    while (index >= 0) {
        if (index == 0) {
            index = index + 100;
        } else if (index > 50) {
            index = index / 2 - 25;
        } else {
            index = (index / 2) - 1;
        }
    
        console.log(index);
    }
    
    console.log('\\n');
    console.log("***********************************************************************");
    console.log("***********                 doWHILE                    ****************");
    console.log("***********************************************************************");
    index = -1;
    do {
        index = index + 1;
        if (index == 0 || index == 1 || index == 11 || index == 12) {
            console.log('*********************************************************************************************************');
        } else if (index == 2) {
            console.log('**********  ***************  ******                 ******                 ******              **********');
        } else if (index >= 3 && index <= 5) {
            console.log('**********  ***************  ******  *********************  *************  ******  **********************');
        } else if (index == 6) {
            console.log('**********  ***************  ******                 ******                 ******  **********************');
        } else if (index >= 7 && index <= 9) {
            console.log('**********  ***************  ********************   ******  *************  ******  **********************');
        } else if (index == 10) {
            console.log('**********                   ******                 ******  *************  ******              **********');
        }
    } while (index != 12);
    
    console.log('\\n');
    
    
    console.log('\\n');
    console.log("***********************************************************************");
    console.log("***********                 FOR LOOP                   ****************");
    console.log("***********************************************************************");
    for (let i:number = 0; i < 10; i++) {
        let output:string = '';
        for (let j:number = 0; j < 10 - i; j++) {
            output = output + ' ';
        }
        for (let k:number = 0; k <= i; k++) {
            output = output + '* ';
        }
        console.log(output);
    }
    
    console.log('\\n');
    console.log("***********************************************************************");
    console.log("***********                 FOR OF                     ****************");
    console.log("***********************************************************************");
    let arr:number[] = [1,2,3,4,5,6];
    for(let i:number in [1,2,3,4,5,6]){
        console.log((arr[i] == 1) + ", " + (arr[i] == 2) + ", " + (arr[i] == 3) + ", " + (arr[i] == 4) + ", " + (arr[i] == 5) + ", " + (arr[i] == 6));
    }
    
    
    console.log('\\n');
    console.log("***********************************************************************");
    console.log("***********                 FOR IN                     ****************");
    console.log("***********************************************************************");
    for(let e:number of [1,2,3,4,5,6]){
        if(arr.length > e){
            console.log((e*arr[e]) + ", " + (e*arr[e]) + ", " + (e*arr[e]) + ", " + (e*arr[e]) + ", " + (e*arr[e]) + ", " + (e*arr[e]));
        }
    }
    
    /**
    "***********************************************************************"
    "***********                TERNARIO                    ****************"
    "***********************************************************************"
    "TERNARIO BIEN"
    "***********************************************************************"
    "***********                 IF                         ****************"
    "***********************************************************************"
    "IF CORRECTO"
    "***********************************************************************"
    "***********                 SWITCH                     ****************"
    "***********************************************************************"
    "SWITCH BIEN"
    "SWITCH BIEN"
    "SWITCH BIEN"
    "***********************************************************************"
    "***********                 WHILE                      ****************"
    "***********************************************************************"
    100
    25
    11.5
    4.75
    1.375
    -0.3125
    "***********************************************************************"
    "***********                 doWHILE                    ****************"
    "***********************************************************************"
    "*********************************************************************************************************"
    "*********************************************************************************************************"
    "**********  ***************  ******                 ******                 ******              **********"
    "**********  ***************  ******  *********************  *************  ******  **********************"
    "**********  ***************  ******  *********************  *************  ******  **********************"
    "**********  ***************  ******  *********************  *************  ******  **********************"
    "**********  ***************  ******                 ******                 ******  **********************"
    "**********  ***************  ********************   ******  *************  ******  **********************"
    "**********  ***************  ********************   ******  *************  ******  **********************"
    "**********  ***************  ********************   ******  *************  ******  **********************"
    "**********                   ******                 ******  *************  ******              **********"
    "*********************************************************************************************************"
    "*********************************************************************************************************"
    "***********************************************************************"
    "***********                 FOR LOOP                   ****************"
    "***********************************************************************"
    "          * "
    "         * * "
    "        * * * "
    "       * * * * "
    "      * * * * * "
    "     * * * * * * "
    "    * * * * * * * "
    "   * * * * * * * * "
    "  * * * * * * * * * "
    " * * * * * * * * * * "
    "***********************************************************************"
    "***********                 FOR OF                     ****************"
    "***********************************************************************"
    DIAGONAL DE TRUE
    true false false false false false
    false true false false false false
    false false true false false false
    false false false true false false
    false false false false true false
    false false false false false true
    "***********************************************************************"
    "***********                 FOR IN                     ****************"
    "***********************************************************************"
    2 2 2 2 2 2
    6 6 6 6 6 6
    12 12 12 12 12 12
    20 20 20 20 20 20
    30 30 30 30 30 30
     */
    `;
        }

        //Archivos de Entrada/Intermedias.ts
        //PASS:
        {
                let testString = `
    let x:number = 1;
    let y:number = 1;
    console.log("---------------------------------");
    console.log("Tablas de multiplicar con While");
    console.log("---------------------------------");
    while (x <= 10) {
        while (y <= 10) {
            console.log(x + "x" + y + "=" + x * y);
            y++;
        }
        console.log("-----------------------------");
        x++;
        y = 1;
    }
    
    // ------------------------------------------------------------------------
    console.log("---------------------------------");
    console.log("  Tablas de multiplicar con For");
    console.log("---------------------------------");
    
    for (let i:number = 1; i <= 10; i++) {
        for (let j:number = 1; j <= 10; j++) {
            console.log(i + "x" + j + "=" + i * j);
        }
        console.log("--------------------------");
    }
    
    /**** Factorial Iterativo ****/
    const iteraciones:number = 10;
    let temporal:number = 0;
    
    //Error, una constante no puede cambiar su valor
    iteraciones = 10000; 
    
    do{
        let numero:number = temporal;
        if(numero <= 0){
            console.log("Factorial de " + temporal + " = " + 0);
            temporal++;
            continue;
        }
        let factorial:number = 1;
        while(numero > 1){
            factorial = factorial * numero;
            numero--;
        }
        console.log("Factorial de " + temporal + " = " + factorial);
        temporal++;
    }while(temporal <= iteraciones);
    
    const dias:string[] = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
    
    for(let i:string of dias){
        switch(i){
            case "Lunes":
                console.log(1);
            case "Martes":
                console.log(2);
            case "Miercoles":
                console.log(3);
            case "Jueves":
                console.log(4);
            case "Viernes":
                console.log(5);
                console.log("Weekday");
                break;
            default:
                console.log("Weekend");       
        }
    }
    /************ STACK *****************/
    let stack : number[] = [0];
    const MAXSIZE:number = 50;
    const MINZIE:number = 0;
    
    function apilar(num : number) : void{
        if(stack.length == MAXSIZE){
            console.log("Pila llena");
        }
        else{
            let oldStack:number[] = stack;
            stack = new Array(oldStack.length + 1);
            for(let i:number = 0; i < oldStack.length; i++){
                stack[i] = oldStack[i];
            }
            stack[oldStack.length] = num;
        }
    }
    
    function desapilar() : void{
        if(stack.length == MINZIE){
            console.log("Pila vacia");
            return;
        }
        else{
            let oldStack:number[] = stack;
            stack = new Array(oldStack.length - 1);
            for (let i:number = 0; i < oldStack.length - 1; i++) {
                stack[i] = oldStack[i];
            }
            //return oldStack[oldStack.length - 1];
        }
    }
    
    function estadoPila() : boolean{
        return stack.length == MAXSIZE;
    }
    
    function vaciar() : void{
        stack = [];
    }
    
    for(let i:number = 1; i < 20 && !estadoPila(); i++){
        apilar(i);
    }
    console.log(stack.length); //20
    print_array(stack);
    
    for(let i:number = 0; i < 10; i++){
        desapilar();
    }
    console.log(stack.length); //10
    print_array(stack);
    
    for(let i:number = 10; i < 55; i++){
        apilar(i);
    }
    
    console.log(stack.length); //50
    print_array(stack);
    let temp:string = '';
    for(let i:number of stack){
        temp = temp + '|' + i + '|' + stack[i] + '|\\n';
    }
    console.log("Pos | Val \\n" + temp);
    
    vaciar();
    desapilar();
    function print_array(array:number[]):void{
        console.log("[");
        for(let i:number = 0; i < array.length; i++){
            console.log("  [" + i + "]:" + array[i]);
        }
        console.log("]");
    }
    `;
        }

        {
        let testString = `
function num_array_push(array_obj:Array_Obj, num:number):void{
    let oldArray:number[] = array_obj.array;
    array_obj.array = new Array(oldArray.length + 1);
    for (let i:number = 0; i < oldArray.length; i++) {
        array_obj.array[i] = oldArray[i];
    }
    array_obj.array[oldArray.length] = num;
}
//just because what we should really pass to array funcs is a pointer
//and this is the only way we can achive that
type Array_Obj = {
    array:number[],
}
function num_array_pop(array_obj:Array_Obj):number{
    let oldArray:number[] = array_obj.array;
    array_obj.array = new Array(oldArray.length - 1);
    for (let i:number = 0; i < oldArray.length - 1; i++) {
        array_obj.array[i] = oldArray[i];
    }
    return oldArray[oldArray.length - 1];
}
        `
        }

        //ArchivosPrueba Proyecto2/ExpressionesYString.ts
        //PASS
        {
    let testString = `
    function aritmeticas():void{
        const n1:number = 5**3;
        const n2:number = (n1+4**3)**3;
        
        if(n2 != 6751269){
            console.log('potencia mal :(');
            console.log('valor esperado: 6751269, se obtuvo: ' + n2);
        }
        else{
            let bien:string = "Potencia bien ;)";
            console.log(bien);
        }
    
        //+ - / *
        let n3:number = ((-(1+1+1+1+1-5-10)+(4*3-n1))+8200*3/10)*3;
        console.log(n3);
    
        if(n3 == -(-7071)){
            console.log('vas bien!!',"\\n suma,\\n resta,\\n negacion \\n multiplicacion bien");
        }
        else if(n3 != 7071){
            console.log('Como que algo falla');
        }
    
        let n4:number = n3/8/10;
        console.log(n4);
    
        if(n4 == 88.3875){
            console.log('Division bien');
        }
    }
    
    function relacionales():void{
    
        const n1:number = 8200;
        const n3:number = ((-(1+1+1+1+1-5-10)+(4*3-n1))+8200*3/10)*3;
        console.log(n3);
    
        let p1:boolean = (n3+15553) < -1600;
        if(p1){
            console.log('Menor que BIEN!!');
        }
        else{
            console.log('Menor que mal');
        }
    
        if(832 >= 987){
            console.log('Mayor igual MAL!!');
        }
        else{
            console.log('Mayor igual BIEN!!');
            if(6 <= 6){
                console.log('Menor igual BIEN!!');
            }
            else{
                console.log('Menor igual mal');
            }
        }
    
        const menor:boolean = 5.66 < 5.67;
    
        if(menor == true){
            console.log('Menor que BIEN!!');
            console.log('igualacion booleanos BIEN!!');
        }
    }
    
    function logicas(): void{
        const b1:boolean = true && (true || false && true);
        console.log(b1);
    
        if(!!b1){
            console.log('primer AND y OR bien!!');
            console.log("Negacion logica bien!!");
        }
        else{
            console.log('primer AND y OR mal');
            console.log("Negacion logica mal");
        }
    
        if((86 >= 8) && ((6 == 7) || (6 != 7))){
            console.log('segundo AND y OR BIEN!!');
        }
        else{
            console.log('segundo AND y OR mal');
        }
    }
    
    function StringFunction():void{
        const n1:number = 5**3;
        const n2:number = (n1+4**3)**3;
        let n3:number = ((-(1+1+1+1+1-5-10)+(4*3-n1))+8200*3/10)*3;
        let n4:number = n3/8/10;
        console.log(n2,n4);
    
        const str1:string = 'ComPi 2';
    
        console.log('FUNCIONES STRING:');
        console.log('Concatenacion:');
        console.log(str1.concat(' C3D - segundo Proyecto'));
        console.log('ToUpperCase:');
        console.log(str1.toUpperCase());
        console.log('ToLowerCase:');
        console.log((str1 + ' SI SALE').toLowerCase());
        console.log('length:');
        console.log(str1.length);
    
        console.log('Concatenacion + :');
        console.log('string + string');
        console.log(str1 + ' C3D - segundo Proyecto');
        console.log('string + numero entero');
        console.log('entero = ' + n2);
        console.log('string + numero decimal');
        console.log('decimal = ' + n4);
    }
    
    function main():void{
        console.log('=====ARITMETICAS====');
        aritmeticas();
        console.log('=====RELACIONALES====');
        relacionales();
        console.log('=====LOGICAS====');
        logicas();
        console.log('=====STRING====');
        StringFunction();
    }
    
    main();
    
    /*
    =====ARITMETICAS====
    Potencia bien ;)
    7071
    vas bien!!,
     suma,
     resta,
     negacion
     multiplicacion bien
    88.3875
    Division bien
    =====RELACIONALES====
    -17154
    Menor que BIEN!!
    Mayor igual BIEN!!
    Menor igual BIEN!!
    Menor que BIEN!!
    igualacion booleanos BIEN!!
    =====LOGICAS====
    true
    primer AND y OR bien!!
    Negacion logica bien!!
    segundo AND y OR BIEN!!
    =====STRING====
    6751269,88.387500
    FUNCIONES STRING:
    Concatenacion:
    ComPi 2 C3D - segundo Proyecto
    ToUpperCase:
    COMPI 2
    ToLowerCase:
    compi 2 si sale
    length:
    7
    Concatenacion + :
    string + string
    ComPi 2 C3D - segundo Proyecto
    string + numero entero
    entero = 6751269
    string + numero decimal
    decimal = 88.3875
    */
    `;
        }

        //Archivos de Entrada/Intermedias2.ts
        //PASS
        {
        let testString = `
        //se quito el const porque nuestro push ahora requiere que cambiemos 
        //la varialbes del arrelgo (ejemplo: array = new Array())
        let tablero:number[][] = [];
        let jugadasI:number[] = [0, 0, 0, 2, 1, 2, 1, 1, 2];
        let jugadasJ:number[] = [0, 1, 2, 0, 0, 1, 1, 2, 2];
        let contador:number = 0;
        const size:number = 3;
        const jugador1:string = "Erik";
        const jugador2:string = "Gerardo";
        let turnoActual:number = 0;
        
        function llenarTablero() : void{
            tablero = new Array(size);
            for(let i:number = 0; i < size; i++){
                tablero[i] = new Array(size);
                for(let j:number = 0; j < size; j++){
                    tablero[i][j] = -1;
                }
            }
        }
        
        function limpiarTablero() : void{
            tablero = [];
        }
        
        function imprimirTablero() : void{
            let temp:string = '';
            for(let i:number = 0; i < tablero.length; i++){
                for(let j:number = 0; j < tablero[i].length; j++){
                    temp = temp + '|' + (tablero[i][j] == 0 ? "0" : tablero[i][j] == 1 ? "X" : "-"); 
                }
                temp = temp + '\\n';
            }
            console.log(temp);
        }
        
        function ocupado(i : number, j : number) : boolean{
            return tablero[i][j] == -1 ? false : true;
        }
        
        function imprimirGanador(ganador : number):void{
            console.log(ganador == 1 ? jugador1 : jugador2);
        }
        
        function ganador(simbolo : number) : boolean{
            if( tablero[0][0] == tablero [1][1] && tablero[1][1] == tablero[2][2] && tablero[2][2] == simbolo){
                return true;
            }
            else if( tablero[0][2] == tablero [1][1] && tablero[1][1] == tablero[2][0] && tablero[2][0] == simbolo){
                return true;
            }
        
            for(let i:number in [0,1,2]){
                if( tablero[i][0] == tablero [i][1] && tablero[i][1] == tablero[i][2] && tablero[i][2] == simbolo){
                    return true;
                }
                else if( tablero[0][1] == tablero [1][i] && tablero[1][i] == tablero[2][i] && tablero[2][i] == simbolo){
                    return true;
                }
                else{
                    return false;
                }
            }
            console.log("Si llega aqui es error");
            return false;
        }
        
        function agregarJugada(i : number, j : number):void{
            if(!ocupado(i,j)){
                tablero[i][j] = turnoActual;
            }
        }
        
        function juego() : void{
            limpiarTablero();
            llenarTablero();
            imprimirTablero();
            while(true){
                turnoActual = turnoActual == 0 ? 1 : 0;
                switch(turnoActual){
                    case 0:
                        console.log("Turno del jugador: " + jugador1);
                        agregarJugada(jugadasI[contador], jugadasJ[contador]);
                        break;
                    case 1:
                        console.log("Turno del jugador: " + jugador2);
                        agregarJugada(jugadasI[contador], jugadasJ[contador]);
                        break;
                    default:
                        console.log('Error si llega aqui');
                }
                imprimirTablero();
                contador++;
                if(ganador(turnoActual)){
                    console.log("Ganó: " + (turnoActual == 0 ? jugador1 : jugador2));
                    break;
                }
                else if(contador >= 9){
                    console.log("Empates");
                    break;
                }
            }
        }
        juego();
        `;
        }

        //Archivos de Entrada/Nativas/Nativas.ts
        //PASS
        {
    let testString = `
    /************ STACK *****************/
    let stack : number[] = [0];
    const MAXSIZE:number = 50;
    const MINZIE:number = 0;
    
    function apilar(num : number) : void{
        if(stack.length == MAXSIZE){
            console.log("Pila llena");
        }
        else{
            let oldStack:number[] = stack;
            stack = new Array(oldStack.length + 1);
            for(let i:number = 0; i < oldStack.length; i++){
                stack[i] = oldStack[i];
            }
            stack[oldStack.length] = num;
        }
    }
    
    function desapilar() : void{
        if(stack.length == MINZIE){
            console.log("Pila vacia");
            return;
        }
        else{
            let oldStack:number[] = stack;
            stack = new Array(oldStack.length - 1);
            for (let i:number = 0; i < oldStack.length - 1; i++) {
                stack[i] = oldStack[i];
            }
            //return oldStack[oldStack.length - 1];
        }
    }
    
    function estadoPila() : boolean{
        return stack.length == MAXSIZE;
    }
    
    function vaciar() : void{
        stack = [];
    }
    for(let i:number = 1; i < 20 && !estadoPila(); i++){
        apilar(i);
    }
    console.log(stack.length); //20
    print_array(stack);
    for(let i:number = 0; i < 10; i++){
        desapilar();
    }
    console.log(stack.length); //10
    print_array(stack);
    for(let i:number  = 10; i < 55; i++){
        apilar(i);
    }
    console.log(stack.length); //50
    print_array(stack);
    let temp:string = '';
    for(let i:number of stack){
        temp = temp + '|' + i + '|' + stack[i] + '|\\n';
    }
    console.log("Pos | Val \\n" + temp);
    vaciar();
    desapilar();
    /***************** GRAFICAR TS*******************/
    let x : number = 10;
    let y : string = "Hola compi2";
    let z : boolean = true;
    let arreglo : number[] = [1,2,3,4,5];
    let arreglo2 : boolean[] = [true, false];
    type t = {
        nombre : string,
        edad : number
    }
    type x = {
        personaje : string,
        booleano : boolean
    }
    function funcion1() : void{
        graficar_ts(); //Grafica global
    }
    function funcion2(param1 : number, param2 : string, param3 : boolean):void{
        graficar_ts(); //Grafica global + 3 parametros
    }
    function funcion3():void{
        let x:number = 10;
        let y:number = 10;
        let z:number = 20;
        graficar_ts();//Grafica global + 3 variables
    }
    graficar_ts(); //Grafica sin hola
    let hola:number = 20;
    graficar_ts(); //Grafica con hola
    funcion1();
    funcion2(1, "2", true);
    funcion3();
    function print_array(array:number[]):void{
        console.log("[");
        for(let i:number = 0; i < array.length; i++){
            console.log("  [" + i + "]:" + array[i]);
        }
        console.log("]");
    }
    /*
    20
    [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 ]
    10
    [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
    Pila llena
    Pila llena
    Pila llena
    Pila llena
    Pila llena
    50
    [ 0, 1, 2, 3, 4, 5,  6,  7,  8,  9,  10,  11,  12,  13,  14,  15,  16,  17,  18,  19,  20,  21,  22,  23,  24,
    25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,  42,  43,  44,  45,  46,  47,  48, 49 ]
    Pos | Val 
    |0|0|
    |1|1|
    |2|2|
    |3|3|
    |4|4|
    |5|5|
    |6|6|
    |7|7|
    |8|8|
    |9|9|
    |10|10|
    |11|11|
    |12|12|
    |13|13|
    |14|14|
    |15|15|
    |16|16|
    |17|17|
    |18|18|
    |19|19|
    |20|20|
    |21|21|
    |22|22|
    |23|23|
    |24|24|
    |25|25|
    |26|26|
    |27|27|
    |28|28|
    |29|29|
    |30|30|
    |31|31|
    |32|32|
    |33|33|
    |34|34|
    |35|35|
    |36|36|
    |37|37|
    |38|38|
    |39|39|
    |40|40|
    |41|41|
    |42|42|
    |43|43|
    |44|44|
    |45|45|
    |46|46|
    |47|47|
    |48|48|
    |49|49|
    Pila vacia
*/
    `;
        }

        //Archivos de Entrada/Errores/Errores.ts
        //PASS
        {
        let testString = `
        /** 0.4 puntos por error semantico reportado ***/
        //let x = 5 / 0; //Error 1 // errores de runtime no se atrapan
        //let zzz = 5 % 0; //Error 2 // errores de runtime no se atrapan
        
        let y:number = 20;
        const y:number = 30; //Error 3
        
        if(true){
            break; //Error 4
        }
        
        while(true){
            return; //Error 5
            //agrego un break para que no se encicle
            break;
        }
        
        switch(1){
            case 1:
                continue; //Error 6
        }
        
        /******************/
        let arreglo : number[] = [1,2,3];
        arreglo[0] = "hola"; //Error 7
        
        if(true){
            let noexistoafuera:number = 100;
        }
        console.log(noexistoafuera); //Error 8
        
        let tipo1:string = "hola";
        tipo1 = 100; //Error 9
        
        
        type t = {
            nombre : string
        }
        
        let tNull : t = null;
        //console.log(t.nombre); //Error 10 //Errores de runtime no se atrapan
        `;
        }

        //Archivos de Entrada/Avanzadas/Abb.ts /
        //PASS :D
        //OLD BUG: No hacimos la comparacion de tipos correctamente con los operadores == y !=
        //         cosas como: 'obj == null' no eran posibles
        {
    let testString = `
    /**** Arbol binario de busqueda ***/
    type Nodo = {
        izq : Nodo,
        der : Nodo,
        indice : number,
        nombre : string
    }
    
    type Arbol = {
        raiz : Nodo
    }
    
    let arbol : Arbol = {raiz : null};
    main();
    
    function insertar(nodo : Nodo, indice : number, nombre : string) : Nodo{
        if(nodo == null){
            nodo = {izq : null, der : null, indice : indice, nombre : nombre};
        }
        else if(indice < nodo.indice){
            nodo.izq = insertar(nodo.izq, indice, nombre);
        }
        else {
            nodo.der = insertar(nodo.der, indice, nombre);
        }
        return nodo;
    }
    
    function preOrden(raiz : Nodo) : void{
        if(raiz != null){
            console.log("Indice: " + raiz.indice + " \\t Dato: " + raiz.nombre);
            preOrden(raiz.izq);
            preOrden(raiz.der);
        }
    }
    
    function postOrden(raiz : Nodo) : void{
        if(raiz != null){
            postOrden(raiz.izq);
            postOrden(raiz.der);
            console.log("Indice: " + raiz.indice + " \\t Dato: " + raiz.nombre);
        }
    }
    
    function inOrden(raiz : Nodo) : void{
        if(raiz != null){
            inOrden(raiz.izq);
            console.log("Indice: " + raiz.indice + " \\t Dato: " + raiz.nombre);
            inOrden(raiz.der);
        }
    }
    
    function cambio(raiz : Nodo, indice : number, nuevoNombe : string):void{
        if(raiz == null){
            console.log('Indice no encontrado: ' + indice);
            return;
        }
    
        if(raiz.indice == indice){
            console.log("Encontrado: " + indice);
            raiz.nombre = nuevoNombe;
            return;
        }
        else if(indice < raiz.indice){
            cambio(raiz.izq, indice, nuevoNombe);
            return;
        }
        cambio(raiz.der, indice, nuevoNombe);
    }
    
    function main() : void{
        console.log("-------- INSERTANDO ---------");
        arbol.raiz = insertar(arbol.raiz, 10,"id1");
        arbol.raiz = insertar(arbol.raiz, 5,"id2");
        arbol.raiz = insertar(arbol.raiz, 12,"id3");
        arbol.raiz = insertar(arbol.raiz, 9,"id4");
        arbol.raiz = insertar(arbol.raiz, 3,"id5");
        arbol.raiz = insertar(arbol.raiz, 14,"id6");
        console.log("--------- PREORDEN ----------");
        preOrden(arbol.raiz); // (* RESULTADO : 10, 5, 3, 9, 12, 14 *)
        console.log("--------- POSTORDEN ----------");
        postOrden(arbol.raiz); // (* RESULTADO : 3, 9, 5, 14, 12, 10*)
        console.log("--------- INORDEN ----------");
        inOrden(arbol.raiz); // (* RESULTADO : 3, 5, 9, 10, 12, 14*)
        
        console.log("--------- CAMBIANDO --------");
        cambio(arbol.raiz,3,"idnuevo"); // (* RESULTADO: Econtrado 3 *)
        cambio(arbol.raiz,4,"no encontrado");  //(*RESULTADO: No encontrado 4*)
        inOrden(arbol.raiz); 
    }
    
    /*
        [LOG]: "-------- INSERTANDO ---------" 
        [LOG]: "--------- PREORDEN ----------" 
        [LOG]: "Indice: 10 Dato: id1" 
        [LOG]: "Indice: 5 Dato: id2" 
        [LOG]: "Indice: 3 Dato: id5" 
        [LOG]: "Indice: 9 Dato: id4" 
        [LOG]: "Indice: 12 Dato: id3" 
        [LOG]: "Indice: 14 Dato: id6" 
        [LOG]: "--------- POSTORDEN ----------" 
        [LOG]: "Indice: 3 Dato: id5" 
        [LOG]: "Indice: 9 Dato: id4" 
        [LOG]: "Indice: 5 Dato: id2" 
        [LOG]: "Indice: 14 Dato: id6" 
        [LOG]: "Indice: 12 Dato: id3" 
        [LOG]: "Indice: 10 Dato: id1" 
        [LOG]: "--------- INORDEN ----------" 
        [LOG]: "Indice: 3 Dato: id5" 
        [LOG]: "Indice: 5 Dato: id2" 
        [LOG]: "Indice: 9 Dato: id4" 
        [LOG]: "Indice: 10 Dato: id1" 
        [LOG]: "Indice: 12 Dato: id3" 
        [LOG]: "Indice: 14 Dato: id6" 
        [LOG]: "--------- CAMBIANDO --------" 
        [LOG]: "Encontrado: 3" 
        [LOG]: "Indice no encontrado: ",  4 
        [LOG]: "Indice: 3 Dato: idnuevo" 
        [LOG]: "Indice: 5 Dato: id2" 
        [LOG]: "Indice: 9 Dato: id4" 
        [LOG]: "Indice: 10 Dato: id1" 
        [LOG]: "Indice: 12 Dato: id3" 
        [LOG]: "Indice: 14 Dato: id6" 
    */
    `;
        }

        //Archivos de Entrada/Avanzadas/Ackermann.ts
        //PASS
        {
    let testString = `
    function ackermann(m: number, n: number): number {
        if (m == 0) {
            return (n + 1);
        } else if (m > 0 && n == 0) {
            return ackermann(m - 1, 1);
        } else {
            return ackermann(m - 1, ackermann(m, n - 1));
        }
    }
    console.log(ackermann(3,7)); //1021
    //console.log(ackermann(3,5)); //253 
    `;
        }

        //Archivos de Entrada/Avanzadas/Anidadas.ts
        //PASS
        {
    let testString = `
    // Las siguientes variables se definen en el ámbito global
    let num1:number = 55;
    let num2:number = 66;
    let name_:string = 'Si sale compi2: ';
    
    function addCuadrado(a:number,b:number):number {
      function cuadrado(x:number):number {
          return x * x;
      }
      return cuadrado(a) + cuadrado(b);
    }
    let a:number = addCuadrado(6,6); 
    let b:number = addCuadrado(5,2); 
    let c:number = addCuadrado(12,5);
    
    console.log(a);
    console.log(b);
    console.log(c);
    
    function A(x:number):void {
      function B(y:number):void {
          function C(z:number):void {
            console.log(x * y * z);
          }
          C(5);
      }
      B(2);
    }
    A(8);
    
    
    function getScore(num1:number,num2:number):string {
        num1 = 200;
        num2 = 33;
      
      function add():string {
        return name_ + ' anotó ' + (num1 + num2);
      }
      
      return add();
    }
    console.log(getScore(num1,num2));
    
    
    /**** Funcion Carro ***/
    
    function person(edad : number, nombre : string, apellido : string, notas : number[]):void{
    
      function calcularPromedio() : number{
        let temp:number = 0;
          for(let i:number = 0; i < notas.length; i++){
            temp = temp + notas[i];
          }
        return temp / notas.length;
      }
    
      function getNombre() : string{
        return ("Mi nombre es " + nombre + " " + apellido);
      }
    
      function esMayor() : boolean{
        return edad >= 18;
      }
      console.log('/*************************************/');
      console.log("Hola\\n " + getNombre() + "\\n Tengo " + edad + " años.");
      console.log(esMayor() ? "Soy mayor de edad" : "Soy menor de edad");
      console.log('Mi promedio es de : ' + calcularPromedio());
      console.log('/*************************************/');
    }
    
    
    person(17, 'Juan', 'Perez', [100, 98, 100, 99]);
    person(21, 'Erick', 'Perez', [60, 61, 33, 100]);
    person(33, 'Samael', 'Rojo', [80, 82, 84, 81]);
    
    /*
      72
      29
      169
      80
      Si sale compi2:  anotó 233
      *************************************
      Hola
      Mi nombre es Juan Perez
      Tengo 18 años.
      Soy mayor de edad
      Mi promedio es de : 99.25
      *************************************
      *************************************
      Hola
      Mi nombre es Erick Perez
      Tengo 21 años.
      Soy mayor de edad
      Mi promedio es de : 63.5
      *************************************
      *************************************
      Hola
      Mi nombre es Samael Rojo
      Tengo 33 años.
      Soy mayor de edad
      Mi promedio es de : 81.75
      *************************************
    */
    `;
        }

    //Archivos de Entrada/Avanzadas/Ordenamiento.ts
    //PASS
    {
    let testString = `
    function getPivot(value : number) : number{
        return value % 1 == 0 ? value : value - 0.5;
    }
    
    function swap(i : number, j: number, array : number[]) : void{
        const temp:number = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    
    function quickSort(low: number, high: number, array : number[]) : void{
        let i:number = low;
        let j:number = high;
        let pivot:number = array[getPivot((low + high) / 2)];
    
        while(i <= j){
            while(array[i] < pivot){
                i++;
            }
    
            while(array[j] > pivot){
                j--;
            }
            if(i <= j){
                swap(i, j, array);
                i++;
                j--;
            }
        }
    
        if(low < j){
            quickSort(low, j, array);
        }
        if(i < high){
            quickSort(i, high, array);
        }
    }
    
    let array : number[] = [8, 48, 69, 12, 25, 98, 71, 33, 129, 5];
    quickSort(0, array.length - 1, array);
    console.log('QuickSort: ');
    print_array(array);

    function print_array(array:number[]):void{
        console.log("[");
        for(let i:number = 0; i < array.length; i++){
            console.log("  [" + i + "]:" + array[i]);
        }
        console.log("]");
    }
    `;
    }

    this.sourceString = testString;

    //Parse:
    let rootRunner:GlobalInstructions;
    try {
        rootRunner = parser.parse(this.sourceString) as GlobalInstructions;
    } catch (error) {
        this.outputInterface.errorDataSet.push(MyError.makeMyError(MyErrorKind.SINTACTIC, error.message));
        console.log(error);
        return;
    }

    //Reportamos los errores sintacticos y lexicos
    this.outputInterface.errorDataSet = rootRunner.syntaxErrors;

    //graph:
    this.dotSourceAst = graphAst(rootRunner);
    graphviz('#ast').renderDot(this.dotSourceAst);

    //compilamos
    let compResult = compile(rootRunner, this.outputInterface);

    this.c_ir_header = compResult.header;
    this.c_ir_global_instructions = compResult.funcs_c_ir;
    this.c_ir_string = this.c_ir_header + c_ir_instructions_toString(this.c_ir_global_instructions);

    //optimize:
    this.optimized_c_ir_global_instructions = optimize(compResult.funcs_c_ir, this.optimizations);

    this.optimized_c_ir_string = this.c_ir_header + c_ir_instructions_toString(this.optimized_c_ir_global_instructions);
  }

  //TODO: cambiar nombre porque hay conflicto entre compilar y compile
  compilar(textBoxSource){
    //Parse:
    let rootRunner:GlobalInstructions;
    try {
        rootRunner = parser.parse(this.sourceString) as GlobalInstructions;
    } catch (error) {
        this.outputInterface.errorDataSet.push(MyError.makeMyError(MyErrorKind.SINTACTIC, error.message));
        console.log(error);
        return;
    }

    //Reportamos los errores sintacticos y lexicos
    this.outputInterface.errorDataSet = rootRunner.syntaxErrors;

    //graph:
    this.dotSourceAst = graphAst(rootRunner);
    graphviz('#ast').renderDot(this.dotSourceAst);

    //compilamos
    let compResult = compile(rootRunner, this.outputInterface);

    this.c_ir_header = compResult.header;
    this.c_ir_global_instructions = compResult.funcs_c_ir;
    this.c_ir_string = this.c_ir_header + c_ir_instructions_toString(this.c_ir_global_instructions);

    //[!!!]
    //tenemos que vaciar las instrucciones optimizadas de antes tambien!
    this.optimized_c_ir_global_instructions = [];
    this.optimized_c_ir_string = "";
  }

  optimizar(textBoxSource){
    //[!] asumimos que el arreglo de c_ir instructions no esta vacio entonces tampoco esta 
    //vacio c_ir_footer y c_ir_header
    if(this.optimized_c_ir_global_instructions.length !== 0){
        //optimize:
        this.optimized_c_ir_global_instructions = optimize(this.optimized_c_ir_global_instructions, this.optimizations);

        this.optimized_c_ir_string = this.c_ir_header + c_ir_instructions_toString(this.optimized_c_ir_global_instructions);
    }
    else if(this.c_ir_global_instructions.length !== 0){
        //optimize:
        this.optimized_c_ir_global_instructions = optimize(this.c_ir_global_instructions, this.optimizations);

        this.optimized_c_ir_string = this.c_ir_header + c_ir_instructions_toString(this.optimized_c_ir_global_instructions);
    }
    else{
        alert("Tiene que compilar primero");
    }
  }

  test(textBoxSource){
    //Parse:
    let rootRunner:GlobalInstructions;
    try {
        rootRunner = parser.parse(this.sourceString) as GlobalInstructions;
    } catch (error) {
        this.outputInterface.errorDataSet.push(MyError.makeMyError(MyErrorKind.SINTACTIC, error.message));
        console.log(error);
        return;
    }

    //Reportamos los errores sintacticos y lexicos
    this.outputInterface.errorDataSet = rootRunner.syntaxErrors;

    //graph:
    this.dotSourceAst = graphAst(rootRunner);
    graphviz('#ast').renderDot(this.dotSourceAst);

    //compilamos
    let compResult = compile(rootRunner, this.outputInterface);

    this.c_ir_header = compResult.header;
    this.c_ir_global_instructions = compResult.funcs_c_ir;
    this.c_ir_string = this.c_ir_header + c_ir_instructions_toString(this.c_ir_global_instructions);

    //optimize:
    this.optimized_c_ir_global_instructions = optimize(this.c_ir_global_instructions, this.optimizations);

    this.optimized_c_ir_string = this.c_ir_header + c_ir_instructions_toString(this.optimized_c_ir_global_instructions);
  }
}