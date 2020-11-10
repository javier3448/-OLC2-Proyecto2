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

    //REMEMBER: it threw segfault when we ran it
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

    //TODO revisar que el cambio de orden no afecte el tipo
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

    //TODO:
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
//TODO: test with array, mytype, alpha_array, null, string etc... 
//TODO: how can we test all that dominat type jazz thingy
//TODO: probar con ternary type = void
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

    //TODO:
    //test correctness of like the 'triple scope' weirdness that happens with for cycles
    {
        let testString = `
let iterator = 10;
for (const iterator in {a:"javier", b:"antonio"}) {
    let iterator = 20;
    console.log(iterator);
}//should print 20 2 times
        `;
    }

    //test de examen final:
        {
        let testString = `
//BUGgy: T1 y T2 estan como al revez
//BUGgy: T55 esta raro (en los otros casos primero hacemos el + 1)
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

        //TODO: corregir esta para proyecto 2 y probarla
        {
    let testString = `
    let array = [32, 21, 7, 89, 56, 909, 109, 2];
    let indice = "indice " + array[0];
    console.log("***********************************************************************");
    console.log("***********                TERNARIO                    ****************");
    console.log("***********************************************************************");
    console.log(indice == "indice [32]" ? 'TERNARIO BIEN' : 'TERNARIO MALO');
    console.log('\n');
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
    
    console.log('\n');
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
    
    
    console.log('\n');
    console.log("***********************************************************************");
    console.log("***********                 WHILE                      ****************");
    console.log("***********************************************************************");
    let index = 0;
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
    
    console.log('\n');
    console.log("***********************************************************************");
    console.log("***********                 doWHILE                    ****************");
    console.log("***********************************************************************");
    index = -1;
    do {
        index = index + 1;
        if (index == 0 || index == 1 || index == 11 || index == 12) {
            console.log('*********************************************************************************************************');
        } else if (index == 2) {
            console.log('**********  ***************  ******                 ******                 ******              **********')
        } else if (index >= 3 && index <= 5) {
            console.log('**********  ***************  ******  *********************  *************  ******  **********************')
        } else if (index == 6) {
            console.log('**********  ***************  ******                 ******                 ******  **********************');
        } else if (index >= 7 && index <= 9) {
            console.log('**********  ***************  ********************   ******  *************  ******  **********************');
        } else if (index == 10) {
            console.log('**********                   ******                 ******  *************  ******              **********');
        }
    } while (index != 12);
    
    console.log('\n');
    
    
    console.log('\n');
    console.log("***********************************************************************");
    console.log("***********                 FOR LOOP                   ****************");
    console.log("***********************************************************************");
    for (let i = 0; i < 10; i++) {
        let output = '';
        for (let j = 0; j < 10 - i; j++) {
            output = output + ' ';
        }
        for (let k = 0; k <= i; k++) {
            output = output + '* ';
        }
        console.log(output);
    }
    
    console.log('\n');
    console.log("***********************************************************************");
    console.log("***********                 FOR OF                     ****************");
    console.log("***********************************************************************");
    let arr = [1,2,3,4,5,6];
    for(let i in [1,2,3,4,5,6]){
        console.log(arr[i] == 1, arr[i] == 2, arr[i] == 3, arr[i] == 4, arr[i] == 5, arr[i] == 6);
    }
    
    
    console.log('\n');
    console.log("***********************************************************************");
    console.log("***********                 FOR IN                     ****************");
    console.log("***********************************************************************");
    for(let e of [1,2,3,4,5,6]){
        if(arr.length > e){
            console.log(e*arr[e],e*arr[e],e*arr[e],e*arr[e],e*arr[e],e*arr[e]);
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