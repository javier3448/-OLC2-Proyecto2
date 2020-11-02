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

    //TODO:
    //faltan todos los member access para los lvalue (result[i - 1] = strs[i])
    //es el lvalue que causa clavo
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