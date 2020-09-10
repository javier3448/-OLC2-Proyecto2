import { Component, OnInit } from '@angular/core';

import { parser } from "../Translator/TranslatorParser.js";
import { graphExpression, test as graphTest } from "../Grapher";
import { test as runTest } from "../Runner/Runner"

//Si ts fuera un lenguaje de verdad esta clase no seria necesaria
//solo mandariamos un puntero al string donde esta la consola al runner :(
export class RuntimeInterface {
  myConsole:string = "";
  translation:string = "";
  //TODO: donde poner el AST, talvez
  //TODO: para errores.
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
    //test string 1
    {
    let testString = `
let a:string = 10 + 20;
a.lol[1][1].fun(1, 2, 3);
lol();
lol(1, 2, 3);`;
    }
    //test string 2
    {
      let testString = `console.log(10 + 20);`
    }
    let testString = `
console.log(20 > 10);
console.log("10" <= "verdad");
console.log(true >= false);
console.log(console < console);//Error (even tho in TS is not an error)`
    ;

    this.sourceString = testString;
    this.runtimeInterface.translation = graphTest(testString);
    runTest(this.sourceString, this.runtimeInterface);
  }

  traducir(textBoxSource){
    //TODO: reemplazar por traducirTest
    this.runtimeInterface.translation = graphTest(textBoxSource.value);
  }

  ejecutar(textBoxSource){
    runTest(this.sourceString, this.runtimeInterface);
  }

  test(textBoxSource){
    this.runtimeInterface.translation = graphTest(textBoxSource.value);
  }
}

