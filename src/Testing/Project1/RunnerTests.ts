
//TODO que las corra todas automaticamente, y que ponga si las paso o no

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

//TODO:
//BUG: left value se iba a imponer sobre el rvalue y eso causa comportamientos
//     bien raros
{
    type A ={
        att:string;
    }

    type B ={
        att:string;
    }

    let a:A = { att:"Hello"}
    let b:B = a;

    graficar_ts();//el tipo de a es B :(
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
    //as of 21/09 we pass with 54/54 and +20/20 extras
    {
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
    }
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
    //FAILS at: ackerman(3,8). Pero el de la calificacion es ackerman(3,7)
    //FAILS at: hofstaderMasculino(1238);. it fails it as early as 500. Pero no esta en la calificacion
    //PASSES: everything else
    //Be mindful that we havent compiled in -O3 or whatever (honestly I dont know if it is even possible);
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
      } else if (m > 0 AND n == 0) {
           let cuatro:number = ackermann(m - 1, 1);
          return cuatro;
      } else {
          let ret:number =  ackermann(m, n - 1);
          let  nueva:number = ackermann(m - 1, ret);
          return nueva;
      }
  
}
console.log(ackermann(3,7)); 
//FAILS THIS ONE:
//console.log(ackermann(3,8));//2045 se tardo 6 segundos


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

  console.log(hofstaderMasculino(400));//starts failling at 500
  //FAILS THIS ONE
  //console.log(hofstaderMasculino(1238)); // 619



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

    //Ordenamiento.ts
    //PASS 100%
    {

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
        let ret = \`\${root.value}\n\`;
        let tmp = getDot(root.left);
        if (tmp != null) {
            ret = ret + \`\${root.value} -> \${tmp}\`;
        }
        tmp = getDot(root.right);
        if (tmp != null) {
            ret = ret + \`\${root.value} -> \${tmp}\`;
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

    //avl.ts without template strings
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

    //TODO: template String
    {
    let testString = `
let a = 10;
let b = 30;
console.log(\`a + b = \${a + b}\`);
    `;
    }

    //matriz.ts
    //PASS 100%
    {
    let testString = `
    let matrixA : number [][] = [];
    let matrixB : number [][] = [];
    let matrixR : number [][] = [];
    const min = 0;
    const max = 4;
    
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