import { Component, OnInit } from '@angular/core';

import { parser } from "../Translator/TranslatorParser.js";
import { graphExpression, test as graphTest } from "../Grapher";
import { test as runTest } from "../Runner/Runner"

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
  
  //might not exist at some point might just be a svg or something
  astDot:string = "";
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
    {
      let testString = `
console.log(20 > 10);
console.log("10" <= "verdad");
console.log(true >= false);
console.log(console < console);//Error (even tho in TS is not an error)`
    }
    {
    let testString = `
while(true){
  console.log("Javier");
  break;
}
`;
    }
    {
      //must print error
      let testString = `
let a:string = 10;
console.log(a);
`;
    }
    {
    let testString = `
let a:string = "some string";
a = "other string";
console.log(a);
`;
    }
    {
  //must report a type error
      let testString = `
let a:string = "some string";
a = 10;
console.log(a);
      `;
    }
    {
      let testString = `
type A = {
  a: number,
  b: string,
}

let a:A = { a: 10, b: "s" };

console.log(a);
      `;
    }
    {
      let testString = `
type A = {
    a: string;
}

let a:A = {
    a:"a1", 
};

console.log(a);`
      ;
    }

    {
    let testString = `
type A = {
    a: string;
    b: B;
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

console.log(a);`
    ;
    }
    
    {
    let testString = `
function hello(a:number):void{
  console.log("Hello " + a);
}

hello(10);
`
    }

    {
    let testString = `
//failing test for null bug
console.log(null);//BUG prints undef
console.log(undefined);
let a = null;
let b = undefined;
console.log(a);//BUG prints undef
console.log(b);
    `;
    }

    {
    let testString = `
let n:number = 0;

while(n < 10){
  n = n + 1;
  console.log(n);
  continue;
  console.log("FAIL");
}
    `;
    }

    //Test graficar_ts()
    {
    let testString = `
let a = "hello";
function foo():void{
  console.log("foo");
}
type A = {
  a:string,
}

graficar_ts();
    `
    }
    
    //UNSOLVED BUG!:
    {
      let testString = `
      // bug: a should have type A not Anonymous
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
graficar_ts();
console.log(a);`
      ;
    }
    
    let testString = `
type A = {
  a:string
}
type B = {
  a:string
}
let a1:A = { a: "hello" };
let a2:A = a1;
let a3:B = a2;
graficar_ts();
//TODO!!!!!: correr pruebas de pasar ref de MyObj y de primitive de nuevo!!!
//           estan por el nullify +/-
    `

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

