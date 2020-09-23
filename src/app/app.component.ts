import { Component, OnInit } from '@angular/core';

import { graphExpression, testGraph as testGraph } from "../Grapher";
import { testRun as testRun } from "../Runner/Runner"
import { testTranslate as testTranslate } from "../Translator/Translator"

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
  myConsole:string = "";
  translation:string = "";
  dotSource:string = "";
  
  //The tsDataSetHeaders are static in the simbol table
  //Si tiene menos columnas de las esperadas ()
  tsDataSet:TsEntry[] = [];
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

    let testString = `
let array = [1,2,4,5];
for(let a of array){
  console.log(a);
}
for(let a of [1,2,4,5]){
  console.log(a);
}
type A = {
  a:string,
  b:number,
  c:boolean
}
let a:A = {
  a:"Javier",
  b:10,
  c:true
};
for(let prop in a){
  console.log(prop);
}
for(let prop in { a:"Javier", b:10, c:true }){
  console.log(prop);
}
    `;

    this.sourceString = testString;
    this.runtimeInterface.dotSource = testGraph(testString);
    //runTest(this.sourceString, this.runtimeInterface);
    testTranslate(this.sourceString, this.runtimeInterface);
    testRun(this.runtimeInterface.translation, this.runtimeInterface);
  }

  traducir(textBoxSource){
    testTranslate(this.sourceString, this.runtimeInterface);
  }

  ejecutar(textBoxSource){
    testRun(this.runtimeInterface.translation, this.runtimeInterface);
  }

  test(textBoxSource){
    this.runtimeInterface.dotSource = testGraph(textBoxSource.value);
    testTranslate(this.sourceString, this.runtimeInterface);
    testRun(this.runtimeInterface.translation, this.runtimeInterface);
  }
}

