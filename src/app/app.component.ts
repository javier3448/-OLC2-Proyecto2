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

    //TODO: test break return and continue
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