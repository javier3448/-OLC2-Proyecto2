import { Component, OnInit } from '@angular/core';
import { MyError } from 'src/Runner/MyError';

import { graphExpression, testRunnerGraph, testTranslatorGraph } from "../Grapher";
import { parser as translatorParser } from "../Translator/TranslatorParser.js";
import { parser as runnerParser } from "../Runner/RunnerParser.js";
import { testRun as testRun } from "../Runner/Runner"
import { testTranslate as testTranslate } from "../Translator/Translator"
import { GlobalInstructionsTranslator } from 'src/Ast/GlobalInstructionsTranslator';
import { GlobalInstructionsRunner } from 'src/Ast/GlobalInstructionsRunner';

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
  dotSourceRunner:string = "";
  dotSourceTranslator:string = "";
  
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

    //PASS
    {
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
    }

    //PASS
    {
    let testString = `
function hello(a:number):void{
  console.log("OuterHello " + a);
  let b = 1234;
  hello(10);
  function hello(a:number):void{
    console.log("InnerHello " + a + " b: " + b);
  }
}
hello(10);
    `
    }

    let testString = `
    let matrixA : number [][] = [];
    let matrixB : number [][] = [];
    let matrixR : number [][] = [];
    const min = 0;
    const max = 4;

    function test():void{
      function a():void{

      }
      function a():void{

      }
    }
    
    function llenado(matrix1 : number[][], matrix2 : number[][], matrix3 : number[][]) : void{
        for(let i = min; i < max; i++){
            matrix1[i] = [];
            matrix2[i] = [];
            matrix3[i] = [];
            for(let j = min; j < max; j++){
                matrix1[i][j] = j * 3 + i;
                matrix2[i][j] = i ** 3 - j ** 2;
                matrix3[i][j] = 0;
            }
        }
    }
    
    function print(matrix : number[][]) : void{
        for(let i = 0; i < matrix.length; i++){
            let salida = '';
            for(let j = 0; j < matrix[i].length; j++){
                salida = salida + "\t|\t" + matrix[i][j];
            }
            console.log(salida);
        }
    }
    
    function suma(matrix1 : number[][], matrix2 : number[][], matrixR : number[][]): void{
        for(let i = min; i < max; i++){
            for(let j = min; j < max; j++){
                matrixR[i][j] = matrix1[i][j] + matrix2[i][j];
            }
        }
    }
    
    function sumarFilas(matrix : number[][]) : void{
        let contador = 0;
        console.log("\t\t\t\t\t\t\t\t\t\tR");
        for(let i = 0; i < matrix.length; i++){
            contador = 0;
            let salida = '';
            for(let j = 0; j < matrix[i].length; j++){
                contador = contador + matrix[i][j];
          salida = salida + "\t|\t" + matrix[i][j];
            }
            console.log(salida, "\t|\t",contador);
        }
    }
    
    function sumarColumnas(matrix : number[][]) : void{
        let contador = 0;
        let salida = 'R';
        for(let i = 0; i < matrix.length; i++){
            contador = 0;
            for(let j = 0; j < matrix[i].length; j++){
                contador = contador + matrix[j][i];
            }
            salida = salida + "\t|\t" +  contador;
        }
        console.log(salida);
    }
    
    
    function resta(matrix1 : number[][], matrix2 : number[][], matrixR : number[][]): void{
        for(let i = min; i < max; i++){
            for(let j = min; j < max; j++){
                matrixR[i][j] = matrix1[i][j] - matrix2[i][j];
            }
        }
    }
    
    
    function multiplicar(matrix1 : number[][], matrix2 : number[][], matrixR : number[][]): void{
        for(let i = min; i < max; i++){
            for(let j = min; j < max; j++){
                for(let k = min; k < max; k++){
                    matrixR[i][j] = matrixR[i][j] + matrix1[i][k] * matrix2[k][j];
                }
            }
        }
    }
    
    function transpuesta(matrix1: number[][]): void{
        const matrixAux : number[][] = [];
        for(let i = 0; i < max; i++){
            matrixAux[i] = [];
            for(let j = 0; j < max; j++){
                matrixAux[i][j] = matrix1[j][i];
            }
        }
        for(let i = 0; i < max; i++){
            for(let j = 0; j < max; j++){
                matrix1[i][j] = matrixAux[i][j];
            }
        }
    }
    
    function minValue(matrix1 : number[][]) : number{   
    
        let iAux = 0;
        let jAux = 0;
        let temp = matrix1[min][min];
        for(let i = 0; i < matrix1.length; i++){
            for(let j = 0; j < matrix1[i].length; j++){
                if(matrix1[i][j] < temp){
                    temp = matrix1[i][j];
                    iAux = i;
                    jAux = j;
                }
            }
        }
        console.log("Min -> [",iAux,",",jAux,"] = ",temp);
        return temp;
    }
    
    function maxValue(matrix1 : number[][]) : number{   
        let iAux = 0;
        let jAux = 0;
        let temp = matrix1[min][min];
        for(let i = 0; i < matrix1.length; i++){
            for(let j = 0; j < matrix1[i].length; j++){
                if(matrix1[i][j] > temp){
                    temp = matrix1[i][j];
                    iAux = i;
                    jAux = j;
                }
            }
        }
        console.log("Max -> [",iAux,",",jAux,"] = ",temp);
        return temp;
    }
    
    function ordenar(matrix1 : number[][]): void{
        let aux = 0;
        for(let i = 0; i < matrix1.length; i++){
            for(let j = 0; j < matrix1[i].length; j++){
                for(let k = 0; k <= i; k++){
                    for(let l = 0; l <= j; l++){
                        if(matrix1[i][j] < matrix1[k][l]){
                            aux = matrix1[i][j];
                            matrix1[i][j] = matrix1[k][l];
                            matrix1[k][l] = aux;
                        }
                    }
                }
            }
        }
    }
    
    function clearMat(matrix : number[][]): void{
        for(let i = 0; i < matrix.length; i++){
            for(let j = 0; j < matrix[i].length; j++){
                matrix[i][j] = 0;
            }
        }
    }
    
    
    llenado(matrixA,matrixB, matrixR);
    console.log("Matrix A");
    print(matrixA);
    console.log("Matrix B");
    print(matrixB);
    
    console.log("MatR = MatA + MatB");
    suma(matrixA,matrixB,matrixR);
    print(matrixR);
    
    console.log("MatR = MatA - MatB");
    resta(matrixA,matrixB,matrixR);
    print(matrixR);
    
    console.log("Clear MatR");
    clearMat(matrixR);
    print(matrixR);
    
    console.log("MatR = MatA * MatB");
    multiplicar(matrixA,matrixB,matrixR);
    print(matrixR);
    
    console.log("Tranpose(MatA)");
    transpuesta(matrixA);
    print(matrixA);
    
    minValue(matrixR);
    maxValue(matrixR);
    
    console.log("Sort MatR");
    ordenar(matrixR);
    print(matrixR);
    
    minValue(matrixR);
    maxValue(matrixR);
    
    console.log("Suma Filas y Columnas");
    sumarFilas(matrixA);
    sumarColumnas(matrixA);
    
    /*
    Matrix A
            |       0       |       3       |       6       |       9 
            |       1       |       4       |       7       |       10
            |       2       |       5       |       8       |       11
            |       3       |       6       |       9       |       12
    Matrix B
            |       0       |       -1      |       -4      |       -9
            |       1       |       0       |       -3      |       -8
            |       8       |       7       |       4       |       -1
            |       27      |       26      |       23      |       18
    MatR = MatA + MatB
            |       0       |       2       |       2       |       0 
            |       2       |       4       |       4       |       2 
            |       10      |       12      |       12      |       10
            |       30      |       32      |       32      |       30
    MatR = MatA - MatB
            |       0       |       4       |       10      |       18
            |       0       |       4       |       10      |       18
            |       -6      |       -2      |       4       |       12
            |       -24     |       -20     |       -14     |       -6
    Clear MatR
            |       0       |       0       |       0       |       0
            |       0       |       0       |       0       |       0
            |       0       |       0       |       0       |       0
            |       0       |       0       |       0       |       0
    MatR = MatA * MatB
            |       294     |       276     |       222     |       132
            |       330     |       308     |       242     |       132
            |       366     |       340     |       262     |       132
            |       402     |       372     |       282     |       132
    Tranpose(MatA)
            |       0       |       1       |       2       |       3
            |       3       |       4       |       5       |       6
            |       6       |       7       |       8       |       9
            |       9       |       10      |       11      |       12
    Min -> [ 0 , 3 ] =  132
    Max -> [ 3 , 0 ] =  402
    Sort MatR
            |       132     |       132     |       132     |       132
            |       222     |       242     |       262     |       276
            |       282     |       294     |       308     |       330
            |       340     |       366     |       372     |       402
    Min -> [ 0 , 0 ] =  132
    Max -> [ 3 , 3 ] =  402
    Suma Filas y Columnas
                                                                                    R
            |       0       |       1       |       2       |       3       |        6
            |       3       |       4       |       5       |       6       |        18
            |       6       |       7       |       8       |       9       |        30
            |       9       |       10      |       11      |       12      |        42
    R       |       18      |       22      |       26      |       30
    */
    `;

    this.sourceString = testString;

    //Translate
    let rootTranslator = translatorParser.parse(this.sourceString) as GlobalInstructionsTranslator;
    //Reportamos los errores sintacticos y lexicos
    this.runtimeInterface.errorDataSet = rootTranslator.syntaxErrors;

    //set AST translator
    this.runtimeInterface.dotSourceTranslator = testTranslatorGraph(rootTranslator);
    testTranslate(rootTranslator, this.runtimeInterface);

    //Run
    let rootRunner = runnerParser.parse(this.runtimeInterface.translation) as GlobalInstructionsRunner;
    //set AST runner
    this.runtimeInterface.dotSourceRunner = testRunnerGraph(rootRunner);
    testRun(rootRunner, this.runtimeInterface);
  }

  traducir(textBoxSource){
    let root = translatorParser.parse(this.sourceString) as GlobalInstructionsTranslator;
    testTranslate(root, this.runtimeInterface);
    this.runtimeInterface.dotSourceTranslator = testTranslatorGraph(root);
  }

  ejecutar(textBoxSource){
    let root = runnerParser.parse(this.runtimeInterface.translation) as GlobalInstructionsRunner;
    testRun(root, this.runtimeInterface);
    this.runtimeInterface.dotSourceRunner = testRunnerGraph(root);
  }

  test(textBoxSource){

    //Translate
    let rootTranslator = translatorParser.parse(this.sourceString) as GlobalInstructionsTranslator;
    //set AST translator
    this.runtimeInterface.dotSourceTranslator = testTranslatorGraph(rootTranslator);
    testTranslate(rootTranslator, this.runtimeInterface);

    //Run
    let rootRunner = runnerParser.parse(this.runtimeInterface.translation) as GlobalInstructionsRunner;
    //set AST runner
    this.runtimeInterface.dotSourceRunner = testRunnerGraph(rootRunner);
    testRun(rootRunner, this.runtimeInterface);
  }
}

