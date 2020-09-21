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

    //old bug: it printed undef
    {
    let testString = `
//failing test for null bug
console.log(null);
console.log(undefined);
let a = null;
let b = undefined;
console.log(a);
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
    
    //old bug: Every variable would be anonymous before the bug fix
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
let b:B = { 
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
      };
let c = b;
graficar_ts();
console.log(a);`
      ;
    }
    
    {
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
//Somewhat buggy and stupid behaviour :(
//We end up printing in graficar_ts():
//a1	B	{ a:"hello" }
//a2	B	{ a:"hello" }
//a3	B	{ a:"hello" }
//TODO!!!!!: correr pruebas de pasar ref de MyObj y de primitive de nuevo!!!
//           estan por el nullify +/-
    `;
    }

    {
    let testString = `
let array1:number[] = [10, 20, 30, 40];
let array2:Array<number> = array1;
//ni siquiera se bien que deberia de pasar aqui con las referencia y todoeso
let array3:number[][] = [array1, array1, array1, array1];
let array4:Array<Array<number>> = [array1, array1, array1, array1];
console.log(array1);//[ 10, 20, 30, 40 ] 
console.log(array1.length);//4 
array1.push(200);
console.log(array2);//[ 10, 20, 30, 40, 200 ] 
console.log(array2.pop());//200
console.log(array1); //[ 10, 20, 30, 40 ]
console.log(array1.push(500));//5
console.log(array3); //[ [ 10, 20, 30, 40, 500 ], [ 10, 20, 30, 40, 500 ], [ 10, 20, 30, 40, 500 ], [ 10, 20, 30, 40, 500 ] ] 
    `;
    }

    {
    let testString = `
function nullify(a:Array<number>):void{
  a = null;
}
let a = [1,2,3];
nullify(a);
console.log(a);
    `;
    }

    {
    let testString = `
function nullifyA(a:A):void{
  a = null;
}
function nullifyNum(a:number):void{
  a = null;
}
type A = {
  a:string;
}
let a = [{a:"hello"},{a:"world!"},{a:":D"}];
nullifyA(a[0]);
console.log(a);//[0:null, 1:{a:"world!"}, 2:{a:":D"}]
let b = [10,20,30];
nullifyNum(b[0]);
console.log(b);//[10,20,30]
    `;
    }

    {
    let testString = `
let a = 20;
if(a <= 20){
  console.log("1er if");
}
else if(a <= 40){
  console.log("2do if");
}
else if(a <= 60){
  console.log("3er if");
}
else{
  console.log("else");
}
    `;
    }

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

    {
    let testString = `
let a = 20;
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

    {
    let testString = `
let a = false;
console.log(a ? "true" : "false");
console.log(a);
    `;
    }

    {
    //unary minus
    let testString = `
let a = -1;
console.log(a);
    `
    }

    {
    let testString = `
let a = NOT true;
console.log(a);
    `;
    }

    // 20/09 we passed all the {}s tests

    {
    let testString = `
let n = 0;
do{
  console.log("PASS");
  if(n > 0){
    console.log("FAIL");
  }
  n++;
}while(false);
    `
    }

    //Expression.ts
    let testString = `
    let let1 = 1;
    let punteo = 0;
    
    Inicio();
    
      function  Inicio():void {
        console.log("-----------------CALIFICACION-----------------");
        let let1 = 0;
        //Verificar ámbitos, se toma con prioridad la letiable local ante la global.
        if (let1 != 0)
        {
            console.log("No se toma con prioridad la letiable local ante la global");
            console.log("Perdiste 5 puntos :c");
        }
        else{
            punteo = punteo + 5;
        }
    
        //Sección de declaracion de letiables
        Declaracion();
        
        //seccion de manejo de ámbitos 2
        let amb1 = 5;
        Ambitos2();
    
        //Sección de expresiones aritméticas
        Aritmeticas();
    
        
        //Seccion de expresiones lógicas
        logicas();
    
        
        //Seccion de expresiones relacionales
        Relacionales();
    
        //punteo final
        console.log("punteo Final: "+punteo);
    }
    
      function  Declaracion():void{
        /*
            SALIDA ESPERADA:
                ========= Metodo Declaracion =========
                Voy a ganar Compiladores 2 :D
                ======================================
        
        */
        console.log("========= Metodo Declaracion =========");
        let n1 = 2;
        let n2 = 2;
        let n3 = 2;
        let n4 = 2;
        let str1 = "Voy a ganar Compiladore";
        let str2 = "Voy a ganar Compiladore";
        let str3 = "Voy a ganar Compiladore";
        let str4 = "Voy a ganar Compiladore";
        let db1 = 0.0;
        let db2 = 0.0;
        let db3 = 0.0;
        let db4 = 0.0;
        let chr1 = 's';
        let chr2 = 's';
        let chr3 = 's';
        let chr4 = "s";
        //if n modificar la asignación
        if (db1 == db4){
            console.log(str4 + chr4 +" " +n4+" :D");
        }else {
            console.log("Problemas en el metodo declaracion :(");
        }
        console.log("======================================");
        punteo = punteo + 5;
    }
    
      function  Ambitos2():void{
        //debería lanzar un error, cualquiera
        //comentar luego de que lanze el error
        console.log("========= Error Ambitos ==============");
        console.log("Debería lanzar error: "+amb1);
        let amb1 = "Desde ambito2";
        console.log("======================================");
        console.log("================ Nice ================");
        punteo = punteo + 5;
        console.log("Sin error: "+amb1);
        console.log("======================================");
    
    }
    
      function  Aritmeticas():void{
        //suma de lets con caracteres
        /*
            SALIDA ESPERADA
        ==============Aritmeticas=============
        Hola COMPI
        El valor de  n1 = 52.1
        El valor de n3 = 70.0
        -Operaciones Basicas: valor esperado:   a)62   b)0   c)-19   d)256   resultados>
        a) 62
        b) 0
        c) -19
        d) 256
        ======================================
        */
        console.log("==============Aritmeticas=============");
        let art1 = "Hola "+"C"+""+"O"+""+"M"+""+"P"+""+"I";
        console.log(art1);
        if (art1=="Hola COMPI"){
            punteo = punteo + 3;
        }else {
            console.log("Perdiste 3 puntos en suma de let y let :c");
        }
    
        let n1 = 0.0 + 1 + 1 + 1 + 0.1 + 49;
        console.log("El valor de  n1 = "+n1);
        if (n1 == 52.1){
            punteo = punteo + 5;
        }else {
            console.log("Perdiste 5 puntos en suma de enteros booleanos y caracteres :c");
        }
    
        let n4 = (5750 * 2) - 11800 + 1.0;
        let n3 = (((3 * 3) + 4) - 80 + 40.00 * 2 + 358.50 - (29 / 14.50)) - (0.50) + n4;
        console.log("El valor de n3 = "+n3);
        if (n3 == 70)
        {
            punteo = punteo + 3;
        }
        else 
        {
            console.log("Perdiste 3 puntos :c ");
        }
        
        operacionesBasicas();
        operacionesAvanzadas();
        console.log("======================================");
        
    }
    
      function  operacionesBasicas():void{
        console.log("Operaciones Aritmeticas 1: valor esperado:  \\na)62   \\nb)0   \\nc)-19   \\nd)256   \\nresultados>");
        let a = (20-10+8/2*3+10-10-10+50);
        let b = (50/50*50+50-100+100-100);
        let c = (100/20*9-78+6-7+8-7+7*1*2*3/3);
        let d = (2 **(20/5*2));
        console.log("a) " +a);
        console.log("b) " +b);
        console.log("c) " +c);
        console.log("d) " +d);
        if (a==62 AND b==0 AND c == -19 AND d ==256){
            console.log("Operaciones aritmeticas 1 bien :D");
            punteo = punteo + 5;
        }else {
            console.log("Error en las operaciones basicas :(");
        }
    }
    
      function  operacionesAvanzadas():void{
        let aritmetica1 = 2;
        let aritmetica2 = -10;
        console.log("Operaciones Aritmeticas 2: valor esperado> -20  41, resultado>");
        let aritmetica3 = aritmetica2*aritmetica1;
        console.log(aritmetica3+"");
        aritmetica1 = aritmetica3/aritmetica1+50 **2/50+50*2-100+100/100-0;
        console.log(aritmetica1+"");
        if (aritmetica3 == -20 AND aritmetica1 == 41){
            console.log("Operaciones aritmeticas 2 bien :D");
            punteo = punteo + 5;
        }else {
            console.log("Error Operaciones Aritmeticas :c alv :c");
        }
    }
    
    //FN5HU-3uykL
    
      function  logicas():void{
          console.log("==============logicas1=============");
        if (NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT NOT true){
            punteo = punteo + 1;
            console.log("Bien primera condicion :)");
        }else {
            console.log("Perdiste 1 punto :c");
        }

        if (true AND true OR false AND false AND false OR NOT true){
            punteo = punteo + 1;
            console.log("Bien segunda condicion:)");
        }else {
            console.log("Perdiste 1 punto :c");
        }
        console.log("======================================");
        logicas2();
    }
    
      function  logicas2():void{
        let n0 = 16;
              console.log("==============logicas2=============");
    
        if (NOT (NOT (n0 == 16 AND false == true) AND NOT (true))){
                console.log("Not y Ands Correctos");
                            punteo = punteo +3;
    
        }else {
                    console.log("No funcionan nots y ands :(");
            }
        let n1 = n0 /16;
        n1 = n1 + 1;
            let condicion1 = n1 !=2; //esto es false
            let aritmetica1 = n0/16 + 0; // aritmetica1 = 0
            let condicion2 = aritmetica1 == n1; //false
            let condicion3 = NOT true; //false
            
        if (NOT (NOT (NOT (condicion1 OR condicion2) OR condicion3 ))){
            console.log("Nots y Ors correectos");
                    punteo = punteo + 3;
        }else {
                console.log("No Funciona nots y ands :(");
            }
                console.log("======================================");
    }
    
      function  Relacionales():void{
        let n0 = 34;
        let n1 = 16;
        
        relaciones1(n0);
        relaciones2(n1);
    }
    
    
      function  relaciones1(salida:number):void
    {
            console.log("==============relacionales1=============");
            let n0 = salida + 0.0;
            if (n0 < 34.44)
                {
                    salida = salida+15;
                    if (salida > 44)
                        {
                            salida++;
                        }
                }
                else {
                    salida = 1;
                }
            
            if (salida != 1)
                {
                    if (salida == 50)
                        {
                            console.log("salida Correcta Relacionales 1!");
                            punteo = punteo + 5;
                        }
                        else {
                            console.log("salida incorrecta!");
                        }
                }
                else {
                    console.log("salida incorrecta!");
                }
            console.log("======================================");
    }
    
      function  relaciones2(n0:number):void{
                console.log("vas bien, animo :D");
                console.log("============Relacionales2=============");
    
                if (10-15 >= 0 AND 44.44 == 44.44)
                {
                    console.log("salida incorrecta primer if relacionales2!");
                }
                else {
                    if (15+8 == 22-10+5*3-4 AND 13*0>-1)
                        {
                            if (10.0 != 11.0-1.01 )
                                {
                                    console.log("salida CORRECTA en relacionales2!");
                                    punteo = punteo + 5;
                                }
                                else {
                                    console.log("salida incorrecta segundo if relacionales 2!");
                                }
                        }
                        else {
                            if (1 == 1)
                                {
                                    console.log("salida incorrecta relacionales 2 3er if !");
                                }
                                else {
                                    console.log("salida incorrecta relacionales 2 Sino3er if !");
                                }
                        }
                }
            console.log("======================================");
            FactorialIterativo(7);
    }
    
    function  FactorialIterativo(n2:number):void{
                          console.log("==============for Calificar Ciclos=============");
    
        let numeroFactorial = n2;
        while(numeroFactorial > -1){
            mostrarFactorial(numeroFactorial);
            numeroFactorial--;
        }
            SentenciasAnidadas();
            console.log("======================================");
    
    }
    
      function  mostrarFactorial(n2:number):void{
        let fact = 1;
        let str= "El factorial de: "+n2 +" = ";
        if (n2 !=0){
            for(let i=n2; i >0; i--){
                fact = fact * i;
                str = str + i;
                if (i > 1){
                    str = str + " * ";
    
                }else {
                    str = str + " = ";
                }
            }
        }
            str = str + fact+ ";";
        console.log(str);
    }
    
    
      function  figura1(n: number):void{
        
        let letFigura = "";
        for (let i = -3*n/2; i <= n; i++) {
            letFigura = "";
                for (let j = -3*n/2; j <= 3*n/2; j++) {
    
                    let absolutoi = i;
                    let absolutoj = j;
                    if (i <0){
                        absolutoi = i*-1;
                    }
                    if (j < 0){
                        absolutoj = j*-1;
                    }
                    if ((absolutoi + absolutoj < n)
                        OR ((-n/2-i) * (-n/2-i) + ( n/2-j) * ( n/2-j) <= n*n/2)
                        OR ((-n/2-i) * (-n/2-i) + (-n/2-j) * (-n/2-j) <= n*n/2)) {
                        letFigura = letFigura + "* ";
                    }
                    else{
                        letFigura = letFigura + ". ";
                    }
                }
                console.log(letFigura);
            }
        console.log("if la figura es un corazon +10 <3");
    }
    
      function  figura2():void{
        let letFigura = "";
          let c = "* ";
            let b = "  ";
            let altura = 10;
            let ancho = 1;
            for (let i = 0; i < altura/4; i++){
                for (let k = 0; k < altura - i; k++){
                    letFigura = letFigura+b;
                }
                for (let j = 0; j < i*2 + ancho; j++){
                    letFigura = letFigura + c;
                }
                
                console.log(letFigura);
                letFigura ="";
            }
              letFigura = "";
              for(let i = 0; i < altura/4; i++){
                for(let k = 0; k < (altura - i) - 2; k++){
                    letFigura = letFigura + b;
                }
                for(let j = 0; j < i*2 + 5; j++){
                    letFigura = letFigura + c;
                }
                
                console.log(letFigura);
                letFigura = "";
            }
              letFigura = "";
            for(let i = 0; i < altura/4; i++){
                for(let k = 0; k < (altura - i) - 4; k++){
                    letFigura = letFigura + b;
                }
                for(let j = 0; j < i*2 + 9; j++){
                    letFigura = letFigura +c;
                }
                
                console.log(letFigura);
                letFigura = "";
            }
            
            letFigura ="";
            for(let i = 0; i < altura/4; i++){
                for(let k = 0; k < (altura - i) - 6; k++){
                    letFigura = letFigura + b;
                }
                for(let j = 0; j < i*2 + 13; j++){
                    letFigura = letFigura + c;
                }
                
                console.log(letFigura);
                letFigura = "";
            }
            letFigura = "";
            for(let i = 0; i < altura/4; i++){
                for(let k = 0; k < altura -2; k++){
                    letFigura = letFigura + b;
                }
                for(let j = 0; j < 5; j++){
                    letFigura = letFigura + c;
                }
                
                console.log(letFigura);
                letFigura = "";
            }
            
                console.log("if la figura es un Arbol +10 <3");
    
            }
    
      function  SentenciasAnidadas():void{
        let numero1 = 0;
        do{
        switch(numero1){
            case 0:
                figura0(8);
                break;
            case 1:
                figura1(10);
                break;
            case 2:
                figura2();
                break;
            default:
                console.log("Esto se va a console.log 2 veces :3");
                
        }
        numero1 = numero1 + 1;
        }while(numero1 <5);
    }
    
      function  figura0(numero:number):void{
        let i = 0;
        while(i < numero){
            let j = 0;
            let numeroMostrar = 1;
            let unaFila = "";
            while(j <= i){
                unaFila = unaFila + " " + numeroMostrar;
                numeroMostrar  = numeroMostrar + 1;
                j = j + 1;
            }
            console.log(unaFila);
            i = i + 1;
        }
        console.log("if la figura es un triangulo de numeros + 5 :3");
    }
    
    `;

    //REALLY BAD BUG: Cannot read property 'kind' of undefined Environment 209
    //It was because while, switch, and the fors would not return null unless they got
    //a break;. This was not intended they are supposed to return null after they are done
    //going through all their iterations
    //SOLVED!!!
    {
      let testString = `
while(false){
  console.log("true");
}
      `;
    }
    
    //FuncionRecursivo
    {
    let testString = `
    function fibonacci( n:number):number {
      if (n <= 1) {
          return n;
      }
      return fibonacci(n - 1) + fibonacci(n - 2);
  }
  console.log(fibonacci(13));  // 233


function hanoi( discos:number, origen:number,  auxiliar:number,  destino:number):string {
let result:string = "";
if (discos == 1) {
result = result + (origen + destino);
} else {
  result = result + hanoi(discos - 1, origen, destino, auxiliar);
   result = result + (origen + destino);
   result = result + hanoi(discos - 1, auxiliar, origen, destino);
}
      return result;
  }

  console.log(hanoi(4,1,5,3));  //648648648648648

function ackermann( m:number,  n:number):number {
      if (m == 0) {
          return (n + 1);
      } else if (m > 0 && n == 0) {
           let cuatro:number = ackermann(m - 1, 1);
          return cuatro;
      } else {
          let ret:number =  ackermann(m, n - 1);
          let  nueva:number = ackermann(m - 1, ret);
          return nueva;
      }
  
}
console.log(ackermann(3,8)); //2045 se tardo 6 segundos


  function par( nump:number):number {
      if (nump == 0) {
          return 1;
      }
      return impar(nump - 1);
  }

  function impar( numi:number):number {
      if (numi == 0) {
          return 0;
      }
      return par(numi - 1);
  }
  console.log(par(29)); //0
  console.log(par(400)); //1

  function hofstaderMasculino( n:number):number {
      if (n < 0) {
          return 0;
      } else {
         
          if(n != 0){
              return n - hofstaderMasculino(n - 1);
          }else{ 
              return 0;
            
          }
      }
  }
  console.log(hofstaderMasculino(1238)); // 619



  function factorial( n:number):number {
    
      switch(n){
          case 0:
              return 1;
          case 0:
              return -100; 
          default:
              return n * factorial(n - 1); 
             
      }
  }
  console.log(factorial(13)); //6227020800


  function potencia( base:number,  exp:number):number {
  
      switch(exp){
          case 0:
              return 1;
          case 0:
              return -100; 
          default:
              return (base * potencia(base, exp - 1));
             
      }
  }    
console.log(potencia(30,5)); //24300000
    `
    }

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

