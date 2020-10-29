//TODO (eventually): ordenar y tratar de separar en diferentes archivos

import { RuntimeInterface, TsEntry } from "../app/app.component";
import { Env, JumperSet } from "./Environment";
import { Variable } from "./Variable";
import { Global_c_ir } from "./Global_c_ir";
import { Native_c_ir } from "./Native_c_ir";

import { Statement, StatementKind, WhileStatement } from "../Ast/Statement";

import { MyType, MyTypeKind, TypeSignature } from "./MyType";
import { MyError, MyErrorKind } from './MyError';
import { StringLiteralByte } from './StringLiteralByte';

import { Expression, ExpressionKind, LiteralExpression, StringLiteral,
         IdentifierExpression, BinaryExpression, UnaryExpression, MemberAccessExpression,
         FunctionCallExpression } from '../Ast/Expression';
import { Declaration,  UnprocessedDeclData, ProcessedDeclData } from '../Ast/Declaration';
import { MyTypeNode, MyTypeNodeKind } from 'src/Ast/MyTypeNode';
import { GlobalInstructions } from 'src/Ast/GlobalInstructions';
import { TypeDef } from "../Ast/TypeDef";
import { FunctionDef } from "../Ast/FunctionDef";
import { ExprResult } from "./ExprResult"
import { LValueResult } from "./LValueResult"
import { ArithOp, Assignment, _3AddrAssignment, Cond_goto, 
         C_ir_instruction, c_ir_instructions_toString, Goto, 
         Label, LabelDeclaration, RelOp, Mem, FunctionCall, FuncOpening, FuncClose } from './C_ir_instruction';
import { AccessKind, FunctionAccess } from 'src/Ast/MemberAccess';

//TODO: agregar un comentario con el c_ir deseado en todos 
//      los lugares en los que generamos c_ir

//SOME GENERAL NOTES:
//statements dont need their caller to pass a list of owedTemps because
//they dont use temps at all?

let runtimeInterface:RuntimeInterface;

export function graficar_ts(){
    console.log(Env.current);

    let iter = Env.current;
    let count = 0;

    //type signatures
    for (const key in Env.typeSignatures) {
        let typeSignature = Env.typeSignatures[key];
        runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, "-", typeSignature.getName()));
    }

    while(iter != null){
        //Function signatures
        for (const key in iter.myFunctions) {
            let funcSignature = iter.myFunctions[key];
            runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, funcSignature.getTypeString(), "-"));
        }
        //Variables:
        for (const key in iter.myVariables) {
            let variable = iter.myVariables[key];
            //@FIXME
            //runtimeInterface.tsDataSet.push(new TsEntry("top-"+count.toString(), key, variable.myType.getName(), variable.myObj.toPrintableString()));
        }
        iter = iter.previous;
        count++;
    }
}

export function resetRuntimeInterface(){
    runtimeInterface.tsDataSet = [];
    runtimeInterface.errorDataSet = [];
    runtimeInterface.intermediateRepresentation = "";
}

//Contiene todos los string literals encontrados en el source code
//Cuando terminemos de generar el c_ir del source code
//generamos c_ir que meta todo este array en el heap, teniendo encuenta
//que cuando terminemos de meterlo tenemos que dejar el heap pointer en 
//la primera posicion vacia
export let stringLiteralsBuffer:StringLiteralByte[] = [];

//Tienen el ultimo temp que fue utilizado
//Si estan en 0 es porque no se utilizo ningun temp o label
export let tempCount = 0;
export let labelCount = 0;

function getNextTemp():String{
    tempCount += 1;
    if(tempCount === 26){
        console.log("lol");
    }
    return new String("T" + tempCount);
}

function getNextLabel():String{
    labelCount += 1;
    return new String("L" + labelCount);
}

//MEJORA?: escribir porque son const string 
//kinda similar to special purpose regs is x86

//pointer the beggining of the current stackframe
export const P_REG:String = new String("p");
//pointer the fist free position in the heap
export const H_REG:String = new String("h");

function construct_c_ir_header_and_funcs(funcs_c_ir:C_ir_instruction[]):string{
    //El primer numero entero que un IEEE754 no puede 
    //representar exactamente: https://stackoverflow.com/questions/3793838/which-is-the-first-integer-that-an-ieee-754-float-is-incapable-of-representing-e
    //For float, 16,777,217 (2^24 + 1).        
    //For double, 9,007,199,254,740,993 (2^53 + 1).
    let header = `#include <stdio.h> 
//TODO: Ver que tamano de stack es mejor (deberia ser mucho mas pequenno que el heap)
double heap[0xfffff];
double stack[0xfffff];
double p = 0;
double h = 0;
`;

    let temps = "";
    //temps.reverse(tempcount * algo que te diga el numero de caracteres por tep)
    //TERRIBLE PERF: si se hace un malloc cada 
    //               concatenacion de string y no hacemos el reserve
    for(let i = 1; i <= tempCount; i++){
        temps += "T" + i.toString() + ", ";
    }
    //Quitamos la ultima coma
    if(temps.length > 2){
        temps = "double " + temps.slice(0, temps.length - 2) + ';\n';
    }
    temps += Native_c_ir.nativeTemps;

    header += temps;

    header += Native_c_ir.funcDefs;

    header += c_ir_instructions_toString(funcs_c_ir);   

    header += `\n\nint main(){\n`;

    header += '//We allocate all the string literals:\n' +
               '//Native string literals:' + 
               Native_c_ir.stringLitsInitialization;

    header += "//Non native string literals:\n";
    for(let i = 0; i < stringLiteralsBuffer.length; i++){
        let stringLitByte = stringLiteralsBuffer[i];
        //TODO?: pad the number string with 0s so its easier to read?
        let charRepresentation = (stringLitByte.isSize ? 'size' : String.fromCharCode(stringLitByte.val));
        //[!]we need to add the number of bytes used for native string literals here:
        //TODO: que los caracteres de escape los imprima en la forma \n y, una vez hecho eso
        //      cambiar a que sea un commentario de una linea estilo: //coment
        header += `heap[${i + Native_c_ir.stringLitsSize}] = ${stringLitByte.val};/*'${charRepresentation}'*/\n`
    }
    //we place the heap pointer in the first available position
    header += `h = ${stringLiteralsBuffer.length + Native_c_ir.stringLitsSize};\n\n`

    return header;
}

function construct_c_ir_foot():string{
    let foot = "";//cerramos el main

    //DEBUG: para debuggear facilmente las expresiones imprimimos el valor
    //       del ultimo temporal
    //       Si es T0 nuesto c_ir no compila
    foot += "\n";
    foot += `printf("%f\\n", T${tempCount});\n`;

    foot += "\nreturn 0;\n}";

    return foot;
}

export function compile(root:GlobalInstructions, _runtimeInterface:RuntimeInterface):void{

    //varciar todas las 'interfaces' necesarias de runtimeInterface
    runtimeInterface = _runtimeInterface;
    resetRuntimeInterface();

    Env.initEnvironment();

    //resetear el conteo de temps y labels
    tempCount = 0;
    labelCount = 0;

    //resetear todos los stringLiterals
    stringLiteralsBuffer = [];

    let global_c_ir = compileGlobalInstructions(root);

    runtimeInterface.intermediateRepresentation = construct_c_ir_header_and_funcs(global_c_ir.funcs_c_ir);
    runtimeInterface.intermediateRepresentation += c_ir_instructions_toString(global_c_ir.statements_c_ir);
    runtimeInterface.intermediateRepresentation += construct_c_ir_foot();
}

export function compileGlobalInstructions(globalInstructions:GlobalInstructions):Global_c_ir{

    let funcs_c_ir:C_ir_instruction[] = new Array();
    let statements_c_ir:C_ir_instruction[] = new Array();

    compileTypeDefs(globalInstructions.typeDefs);

    //Para que las funciones puedan acceder a las variable globales debemos 
    //reserva el espacio de dichas variables antes de generar el codigo
    //intermedio de las funciones.
    //Sin embargo no podemos asegurar que la declaracion de una variable
    //este antes en el codigo que la definicion de una funcion que la use
    //Por eso debemos hacer una pasada solo para reservar el espacio de todas las variables
    //globales
    declarationsPrepass(globalInstructions.statements);

    funcs_c_ir = compileFunctionDefs(globalInstructions.functionDefs, 0);

    statements_c_ir = compileStatements(globalInstructions.statements);

    return new Global_c_ir(funcs_c_ir, statements_c_ir);
}

export function compileTypeDefs(typeDefs:TypeDef[]){
    for (const typeDef of typeDefs) {
        try {
            compileTypeDef(typeDef);
        } catch (error) {
            if(error instanceof MyError){
                console.log(error);
                runtimeInterface.errorDataSet.push(error);
            }
            else{
                throw error;
            }
        }
    }
    //revisamos si quedo algun tipo sin definir
    for (const key in Env.typeSignatures) {
        let myType = Env.typeSignatures[key]
        if(myType.kind === MyTypeKind.WAITING){
            let myError = new MyError(`No se encontro definicion para el tipo: '${key}'. Se definira con {} para continuar la ejecucion`);
            //This error doesnt have a location
            console.log(myError);
            runtimeInterface.errorDataSet.push(myError);
            myType.kind = MyTypeKind.CUSTOM;
            myType.specification = new TypeSignature(key);
        }
            
    }
}

//MEJORA: desde el parser hacer una lista de declaraciones
//        para que aqui no tengamos que ir por todos los 
//        statements
//[!] puede remover elementos de la lista statements
//    cambia los el .myType de cada elemento
export function declarationsPrepass(statements:Statement[]):void{

    //Vamos a quitar los statements con errores que implican que no
    //se puede hacer el reservado de espacio

    //Vamos a usar un array auxiliar para ir quitando los nodos que tengan error
    //MEJORA: reserve
    let tempStatements:Statement[] = new Array();

    for (const stmt of statements) {
        if(stmt.statementKind !== StatementKind.DeclarationKind){
            continue;
        }

        let decl = stmt.child as Declaration;
        let unprocessedDeclData = decl.data as UnprocessedDeclData;

        //we check that if it has const modifier it cant have .expr set to null
        if(unprocessedDeclData.isConst){
            //reportamos el error
            //MEJORA: better error message and better error kind
            let myError = MyError.makeMyError(MyErrorKind.TYPE_ERROR, "Variables const deben ser inicializadas");
            myError.setLocation(stmt.astNode);
            console.log(myError);
            runtimeInterface.errorDataSet.push(myError);
            continue;
        }

        //We check errors
        let myType:MyType;

        try{
            myType = compileTypeNode(unprocessedDeclData.myTypeNode);
        }catch(myError){
            if (myError instanceof MyError){
                //reportamos el error
                myError.setLocation(stmt.astNode);
                console.log(myError);
                runtimeInterface.errorDataSet.push(myError);
                continue;
            }
            throw myError;
        }

        //Revisamos que no exista otra var con el mismo nombre
        let variable:Variable;
        try{
            variable = Env.reserveVariable(unprocessedDeclData.identifier, unprocessedDeclData.isConst, myType);
        }catch(myError){
            if (myError instanceof MyError){
                //reportamos el error
                myError.setLocation(stmt.astNode);
                console.log(myError);
                runtimeInterface.errorDataSet.push(myError);
                continue;
            }
            throw myError;
        }

        //si no hubo erorres cambiamos el .data de decl
        //ese stmt en el nuevo array
        decl.data = new ProcessedDeclData(variable);
        tempStatements.push(stmt);
    }

}

export function compileFunctionDefs(functionDefs:FunctionDef[], nestingDepth:number):C_ir_instruction[]{
    let c_ir = new Array<C_ir_instruction>()
    for (const functionDef of functionDefs) {
        try {
            c_ir = c_ir.concat(compileFunctionDef(functionDef, nestingDepth));
        } catch (error) {
            if(error instanceof MyError){
                console.log(error);
                runtimeInterface.errorDataSet.push(error);
            }
            else{
                throw error;
            }
        }
    }
    return c_ir;
}

export function compileFunctionDef(functionDefNode:FunctionDef, nestingDepth:number):C_ir_instruction[]{
    let name = functionDefNode.name;
    //MEJORA: reserve a paramTypes

    //REVISAR QUE LA SIGNATURE SEA VALIDA: nombre unico, tipos validos, paramNames no repetidos
    let paramNames:string[] = new Array();
    let paramTypes:MyType[] = new Array();
    let returnType:MyType;
    for (const paramNode of functionDefNode.params) {
        try{
            paramTypes.push(compileTypeNode(paramNode.myTypeNode));
        }catch(error){
            if(!(error instanceof MyError)){
                throw error;
            }
            let myError = MyError.makeMyError(
                MyErrorKind.DEFINITION, 
                `No se puede definir la funcion:${name} porque el parametro: ${paramNode.name} no tiene un tipo valido`
            );
            console.log(myError);
            runtimeInterface.errorDataSet.push(myError);
            return [];
        }

        //MEJORA: esto es O^2 revisar si hay una mejor forma de buscar repetidos
        //        en un arreglo desordenado
        //revisamos que no vengan nombre repetidos
        for(const paramName of paramNames){
            if(paramNode.name === paramName){
                let myError = MyError.makeMyError(
                    MyErrorKind.DEFINITION, 
                    `No se puede definir la funcion:${name} porque tiene dos o mas parametros con el nombre: ${paramNode.name}`
                );
                console.log(myError);
                runtimeInterface.errorDataSet.push(myError);
                return [];
            }
        }
        paramNames.push(paramNode.name);
    }
    //return type
    try{
        returnType = functionDefNode.returnType === null ? MyType.VOID : compileTypeNode(functionDefNode.returnType);
    }catch(error){
        if(!(error instanceof MyError)){
            throw error;
        }
        let myError = MyError.makeMyError(
            MyErrorKind.DEFINITION, 
            `No se puede definir la funcion:${name} tipo de retorno no valido`,
        );
        myError.setLocation(functionDefNode.astNode);
        console.log(myError);
        runtimeInterface.errorDataSet.push(myError);
        return [];
    }

    //METERLA LA FUNCSIGNATURE EN LA TABLA DE SIMBOLOS
    let c_irFuncName:string;
    try{
        c_irFuncName = Env.addFuncSignature(nestingDepth, name, paramTypes, returnType);
    }catch(error){
        if(!(error instanceof MyError)){
            throw error;
        }
        //error ya trae mensaje, por eso solo necesitamos hacer el setLocation
        error.setLocation(functionDefNode.astNode);
        console.log(error);
        runtimeInterface.errorDataSet.push(error);
        return [];
    }

    //PONER OTRO FUNC SCOPE
    let returnLabel = new Label(getNextLabel());
    Env.pushFuncScope(functionDefNode.name, nestingDepth, returnType, returnLabel);

    //METER LOS PARAMETROS EN LA TABLA DE SIMBOLOS
    //RECORDAR: todos los tipos en nuestro lenguaje tienen tamanno 1 o son punteros
    //reservamos el espacio de parametros para los stackframe pointers
    //de todos us ancestros
    Env.current.size += nestingDepth;
    //BADish perf: recorremos 2 veces los parametros
    //reservamos el espacio de los argumentos
    for (let i = 0; i < paramNames.length; i++) {
        //@Volatile @addVariable once we know its symbolo in myVariables is undefined
        let varOffset = Env.current.size
        Env.current.myVariables[paramNames[i]] = new Variable(false, false, paramTypes[i], varOffset);
        Env.current.size += 1;
    }
    //reservamos espacio para el return Y lo ponemos en la tabla de simbolos tambien!
    if(returnType.kind !== MyTypeKind.VOID){
        let varOffset = Env.current.size
        //MEJORA: "@return is a hard code constant!"
        //MEJORA!: honestly @return is not a real variable and it doesnt make sence for it to be in
        //         in the variableTable, its also quite to search for it in the hash table as well!
        //the isConst and isUndeclared are completely invalid here, we only save the
        //@return "variable" to easily know its offset when we are generating the c_ir for the
        //         instruction
        Env.current.myVariables["@return"] = new Variable(false, false, returnType, varOffset);
        Env.current.size += 1;
    }
    
    //prepass de declaracion. 
    declarationsPrepass(functionDefNode.statements);
    //luego compilamos sus otras funciones 
    let nestedFuncs_c_ir = compileFunctionDefs(functionDefNode.functionDefs, nestingDepth + 1);
    //Luego compilamos sus statements
    let statements_c_ir = compileStatements(functionDefNode.statements);

    Env.popScope();//pop al scope de la funcion

    //retornamos todo el c_ir_concatenado
    let c_ir = new Array<C_ir_instruction>();
    return c_ir.concat(
       [new FuncOpening(c_irFuncName)],
        statements_c_ir,
       [new LabelDeclaration(returnLabel),
        new FuncClose()],
        nestedFuncs_c_ir,
    )
}

export function compileTypeDef(typeDef:TypeDef){
    throw new Error("Not implemented yet!");
}

export function compileStatements(statements:Statement[]):C_ir_instruction[]{
    let c_ir = new Array<C_ir_instruction>();
    //MEJORA: reserve a statements_c_ir (no se como hacer eso en typescript, talvez no sea posible)
    for (const statement of statements) {
        let result = compileStatement(statement);
        c_ir = c_ir.concat(result);
    }
    return c_ir;
}

//MEDIO CHAPUZ
//retorna empty c_ir_instruction si occurio un error
export function compileStatement(statement:Statement):C_ir_instruction[]{

    try {
        let child = statement.child;

        switch (statement.statementKind) {
            case StatementKind.ExpressionKind:
                return compileExpression(child as Expression, []).c_ir;

            case StatementKind.DeclarationKind:
                return compileDeclaration(child as Declaration);

            case StatementKind.WhileKind:
                return compileWhile(child as WhileStatement);

            default:
                throw new Error(`runStatment no implementado para myTypeNode: ${statement.statementKind}`);
        }
    } catch (myError) {
        if(myError instanceof MyError){
            if(myError.isLocationNull()){
                myError.setLocation(statement.astNode);
            }
            console.log(myError);
            runtimeInterface.errorDataSet.push(myError);
            return [];
        }else{
            throw myError;
        }
    }

}

//TODO: documentar bien (aun que sea en un video o algo) funciona
//      el owed temps
//TODO: mejorar el flujo. tiramos exactamente el mismo como 12 veces hay que ver como
//      converger en un mismo punto en caso de existir error
export function compileExpression(expr:Expression, owedTemps:String[]):ExprResult{

    try{
        return compileExpressionImp(expr);
    }catch(myError){
        if(myError instanceof MyError){
            myError.setLocation(expr.astNode);
        }
        throw myError;
    }

    function compileExpressionImp(exp:Expression):ExprResult{

        if(expr.specification instanceof BinaryExpression){

            //Casos especiales de binary expression
            if(expr.expressionKind === ExpressionKind.ASSIGNMENT){
                let lvalue = compileLValue(expr.specification.left, owedTemps);
                let newOwedTemps = owedTemps.concat(lvalue.addr);
                let rvalue = compileExpression(expr.specification.right, newOwedTemps);

                //check types:
                if(!MyType.compareTypes(lvalue.myType, rvalue.myType)){
                    throw MyError.makeMyError(
                        MyErrorKind.TYPE_ERROR, 
                        `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${lvalue.myType.getName()} y '${rvalue.myType.getName()}'`
                    );
                }

                let temp = getNextTemp();

                let c_ir:C_ir_instruction[] = new Array();

                //generamos el mem access (depende de si el lvalue esta en el stack o el heap)
                let mem:Mem;
                if(lvalue.isInStack){
                    mem = Mem.stackAccess(lvalue.addr);
                }
                else{
                    mem = Mem.heapAccess(lvalue.addr);
                }
                
                c_ir = c_ir.concat(
                    lvalue.c_ir, 
                    rvalue.c_ir,
                   [new Assignment(mem, rvalue.val)]
                );

                return new ExprResult(lvalue.myType, false, temp, c_ir);
            }
            

            //De este punto en adelante siempre vamos compilar ambos lados
            //de la expression de la misma manera
            let leftResult = compileExpression(expr.specification.left, owedTemps);
            //We dont need to add to owedTemps if leftResult is immediate or null
            let newOwedTemps:String[];
            if(leftResult.val instanceof String){
                newOwedTemps = owedTemps.concat(leftResult.val);
            }
            else{
                newOwedTemps = owedTemps;
            }
            let rightResult = compileExpression(expr.specification.right, newOwedTemps);

            switch (expr.expressionKind) {
                case ExpressionKind.ADDITION:
                {
                    //revisamos errores de tipos:
                    //String type can be added to anything but CUSTOM
                    if((leftResult.myType.kind === MyTypeKind.STRING ||
                       rightResult.myType.kind === MyTypeKind.STRING) && 
                       (leftResult.myType.kind !== MyTypeKind.CUSTOM &&
                       rightResult.myType.kind !== MyTypeKind.CUSTOM)
                    ){
                        throw new Error("implementacion de suma con strings no implementado todavia!");
                    }
                    //se pueden operar booleans con numbers
                    else if((leftResult.myType.kind === MyTypeKind.NUMBER  && rightResult.myType.kind === MyTypeKind.NUMBER) ||
                            (leftResult.myType.kind === MyTypeKind.BOOLEAN  && rightResult.myType.kind === MyTypeKind.NUMBER) ||
                            (leftResult.myType.kind === MyTypeKind.NUMBER  && rightResult.myType.kind === MyTypeKind.BOOLEAN)){

                        return generateSimpleArithExprResult(leftResult.c_ir, leftResult.val, ArithOp.ADDITION, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }

                }break;
                case ExpressionKind.SUBSTRACTION:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateSimpleArithExprResult(leftResult.c_ir, leftResult.val, ArithOp.SUBSTRACTION, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.MULTIPLICATION:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateSimpleArithExprResult(leftResult.c_ir, leftResult.val, ArithOp.MULTIPLICATION, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.MODULUS:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateSimpleArithExprResult(leftResult.c_ir, leftResult.val, ArithOp.MODULUS, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.DIVISION:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateSimpleArithExprResult(leftResult.c_ir, leftResult.val, ArithOp.DIVISION, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;

                case ExpressionKind.POWER:
                {
                    throw new Error(`operacion binaria: ${expr.expressionKind} no implementada todavia`);
                }break;

                //LOGICAS
                case ExpressionKind.AND:
                {
                    if(leftResult.myType.kind === MyTypeKind.BOOLEAN  &&
                            rightResult.myType.kind === MyTypeKind.BOOLEAN){

                        return generateAndExprResult(leftResult.c_ir, leftResult.val, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
        
                }break;
                case ExpressionKind.OR:
                {
                    if(leftResult.myType.kind === MyTypeKind.BOOLEAN  &&
                            rightResult.myType.kind === MyTypeKind.BOOLEAN){

                        return generateOrExprResult(leftResult.c_ir, leftResult.val, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;

                //COMPARACION:
                case ExpressionKind.LESS:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateComparisonExprResult(leftResult.c_ir, leftResult.val, RelOp.LESS, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.GREATER:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateComparisonExprResult(leftResult.c_ir, leftResult.val, RelOp.GREATER, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.LESS_OR_EQUAL:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateComparisonExprResult(leftResult.c_ir, leftResult.val, RelOp.LESS_OR_EQUAL, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.GREATER_OR_EQUAL:
                {
                    if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

                        return generateComparisonExprResult(leftResult.c_ir, leftResult.val, RelOp.GREATER_OR_EQUAL, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.EQUAL_EQUAL:
                {
                    if(leftResult.myType.kind !== MyTypeKind.VOID  &&
                            rightResult.myType.kind !== MyTypeKind.VOID){

                        return generateComparisonExprResult(leftResult.c_ir, leftResult.val, RelOp.EQUAL_EQUAL, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.NOT_EQUAL:
                {
                    if(leftResult.myType.kind !== MyTypeKind.VOID  &&
                            rightResult.myType.kind !== MyTypeKind.VOID){

                        return generateComparisonExprResult(leftResult.c_ir, leftResult.val, RelOp.NOT_EQUAL, rightResult.c_ir, rightResult.val);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con los tipos: '${leftResult.myType.getName()} y '${rightResult.myType.getName()}'`);
                    }
                }break;

                default:
                    throw new Error(`operacion binaria: ${expr.expressionKind} no implementada todavia`);
            }
        }
        else if(expr.specification instanceof UnaryExpression){
            let unaryExpr = expr.specification as UnaryExpression;
            let operand = compileExpression(unaryExpr.expr, owedTemps);
            let operandType = operand.myType;

            //At this point we know that expr.kind must be UNARY_MINUS, NEGATION, POSTFIX_INC, POSTFIX_DEC
            switch(expr.expressionKind){
                case ExpressionKind.UNARY_MINUS:
                {
                    throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                    if(operandType.kind === MyTypeKind.NUMBER){
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, `Operador '${expr.expressionKind}' no acepta los tipos: '${operandType.kind}'`);
                    }
                }break;
                case ExpressionKind.NOT:
                {
                    if(operand.myType.kind === MyTypeKind.BOOLEAN){
                        let temp = getNextTemp();

                        let false_label = new Label(getNextLabel());
                        let end_label = new Label(getNextLabel());

                        let c_ir = new Array();
                        /*
                            ...operand.c_ir...
                            if (operand.val == 1) goto L1;
                            T1 = 1;
                            goto END;
                            L1:
                            T1=0;
                            END:
                        */
                        c_ir = c_ir.concat(
                            operand.c_ir,
                           [new Cond_goto(operand.val, RelOp.EQUAL_EQUAL, new Number(1), false_label),
                            new Assignment(temp, new Number(1)),
                            new Goto(end_label),
                            new LabelDeclaration(false_label),
                            new Assignment(temp, new Number(0)),
                            new LabelDeclaration(end_label)]
                        )
                        return new ExprResult(MyType.BOOLEAN, false, temp, c_ir);
                    }
                    else{
                        throw MyError.makeMyError(MyErrorKind.TYPE_ERROR, 
                                          `No se puede realizar la operacion: '${expr.expressionKind}' con el tipo: '${operand.myType.getName()}'`);
                    }
                }break;
                case ExpressionKind.POSTFIX_INC:
                    throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                    break;
                case ExpressionKind.POSTFIX_DEC:
                    throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                    break;
            }
        }

        //If we reach this point in the code it means that the expression must
        //be atomic or ternary, which means that for each possible expr.expressionKind
        //there is a different type for expr.specification. 
        switch (expr.expressionKind) {
            case ExpressionKind.FUNCTION_CALL:
            {
                //TODO: put this whole thing in a function. 
                let funcCall = expr.specification as FunctionCallExpression;

                //tira myError si no existe ese nombre
                let calleeSignature = Env.getFunction(funcCall.name);
                if(calleeSignature === null){
                    throw new MyError(`No existe una funcion con el nombre: ${funcCall.name}  en el entorno actual`);
                }

                //revisiones que podemos hacer de antemano
                if(funcCall.functionArgs.length !== calleeSignature.params.length){
                    throw new MyError(`Numero de argumentos incorrecto: se esperaban '${calleeSignature.params.length} y se tienen '${funcCall.functionArgs.length}'`);
                }

                //conseguimos el nestingDepth de caller para ver si tenemos que pasarle caller.stackFrame (current p)
                //a callee Y para hacer el assert
                //The .getCurrentDepth asserts that we are inside a function
                //tenemos que recorrer el stack de scopes de manera no necesaria
                let callerDepth:number = Env.getCallerNestingDepth();
                // ASSERT THAT A FUNC (caller) CAN ONLY CALL A FUNCS (callee) WITH NESTING DEPTH LESS THAN caller.nestingDepth + 1
                // ie: calleeDepth <= callerDepth + 1
                if(!(calleeSignature.nestingDepth <= callerDepth + 1)){
                    //TODO: better error message
                    throw new Error("ASSERTION THAT A FUNC (caller) CAN ONLY CALL A FUNCS (callee) WITH NESTING DEPTH LESS THAN caller.nestingDepth + 1 FAILED");
                }

                let c_ir = new Array<C_ir_instruction>();

                //TERMINOLOGY:Display means something very similar to what the dragon book describes in section 7.3.8

                //back up temps (need a Tm to find the first free space in the stack)
                //cambio simulado de p: Tn = p + Env.current.size + #ofBackedUpTemps [???Do we need to back up Tn AND Tm from now on? emmm... yeah]
                //push the 'display' the ancestor stackframes
                //compile and push the args (doing typechecking)
                //do the p change for realz this time
                //call
                //RECOVER THE RETURNED VALUE Tx = stack[new_p + display.length + params.length]
                //restore backedup temps 
                //restor p: p = p - Env.current.size + #ofBackedUpTemps 

                // if anything here throws a myError because, even tho we wont finish doing the c_ir, 
                // that incomplete c_ir wont be added to the finished result

                //conseguimos la primera p a donde podamos hacer el backup sin sobreescribir las var locales
                let beginingOfTempBackUp = getNextTemp();//CHAPUZ: lo generamos aunque no tengamos nada en owedTemps porque hace el backUp mas adelante mas sencillo
                if(owedTemps.length > 0){
                    let backedTempIndex = getNextTemp();//The same reg for all owedTemp, different val foreach owedTemp
                    c_ir = c_ir.concat(
                    [new _3AddrAssignment(beginingOfTempBackUp, P_REG, ArithOp.ADDITION, new Number(Env.current.size))]
                    );
                    for (let i = 0; i < owedTemps.length; i++) {
                        //pusheamos cada owedTemp en el stack
                        c_ir = c_ir.concat(
                        [new _3AddrAssignment(backedTempIndex, P_REG, ArithOp.ADDITION, new Number(i)),
                            new Assignment(Mem.stackAccess(backedTempIndex), owedTemps[i])]
                        );
                    } 
                }

                //Cambio simulado de p (stupid name)
                let nextStackFrameBegining = getNextTemp();
                c_ir = c_ir.concat(
                   [new _3AddrAssignment(nextStackFrameBegining, P_REG, ArithOp.ADDITION, new Number(Env.current.size + owedTemps.length))]
                );

                //push the ancestor stack
                let callerDisplayIndex = getNextTemp();
                let calleeDisplayIndex = getNextTemp();
                //el for va hasta (calleeNestingDepth - 1) porque la ultima posicion del display
                //Puede o no ser el stackFrame de la funcion actual
                if(callerDepth !== -1){//si caller es global (nestingDepth=-1) tenemos que dejar un display vacio
                    for (let i = 0; i < calleeSignature.nestingDepth - 1; i++) {
                        //NEEDS A LOT OF WORK! IS NOT REALLY CORRECT. CHECK THE NOTEBOOK.
                        //IM CONFUSED AND TIRED 
                        c_ir = c_ir.concat(
                           [new _3AddrAssignment(calleeDisplayIndex, nextStackFrameBegining, ArithOp.ADDITION, new Number(i)),
                            new _3AddrAssignment(callerDisplayIndex, P_REG, ArithOp.ADDITION, new Number(i)),
                            new Assignment(Mem.stackAccess(calleeDisplayIndex), Mem.stackAccess(callerDisplayIndex))]
                        );
                    }
                    if(calleeSignature.nestingDepth === callerDepth + 1){
                        c_ir = c_ir.concat(
                            //(calleeSignature.nestingDepth - 1) = la ultima posion del display
                        [new _3AddrAssignment(calleeDisplayIndex, nextStackFrameBegining, ArithOp.ADDITION, new Number(calleeSignature.nestingDepth - 1)),
                            new Assignment(Mem.stackAccess(calleeDisplayIndex), P_REG)]
                        );
                    }
                    else{
                        c_ir = c_ir.concat(
                            //(calleeSignature.nestingDepth - 1) = la ultima posion del display
                        [new _3AddrAssignment(calleeDisplayIndex, nextStackFrameBegining, ArithOp.ADDITION, new Number(calleeSignature.nestingDepth - 1)),
                            new _3AddrAssignment(callerDisplayIndex, P_REG, ArithOp.ADDITION, new Number(calleeSignature.nestingDepth - 1)),
                            new Assignment(Mem.stackAccess(calleeDisplayIndex), Mem.stackAccess(callerDisplayIndex))]
                        );
                    }
                }

                //compile and push the args (doing typechecking)
                let argOwedTemps = [nextStackFrameBegining, beginingOfTempBackUp];
                let funcArgs = funcCall.functionArgs;
                let argIndex = getNextTemp();
                for (let i = 0; i < funcArgs.length; i++) {
                    //its ok if this throws an exception, beacause, the c_ir in this function is no longer valid. it
                    //will not be add to the global c_ir so we are OK
                    let argResult = compileExpression(funcArgs[i], argOwedTemps);
                    if(!MyType.compareTypes(calleeSignature.params[i], argResult.myType)){
                        throw new MyError(`Argumento numero ${i} no es un tipo compatible. se esperaba: ${calleeSignature.params[i].getName()}. y se obtuvo: ${argResult.myType.getName()}`);
                    }
                    c_ir = c_ir.concat(
                        //(calleeSignature.nestingDepth - 1) = la ultima posion del display
                       [new _3AddrAssignment(argIndex, nextStackFrameBegining, ArithOp.ADDITION, new Number(calleeSignature.nestingDepth + i)),
                        new Assignment(Mem.stackAccess(argIndex), argResult.val)]
                    );
                }

                //do the stackFrame switch AND the call. FINALLYYY!
                c_ir = c_ir.concat(
                   [new Assignment(P_REG, nextStackFrameBegining),
                    new FunctionCall(calleeSignature.realName),
                    new _3AddrAssignment(P_REG, P_REG, ArithOp.SUBSTRACTION, new Number(Env.current.size - owedTemps.length))]
                );  

                //put the backedup regs back
                
                //pick up the return value (if any) and return the exprResult
                let returnTemp:(String | null);
                if(calleeSignature.returnType.kind !== MyTypeKind.VOID){
                    let returnIndex = getNextTemp();
                    returnTemp = getNextTemp();
                    c_ir = c_ir.concat(
                       [new _3AddrAssignment(returnIndex, nextStackFrameBegining, ArithOp.ADDITION, new Number(calleeSignature.nestingDepth + funcArgs.length)),
                        new Assignment(returnTemp, Mem.stackAccess(returnIndex))]
                    )
                }
                else{
                    returnTemp = null;
                }

                return new ExprResult(calleeSignature.returnType, false, returnTemp, c_ir);

            }break;
            case ExpressionKind.IDENTIFIER:
            {
                //conseguir la variable de la tabla de simbolos y tener en cuenta el isGlobal
                let identExp = expr.specification as IdentifierExpression;
                //debug
                if(identExp.name === "s"){
                    console.log("lol");
                }
                //We get the value from the symbol table
                let getVarResult = Env.getVariable(identExp.name);
                if(getVarResult === null){
                    throw new MyError(`No existe una variable con el nombre: '${identExp.name}' en este entorno`);
                }
                if(getVarResult.variable.isUndeclared === true){
                    throw new MyError(`La varialbe: '${identExp.name}' no esta inicializada`);
                }
                //FIXME: 
                //TODO: Cuando tengamos funciones anidadas para a tener que hacer un caso especial para las variables 
                //      que estan definidas en alguna funcion ancestro
                let isGlobal = getVarResult.isGlobal;
                let variable = getVarResult.variable;

                //Generamos c_ir diferente dependiendo de si es global
                //local
                if(isGlobal){

                    let temp = getNextTemp();
                    let globalAccess = Mem.stackAccess(variable.offset);
                    let c_ir:C_ir_instruction[] = [
                        new Assignment(temp, globalAccess)
                    ]

                    return new ExprResult(variable.myType, false, temp, c_ir);
                }
                else{
                    let temp = getNextTemp();
                    let stackFrameAcessTemp = getNextTemp();//p+offset
                    let globalAccess = Mem.stackAccess(stackFrameAcessTemp);
                    let c_ir:C_ir_instruction[] = [
                        new _3AddrAssignment(stackFrameAcessTemp, P_REG, ArithOp.ADDITION, variable.offset),
                        new Assignment(temp, globalAccess)
                    ];

                    return new ExprResult(variable.myType, false, temp, c_ir);
                }
            }break;
            //The way we traverse member access is kinda weird because the way the AST is shaped
            //but we wont bother to describe it in a comment :/
            case ExpressionKind.MEMBER_ACCESS:
            {
                let memAccessExpr = expr.specification as MemberAccessExpression;

                let exprResult = compileExpression(memAccessExpr.expression, owedTemps);

                switch (memAccessExpr.memberAccess.accessKind) {
                    case AccessKind.AttributeAccess:
                    {
                        throw new Error("Attribute access no implementado todavia");
                    }break;

                    case AccessKind.FunctionAccess:
                    {
                        switch(exprResult.myType.kind){
                            //Si los CUSTOM pudieran tener funcs definidas por el programador o
                            //el programador pudiera agregar mas funciones a los tipos nativos
                            //Esto no funcionaria, tendriamos que ponera las funciones asociadas con cada
                            //tipo en la tabla de simbolos
                            case MyTypeKind.MY_CONSOLE:
                            {
                                let funcAccess = memAccessExpr.memberAccess.access as FunctionAccess;

                                if(funcAccess.functionName === "log"){
                                    if(funcAccess.functionArguments.length === 1){                                            
                                        //if exprResult=compileExpression(....) is type CONSOLE we know it produces
                                        //a void .val so we dont need to add anything to owedTemps
                                        let arg1 = compileExpression(funcAccess.functionArguments[0], owedTemps);
                                        switch (arg1.myType.kind) {
                                            case MyTypeKind.NUMBER:
                                            {
                                                let c_ir:C_ir_instruction[] = [];
                                                c_ir = c_ir.concat(
                                                    //[!!!]DANGEROUS
                                                    //We skip the code generated by leftExpr because we KNOW its just console 
                                                    //and it doesnt generate a useful value
                                                   arg1.c_ir,
                                                   [new Assignment(Native_c_ir._param1, arg1.val),
                                                    new FunctionCall(Native_c_ir.logNumber)]
                                                );

                                                return new ExprResult(MyType.VOID, false, null, c_ir);
                                            }break;
                                            case MyTypeKind.BOOLEAN:
                                            {
                                                let c_ir:C_ir_instruction[] = [];
                                                c_ir = c_ir.concat(
                                                    //[!!!]DANGEROUS
                                                    //We skip the code generated by leftExpr because we KNOW its just console 
                                                    //and it doesnt generate a useful value
                                                   arg1.c_ir,
                                                   [new Assignment(Native_c_ir._param1, arg1.val),
                                                    new FunctionCall(Native_c_ir.logBoolean)]
                                                );

                                                return new ExprResult(MyType.VOID, false, null, c_ir);
                                            }break;
                                            case MyTypeKind.STRING:
                                            {
                                                let c_ir:C_ir_instruction[] = [];
                                                c_ir = c_ir.concat(
                                                    //[!!!]DANGEROUS
                                                    //We skip the code generated by leftExpr because we KNOW its just console 
                                                    //and it doesnt generate a useful value
                                                   arg1.c_ir,
                                                   [new Assignment(Native_c_ir._param1, arg1.val),
                                                    new FunctionCall(Native_c_ir.logString)]
                                                );

                                                return new ExprResult(MyType.VOID, false, null, c_ir);
                                            }break;
                                            default:
                                                throw new MyError(`No se puede hacer console.log al tipo: ${arg1.myType.getName()}`);
                                        }
                                    }
                                    else{
                                        //MEJORA: better error message
                                        throw new MyError(`Metodo: log de Console requiere 1 parametro`);
                                    }
                                }
                                else{
                                    throw new MyError(`No existe un metodo con nombre: ${funcAccess.functionName} para el tipo: Console`);
                                }
                            }break;
                            default:
                                throw new Error(`Function access no implementado para ${exprResult.myType.getName()} todavia`);
                        }
                    }break;

                    case AccessKind.IndexAccess:
                    {
                        throw new Error("IndexAccess access no implementado todavia");
                    }break;

                    default:
                        throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
                        break;
                }
            }break;
            case ExpressionKind.LITERAL:
            {
                let lit  = expr.specification as LiteralExpression;

                if(lit.literal instanceof StringLiteral){
                    //we return an immediate that represents a heap offset that points
                    //to the string in the heap. We will allocate all string literals after
                    //we generate all the c_ir
                    //BUG?:
                    //[!] if this ExprResult doesnt get generated we will have had allocated
                    //    string literals that wont be used!
                    let stringIndex:Number = new Number(stringLiteralsBuffer.length + Native_c_ir.stringLitsSize);
                    stringLiteralsBuffer = stringLiteralsBuffer.concat(lit.literal.numberArrayRespresentation);
                    //POSSIBLE BUG: I dont know if it really is constExpr. 
                    return new ExprResult(MyType.STRING, true, stringIndex, []);
                }
                else if(lit.literal instanceof Number){
                    return new ExprResult(MyType.NUMBER, true, lit.literal.valueOf(), []);
                }
                else if(lit.literal instanceof Boolean){
                    let val = (lit.literal.valueOf() ? 1 : 0);
                    return new ExprResult(MyType.BOOLEAN, true, val, []);
                }
                else{
                    throw new Error(`expression literal no implementado para: ${lit.literal}`);
                }
            }break;
            case ExpressionKind.OBJECT_LITERAL:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.ARRAY_LITERAL:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.TERNARY:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;

            default:
                throw new Error(`runExpression no implementado para expressionKind: '${expr.expressionKind}'`);
        }
    }
}

//TODO: ver si LValue definitivamente no necesita de owedTemps
//a valid Lvalue shouldnt make a function call so it shouldnt need a owedTemps array
//but we will pass it anyway because I am not 100% sure?? :(
function compileLValue(expr:Expression, owedTemps:String[]):LValueResult{
    if(expr.expressionKind === ExpressionKind.IDENTIFIER){
        let identExp = expr.specification as IdentifierExpression;
        //We get the value from the symbol table
        let getVarResult = Env.getVariable(identExp.name);
        if(getVarResult === null){
            throw new MyError(`No existe una variable con el nombre: '${identExp.name}' en este entorno`);
        }
        //FIXME: 
        //TODO: Cuando tengamos funciones anidadas para a tener que hacer un caso especial para las variables 
        //      que estan definidas en alguna funcion ancestro
        let isGlobal = getVarResult.isGlobal;
        let variable = getVarResult.variable;

        //Generamos c_ir diferente dependiendo de si es global
        //local
        if(isGlobal){

            let temp = getNextTemp();
            let c_ir:C_ir_instruction[] = [
                new Assignment(temp, variable.offset)
            ];

            return new LValueResult(variable.myType, variable.isConst, true, temp, c_ir);
        }
        else{
            let temp = getNextTemp();
            let c_ir:C_ir_instruction[] = [
                new _3AddrAssignment(temp, P_REG, ArithOp.ADDITION, variable.offset)
            ];

            return new LValueResult(variable.myType, variable.isConst, true, temp, c_ir);
        }

    }
    else if(expr.expressionKind === ExpressionKind.MEMBER_ACCESS){
        //tenemos que tener el typeSignature antes de hacer esta parte
        throw new Error(`compileLValue no implementado para member access todavia`);
    }
    else{
        throw new MyError(`Not an lvalue`);
    }
}

// devuelbe el ExprResult de hacer una expresion binaria en C_IR entre leftResult y rightResult
// intended use: + - * / entre 2 numbers. porque se genera C_IR practicamente identico para esos casos
// this would an inlined func in c
function generateSimpleArithExprResult(left_c_ir:C_ir_instruction[], left_val:(String | Number), arithOp:ArithOp, right_c_ir:C_ir_instruction[], right_val:(String | Number)):ExprResult{

    //generamos el c_ir y retornamos el ExprResult
    let temp = getNextTemp();

    //TERRIBLE: perf. tiene que exister una manera 
    //     de evitar hacer tantos nuevos arreglos
    let c_ir:C_ir_instruction[] = new Array();

    c_ir = c_ir.concat(
        left_c_ir,
        right_c_ir,
        [new _3AddrAssignment(temp, left_val, arithOp, right_val)]
    );

    return new ExprResult(MyType.NUMBER, false, temp, c_ir);
}

function generateAndExprResult(left_c_ir:C_ir_instruction[], left_val:(String | Number), right_c_ir:C_ir_instruction[], right_val:(String | Number)):ExprResult{

    //generamos el c_ir y retornamos el ExprResult
    let temp = getNextTemp();

    let runRightCir_label= new Label(getNextLabel());
    let true_label = new Label(getNextLabel());
    let false_label = new Label(getNextLabel());
    let end_label = new Label(getNextLabel());

    //TERRIBLE: perf. tiene que exister una manera 
    //     de evitar hacer tantos nuevos arreglos
    let c_ir:C_ir_instruction[] = new Array();

    //MEJORA?: no tenemos ifFalse pero si tenemos if foo.val==0 goto L_FOO
    //         Talvez usando logica negativa podemos simplificar este c_ir
    //         Pensaria que al menos deberia de queder tan bien como el OR
    /*
        ...left_cir...
        if left.value==1 goto RUN_R_CIR;
        goto FALSE

        RUN_R_CIR:
        ...right_cir...
        if right.value==1 goto TRUE;

        FALSE:
        TN = 0;
        goto END;

        TRUE:
        TN = 1;

        END:
    */
    c_ir = c_ir.concat(
        left_c_ir,
       [new Cond_goto(left_val, RelOp.EQUAL_EQUAL, new Number(1), runRightCir_label),
        new Goto(false_label),
        new LabelDeclaration(runRightCir_label)],
        right_c_ir,
       [new Cond_goto(right_val, RelOp.EQUAL_EQUAL, new Number(1), true_label),
        new LabelDeclaration(false_label),
        new Assignment(temp, new Number(0)),
        new Goto(end_label),
        new LabelDeclaration(true_label),
        new Assignment(temp, new Number(1))],
        new LabelDeclaration(end_label)
    );

    return new ExprResult(MyType.BOOLEAN, false, temp, c_ir);
}

function generateOrExprResult(left_c_ir:C_ir_instruction[], left_val:(String | Number), right_c_ir:C_ir_instruction[], right_val:(String | Number)):ExprResult{

    //generamos el c_ir y retornamos el ExprResult
    let temp = getNextTemp();

    let true_label = new Label(getNextLabel());
    let end_label = new Label(getNextLabel());

    //TERRIBLE: perf. tiene que exister una manera 
    //     de evitar hacer tantos nuevos arreglos
    let c_ir:C_ir_instruction[] = new Array();

    /*
        ...left_cir...
        if left.value==1 goto TRUE;

        ...right_cir...
        if right.value==1 goto TRUE;

        TN = 0;
        goto END;

        TRUE:
        TN = 1;

        END:
    */
    c_ir = c_ir.concat(
        left_c_ir,
       [new Cond_goto(left_val, RelOp.EQUAL_EQUAL, new Number(1), true_label)],
        right_c_ir,
       [new Cond_goto(right_val, RelOp.EQUAL_EQUAL, new Number(1), true_label),
        new Assignment(temp, new Number(0)),
        new Goto(end_label),
        new LabelDeclaration(true_label),
        new Assignment(temp, new Number(1))],
        new LabelDeclaration(end_label)
    );

    return new ExprResult(MyType.BOOLEAN, false, temp, c_ir);;
}

export function generateComparisonExprResult(left_c_ir:C_ir_instruction[], left_val:(String | Number), relOp:RelOp, right_c_ir:C_ir_instruction[], right_val:(String | Number)):ExprResult{

    //generamos el c_ir y retornamos el ExprResult
    let temp = getNextTemp();

    let true_label = new Label(getNextLabel());
    let end_label = new Label(getNextLabel());

    let c_ir:C_ir_instruction[] = new Array();

    c_ir = c_ir.concat(
        left_c_ir,
        right_c_ir,
       [new Cond_goto(left_val, relOp, right_val, true_label),
        new Assignment(temp, new Number(0)),
        new Goto(end_label),
        new LabelDeclaration(true_label),
        new Assignment(temp, new Number(1)),
        new LabelDeclaration(end_label)]
    );

    return new ExprResult(MyType.BOOLEAN, false, temp, c_ir);;
}

export function compileDeclaration(declaration:Declaration):C_ir_instruction[]{

    let variable:Variable;
    if(declaration.data instanceof UnprocessedDeclData){
        //No importa si compileTypeNode o addVariable tirar MyError porque 
        //un .data tipo UnprocessedDeclData quiere decir que no hemos reservado espacio para
        //esa variable. Entonces podemos tirar error y saltarnos el statement sin que pase 
        //nada malo
        let varType = compileTypeNode(declaration.data.myTypeNode);
        let varName = declaration.data.identifier;
        let isConst = declaration.data.isConst;

        variable = Env.addVariable(varName, isConst, varType);
    }
    else{
        variable = declaration.data.variable;
        variable.isUndeclared = false;
    }
    //[!!!] DE ESTE PUNTO EN ADELANTEa AGREGAMOS LA VARIABLE SIN IMPORTAR EL RESULTADO 
    //      DE declaration.expr LO QUE QUIERE DECIR QUE MANIPULAMOS LA TABLA DE SIMBOLOS. 
    //      ENTONCES DE AQUI EN ADELANTE SI OCURRE UNA EXCEPTION LA TENEMOS QUE ATRAPARA 
    //      PARA QUE PODAMOS GENERAR C_IR *SIEMPRE*

    let exprVal:(String | Number);
    let exprC_ir:C_ir_instruction[];
    if(declaration.expression !== null){
        let exprResult:ExprResult;
        try{
            exprResult = compileExpression(declaration.expression, []);
        }catch(myError){
            //reportamos el error de expresion 
            //Y reportamos un error adicional en esta declaracion pero no 
            //descartamos la declaracion
            if(myError instanceof MyError){
                console.log(myError);
                runtimeInterface.errorDataSet.push(myError);
                //creamos el error de esta declaracion
                let declError = MyError.makeMyError(
                    MyErrorKind.TYPE_ERROR, 
                    `No se puede declarar una variable con valor: 'ERROR'. Se utilizara el valor default del tipo: '${variable.myType.getName()}'`
                );
                declError.setLocation(declaration.astNode);
                console.log(declError);
                runtimeInterface.errorDataSet.push(declError);

                //generamos el temp y el c_ir para un valor default del tipo de la variable
                exprVal = getNextTemp();
                exprC_ir = [
                    new Assignment(exprVal, variable.myType.getDefaultVal())
                ];
                return generateDeclaration_c_ir(exprVal, exprC_ir, variable);
            }else{
                throw myError;
            }
        }

        //we must check types
        if(!MyType.compareTypes(variable.myType, exprResult.myType)){
            //reportamos el error de tipos e indicamos que vamos a usar el valor default del tipo.
            let error = MyError.makeMyError(
                MyErrorKind.TYPE_ERROR, 
                `Tipos no compatibles en declaracion: '${variable.myType.getName()} y '${exprResult.myType.getName()}'. Se utilizara el valor default del tipo: ${variable.myType.getName()}`
            );
            error.setLocation(declaration.astNode);
            console.log(error);
            runtimeInterface.errorDataSet.push(error);

            //generamos el temp y el c_ir para un valor default del tipo de la variable
            exprVal = getNextTemp();
            exprC_ir = [
                new Assignment(exprVal, variable.myType.getDefaultVal())
            ];
            return generateDeclaration_c_ir(exprVal, exprC_ir, variable);
        }

        exprVal = exprResult.val;
        exprC_ir = exprResult.c_ir;
        return generateDeclaration_c_ir(exprVal, exprC_ir, variable);
    }
    else{
        //siempre tenemos que generar el defaul
        exprVal = getNextTemp();
        exprC_ir = [
            new Assignment(exprVal, variable.myType.getDefaultVal())
        ];
        return generateDeclaration_c_ir(exprVal, exprC_ir, variable);
    }
    
    //MEJORA: explicar porque no importa que trae la expression
    //We dont have to know if the expr is a pointer to a heap or whatever
    //if it is a pointer to the heap, we still have to store that pointer in the stack
    //If it is an imm we have to store the value itself in the stack
    //If it is a temp that doesnt have a pointer we copy still have to copy the value of the temp
    //exactly the same as if it were a temp with a pointer
    //"the expr deals with the allocation and we know the meaning of its T with the type"

    //we need to put the value of the variable in stack[p+varOffset]
    //but c_ir doesnt only allows stack[temp|imm] so we must put 
    //p+varOffset in a temp
    let varPointerTemp = getNextTemp();

    let c_ir:C_ir_instruction[] = new Array();

    c_ir = c_ir.concat(
        exprC_ir,
       [new _3AddrAssignment(varPointerTemp, P_REG, ArithOp.ADDITION, variable.offset),
        new Assignment(Mem.stackAccess(varPointerTemp), exprVal)],
    );

    return c_ir;
}

//dado un temp con el valor de la expresion derecha y una variable
//genera el c_ir de una declaracion sirve para simplificar un poco el flujo de
//compileDeclaration
export function generateDeclaration_c_ir(exprVal:(String | Number), exprC_ir:C_ir_instruction[], variable:Variable):C_ir_instruction[]{

    //MEJORA: explicar porque no importa que trae la expression
    //We dont have to know if the expr is a pointer to a heap or whatever
    //if it is a pointer to the heap, we still have to store that pointer in the stack
    //If it is an imm we have to store the value itself in the stack
    //If it is a temp that doesnt have a pointer we copy still have to copy the value of the temp
    //exactly the same as if it were a temp with a pointer
    //"the expr deals with the allocation and we know the meaning of its T with the type"

    //we need to put the value of the variable in stack[p+varOffset]
    //but c_ir doesnt only allows stack[temp|imm] so we must put 
    //p+varOffset in a temp
    let varPointerTemp = getNextTemp();

    let c_ir:C_ir_instruction[] = new Array();

    c_ir = c_ir.concat(
        exprC_ir,
       [new _3AddrAssignment(varPointerTemp, P_REG, ArithOp.ADDITION, variable.offset),
        new Assignment(Mem.stackAccess(varPointerTemp), exprVal)],
    );

    return c_ir;
}

//[throws] myError if a custom type doesnt exist
export function compileTypeNode(myTypeNode:MyTypeNode):MyType{
    if(myTypeNode.kind === MyTypeNodeKind.CUSTOM){
        // let customTypeNode = myTypeNode.spec as CustomTypeNode;
        // let myType = Env.global.myTypeSignatures[customTypeNode.name];
        // if(myType === undefined){
        //     throw new MyError(`No existe el tipo: '${customTypeNode.name}'.`);
        // }
        // return myType;
        throw new Error(`compileTypeNode no implementado para typenode: ${myTypeNode.kind}`)
    }
    if(myTypeNode.kind === MyTypeNodeKind.GENERIC_ARRAY || myTypeNode.kind === MyTypeNodeKind.BOXY_ARRAY){
        // let arrayTypeNode = myTypeNode.spec as ArrayTypeNode;
        // It is very important that we dont call runPropertyMyTypeNode. Here. If we do we will get a pretty nasty bug
        // return MyType.makeArrayType(runNonPropertyMyTypeNode(arrayTypeNode.subType));
        throw new Error(`compileTypeNode no implementado para typenode: ${myTypeNode.kind}`)
    }

    //it must be primitive
    switch (myTypeNode.kind) {
        case MyTypeNodeKind.NUMBER:
            return MyType.NUMBER;
        case MyTypeNodeKind.STRING:
            return MyType.STRING;
        case MyTypeNodeKind.BOOLEAN:
            return MyType.BOOLEAN;
        default:
            throw new Error(`compileMyTypeNode no implementado para ${myTypeNode.kind}`);
    }
}

export function compileWhile(whileStatement:WhileStatement):C_ir_instruction[]{
    //Tenemos que chequear los tipos antes de poder tocar el Env
    //MEJORA: We could do the boolean expr evaluation optimizations described in the dragon
    //        book near section 6.6.5
    let condResult = compileExpression(whileStatement.expr, []);
    if(!MyType.compareTypes(condResult.myType, MyType.BOOLEAN)){
        throw new MyError(`La condicion de un statement while debe ser de tipo booleana, se encontro: ${condResult.myType.getName()}`);
    }

    let begLabel = new Label(getNextLabel());
    let endLabel = new Label(getNextLabel());

    //[!!!] Important we tell the Env that it has started generating instructions
    //      inside a a while
    
    Env.pushWhileScope(begLabel, endLabel);

    //MEJORA: hacer un reserve
    let statements_c_ir:C_ir_instruction[] = new Array();
    for (const statement of whileStatement.statements) {
        statements_c_ir = statements_c_ir.concat(compileStatement(statement));
    }

    let c_ir:C_ir_instruction[] = new Array();
    c_ir = c_ir.concat(
       [new LabelDeclaration(begLabel)],
        condResult.c_ir,
       [new Cond_goto(condResult.val, RelOp.NOT_EQUAL, new Number(1), endLabel)],
        statements_c_ir,
       [new Goto(begLabel),
        new LabelDeclaration(endLabel)]
    );

    Env.popScope();

    return c_ir;
}