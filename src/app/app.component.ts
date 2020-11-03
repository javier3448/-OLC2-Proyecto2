import { Component, OnInit } from '@angular/core';
import { MyError } from 'src/Compiler/MyError';

import { graphAst } from "../Grapher";
import { parser as parser } from "../Compiler/CompilerParser.js";

import { compile as compile } from "../Compiler/Compiler"
import { GlobalInstructions } from 'src/Ast/GlobalInstructions';
import { graphviz } from 'd3-graphviz';
import { wasmFolder } from '@hpcc-js/wasm';

//Representacion de una entrada a un scope del Environment
export class TsEntry{
  constructor(
    public scope:string,
    public name:string,
    public myType:string,
    public value:string,
  ){   }

}

//Si ts fuera un lenguaje de verdad esta clase no seria necesaria
//solo mandariamos un puntero al string donde esta la consola al runner :(
export class RuntimeInterface {
  intermediateRepresentation:string = "";
  optimizedIntermediateRepresentation:string = "";
  dotSourceAst:string = "";
  
  //The tsDataSetHeaders are static in the simbol table
  //Si tiene menos columnas de las esperadas ()
  tsDataSet:TsEntry[] = [];
  errorDataSet:MyError[] = [];

  //TODO: Tabla de errores
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
  runtimeInterface: RuntimeInterface = new RuntimeInterface();

  sourceString:string;

  ngOnInit(): void {

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
    //PENDING
    {
      //TODO: write it well, and we have to implement functions first!
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
      //TODO: write it well, and we have to implement typedef first!
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
      let tesString = `
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

    //PASS. :D!
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

    //Ver si todavia falta algo para las anidadas
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

    this.sourceString = testString;
    wasmFolder('https:cdn.jsdelivr.net/npm/@hpcc-js/wasm@0.3.13/dist');

    //Parse:
    let rootRunner = parser.parse(this.sourceString) as GlobalInstructions;

    //Reportamos los errores sintacticos y lexicos
    this.runtimeInterface.errorDataSet = rootRunner.syntaxErrors;

    //graph:
    this.runtimeInterface.dotSourceAst = graphAst(rootRunner);
    graphviz('#ast').renderDot(this.runtimeInterface.dotSourceAst);

    //compilamos
    compile(rootRunner, this.runtimeInterface);

    //optimize:
    //... 
  }

  //TODO: cambiar nombre porque hay conflicto entre compilar y compile
  compilar(textBoxSource){
    //Parse:
    let rootRunner = parser.parse(this.sourceString) as GlobalInstructions;

    //Reportamos los errores sintacticos y lexicos
    this.runtimeInterface.errorDataSet = rootRunner.syntaxErrors;

    //graph:
    this.runtimeInterface.dotSourceAst = graphAst(rootRunner);
    graphviz('#ast').renderDot(this.runtimeInterface.dotSourceAst);

    //compilamos
    compile(rootRunner, this.runtimeInterface);
  }

  optimizar(textBoxSource){
    throw new Error("not implemented yet!");
  }

  test(textBoxSource){
    //Parse:
    let rootRunner = parser.parse(this.sourceString) as GlobalInstructions;

    //Reportamos los errores sintacticos y lexicos
    this.runtimeInterface.errorDataSet = rootRunner.syntaxErrors;

    //graph:
    this.runtimeInterface.dotSourceAst = graphAst(rootRunner);
    graphviz('#ast').renderDot(this.runtimeInterface.dotSourceAst);

    //compilamos
    compile(rootRunner, this.runtimeInterface);

    //optimize:
    //...
  }
}