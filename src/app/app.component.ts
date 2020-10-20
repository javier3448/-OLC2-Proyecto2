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
    let testString = `(((3 * 3) + 4) - 80 + 40.00 * 2 + 358.50 - (29 / 14.50)) - (0.50) + ((5750 * 2) - 11800 + 1.0);
//lastT == 70
`;
    }
  
    let testString = `true AND true OR false AND false AND false OR NOT true;
//lastT = 1;
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