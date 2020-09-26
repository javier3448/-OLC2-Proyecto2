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

    //PASS
    {
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
    }
    
    //FAIL. Template strings are too hard and bug prone in jison, bug prone. there is not enough time
    {
    let testString = `
let a = 10;
let b = 30;
console.log(\`a + b = \${a + b}\`);
    `;
    }

    //PASS
    {
    let testString = `
        type AVLNode = {
            left: AVLNode,
            right: AVLNode,
            height: number,
            value: number
        }
        
        type AVLTree = {
            root: AVLNode
        }
        
        function height(n: AVLNode): number {
            if (n == null) {
                return 0;
            }
            return n.height;
        }
        
        function insert(node: AVLNode, value: number) :AVLNode {
            /* 1.  Perform the normal BST rotation */
            if (node == null) {
                node = {
                    left: null,
                    right: null,
                    height: 0,
                    value: value
                };
                return node;
            }
        
            if (value < node.value) {
                node.left = insert(node.left, value);
            } else {
                node.right = insert(node.right, value);
            }
        
            /* 2. Update height of this ancestor node */
            if (height(node.left) > height(node.right)) {
                node.height = height(node.left) + 1;
            } else {
                node.height = height(node.right) + 1;
            }
        
            /* 3. Get the balance factor of this ancestor node to check whether
               this node became unbalanced */
            let balance = getBalance(node);
        
            // If this node becomes unbalanced, then there are 4 cases
            // Left Left Case
            if (balance > 1 AND value < node.left.value) {
                return rightRotate(node);
            }
        
            // Right Right Case
            if (balance < -1 AND value > node.right.value) {
                return leftRotate(node);
            }
        
            // Left Right Case
            if (balance > 1 AND value > node.left.value) {
                node.left = leftRotate(node.left);
                return rightRotate(node);
            }
        
            // Right Left Case
            if (balance < -1 AND value < node.right.value) {
                node.right = rightRotate(node.right);
                return leftRotate(node);
            }
        
            /* return the (unchanged) node pointegerer */
            return node;
        }
        
        function rightRotate(y: AVLNode): AVLNode {
            let x: AVLNode = y.left;
            let T2: AVLNode = x.right;
        
            // Perform rotation
            x.right = y;
            y.left = T2;
        
            // Update heights
            if (height(y.left) > height(y.right)) {
                y.height = height(y.left) + 1;
            } else {
                y.height = height(y.right) + 1;
            }
        
            if (height(x.left) > height(x.right)) {
                x.height = height(x.left) + 1;
            } else {
                x.height = height(x.right) + 1;
            }
        
            // Return strc root
            return x;
        }
        
        function leftRotate(x: AVLNode): AVLNode {
            let y: AVLNode = x.right;
            let T2: AVLNode = y.left;
        
            // Perform rotation
            y.left = x;
            x.right = T2;
        
            //  Update heights
            if (height(x.left) > height(x.right)) {
                x.height = height(x.left) + 1;
            } else {
                x.height = height(x.right) + 1;
            }
        
            if (height(y.left) > height(y.right)) {
                y.height = height(y.left) + 1;
            } else {
                y.height = height(y.right) + 1;
            }
            // Return strc root
            return y;
        }
        
        // Get Balance factor of node N
        function getBalance(N: AVLNode): number {
            if (N == null) {
                return 0;
            }
            return height(N.left) - height(N.right);
        }
        
        function preOrder(root: AVLNode): void {
            if (root != null) {
                preOrder(root.left);
                console.log(root.value);
                preOrder(root.right);
            }
        }
        
        function getDot(root: AVLNode): string {
            if (root != null) {
                let ret = "" + root.value;
                let tmp = getDot(root.left);
                if (tmp != null) {
                    ret = ret + root.value + "->" + tmp;
                }
                tmp = getDot(root.right);
                if (tmp != null) {
                    ret = ret + root.value + "->" + tmp;
                }
                return ret;
            }
            return null;
        } 
        
        let tree : AVLTree = {
            root: null
        };
        
        tree.root = insert(tree.root, 19);
        tree.root = insert(tree.root, 29);
        tree.root = insert(tree.root, 99);
        tree.root = insert(tree.root, 9);
        tree.root = insert(tree.root, 2);
        tree.root = insert(tree.root, 32);
        tree.root = insert(tree.root, 4);
        tree.root = insert(tree.root, 0);
        tree.root = insert(tree.root, 1);
        preOrder(tree.root);
        `;

    }

    let testString = `
    function getPivot(value : number) : number{
      return value % 2 == 0 ? value : value - 0.5;
  }
  
  function swap(i : number, j: number, array : number[]) : void{
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
  
  function bubbleSort(array : number[]) : void{
      for(let i = 0; i < array.length; i++){
          for(let j = 0; j < array.length - 1; j++){
              if(array[j] > array[j + 1]){
                  swap(j, j+1, array);
              }
          }
      }
  }
  
  function quickSort(low: number, high: number, array : number[]) : void{
      let i = low;
      let j = high;
      let pivot = array[getPivot((low + high) / 2)];
  
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
  
  function insertionSort(array : number[]) : void{
      for(let i = 1; i < array.length; i++){
          let j = i;
          let temp = array[i];
          while(j > 0 AND array[j - 1] > temp){
              array[j] = array[j-1];
              j--;
          }
          array[j] = temp;
      }
  }
  
  function selectionSort(array : number[]) : void{
      for(let j = 0; j < array.length; j++){
          let iMin = j;
          for(let i = j + 1; i < array.length; i++){
              if(array[i] < array[iMin]){
                  iMin = i;
              }
          }
          swap(j, iMin, array);
      }
  }
  
  function mergeSort(array : number[], l : number, r : number) : void{
      if(l >= r){
          return;
      }
      
      let m = getPivot((l + r) / 2);
      mergeSort(array, l, m);
      mergeSort(array, m + 1, r);
      merge(array, l, m , r);
  }
  
  function merge(array : number[], l : number, m : number, r : number) : void{
      let n1 = m - l + 1;
      let n2 = r - m;
  
      let L : number[] = [];
      let R : number[] = [];
  
      for(let i = 0; i < n1; i++){
          L[i] = array[l + i];
      }
  
      for(let j = 0; j < n2; j++){
          R[j] = array[m + 1 + j];
      }
  
      let i = 0;
      let j = 0;
      let k = l;
  
      while(i < n1 AND j < n2){
          if(L[i] <= R[j]){
              array[k] = L[i];
              i++;
          }
          else{
              array[k] = R[j];
              j++;
          }
          k++;
      }
      
      while(i < n1){
          array[k] = L[i];
          i++;
          k++;
      }
  
      while(j < n2){
          array[k] = R[j];
          j++;
          k++;
      }
  }
  
  function menu() : void{
      let i = 0;
      while(true){
          let array : number[] = [32,21,7,89,56,909,109, 2];
          switch (i) {
              case 0:
                  bubbleSort(array);
                  console.log('BubbleSort: ', array);
                  break;
              case 1:
                  quickSort(0, array.length - 1, array);
                  console.log('QuickSort: ', array);
                  break;
              case 2:
                  insertionSort(array);
                  console.log('InsertionSort', array);
                  break;
              case 3:
                  selectionSort(array);
                  console.log('SelectionSort', array);
                  break;
              case 4:
                  mergeSort(array, 0, array.length - 1);
                  console.log('MergeSort: ' , array);
              default:
                  return;
          }
          i++;
      }
  }
  
  menu();
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

