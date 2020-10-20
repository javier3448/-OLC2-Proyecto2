import { RuntimeInterface, TsEntry } from "../app/app.component";
import { Env, Scope } from "./Environment";
import { Global_c_ir } from "./Global_c_ir";

import { Statement, StatementKind, WhileStatement, Block, 
         IfStatement, ForStatement, ForInStatement, ForOfStatement, 
         SwitchStatement, DoWhileStatement} from "../Ast/Statement";

import { MyType, MyTypeKind, TypeSignature } from "./MyType";
import { MyFunction, MyFunctionKind, GraficarTs, Parameter, MyNonNativeFunction } from "./MyFunction";
import { MyError, MyErrorKind } from './MyError';

import { Expression, ExpressionKind, FunctionCallExpression, LiteralExpression, 
         IdentifierExpression, MemberAccessExpression, BinaryExpression, UnaryExpression, 
         TernaryExpression, ObjectLiteralExpression, ArrayLiteralExpression } from '../Ast/Expression';
import { Declaration } from '../Ast/Declaration';
import { AccessKind, AttributeAccess, FunctionAccess, IndexAccess } from 'src/Ast/MemberAccess';
import { ArrayTypeNode, CustomTypeNode, MyTypeNode, MyTypeNodeKind } from 'src/Ast/MyTypeNode';
import { GlobalInstructions } from 'src/Ast/GlobalInstructions';
import { TypeDef, AttributeNode } from "../Ast/TypeDef";
import { FunctionDef, ParamNode } from "../Ast/FunctionDef";
import { ExprResult } from "./ExprResult"
import { LValueResult } from "./LValueResult"
import { ArithOp, Assignment, _3AddrAssignment, Cond_goto, C_ir_instruction, c_ir_instructions_toString, Goto, Label, LabelDeclaration, RelOp, Mem } from './C_ir_instruction';
import { AssignmentNode } from 'src/Ast/AssignmentNode';

//TODO: agregar un comentario con el c_ir deseado en todos 
//      los lugares en los que generamos c_ir

//Casi siempre que retornemos un string asi nadamas significa que estamos retorna
//el C_IR generado por algun lang construct
//Convension: poner primero el C_IR en el retorno, ejemplo: [string, AlgoMasQueNecesitemos]

// REGION: 

//CLEAN-UP: uso confuso de la global runtimeInterfaces:
//El hecho que la pasamos como parametro en compile(...), el hecho que tenemos un
//metodo resetRuntimeInterface
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
// END: IO functions

//Tienen el ultimo temp que fue utilizado
//Si estan en 0 es porque no se utilizo ningun temp o label
export let tempCount = 0;
export let labelCount = 0;

function getNextTemp():String{
    tempCount += 1;
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

function construct_c_ir_header():string{
    //El primer numero entero que un IEEE754 no puede 
    //representar exactamente: https://stackoverflow.com/questions/3793838/which-is-the-first-integer-that-an-ieee-754-float-is-incapable-of-representing-e
    //For float, 16,777,217 (2^24 + 1).        
    //For double, 9,007,199,254,740,993 (2^53 + 1).
    let header = `#include <stdio.h> 
//TODO: Ver que tamano de stack es mejor (deberia ser mucho mas pequenno que el heap)
float heap[0xfffff];
float stack[0xfffff];
float p = 0;
float h = 0;
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
        temps = "float " + temps.slice(0, temps.length - 2) + ';\n';
    }

    header += temps + `\nint main(){\n`;

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

    let global_c_ir = compileGlobalInstructions(root);

    runtimeInterface.intermediateRepresentation = construct_c_ir_header();
    //Que lo pasa a string con un foreach C_ir_instruction.toString
    runtimeInterface.intermediateRepresentation += c_ir_instructions_toString(global_c_ir.statements_c_ir);
    runtimeInterface.intermediateRepresentation += construct_c_ir_foot();
}

export function compileGlobalInstructions(globalInstructions:GlobalInstructions):Global_c_ir{

    let funcs_c_ir = "";
    let statements_c_ir:C_ir_instruction[] = new Array();

    for (const typeDef of globalInstructions.typeDefs) {
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

    for (const functionDef of globalInstructions.functionDefs) {
        try {
            compileFunctionDef(functionDef);
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

    //MEJORA: reserve a statements_c_ir (no se como hacer eso en typescript, talvez no sea posible)
    for (const statement of globalInstructions.statements) {
        let result = compileStatement(statement);
        statements_c_ir = statements_c_ir.concat(result);
    }

    return new Global_c_ir(funcs_c_ir, statements_c_ir);
}

export function compileFunctionDef(functionDefNode:FunctionDef){
    throw new Error("Not implemented yet!");
}

export function compileTypeDef(typeDef:TypeDef){

    throw new Error("Not implemented yet!");
}

//MEDIO CHAPUZ
//retorna empty c_ir_instruction si occurio un error
export function compileStatement(statement:Statement):C_ir_instruction[]{

    try {
        let child = statement.child;

        switch (statement.statementKind) {
            case StatementKind.ExpressionKind:
                return compileExpression(child as Expression).c_ir;

            case StatementKind.DeclarationKind:
                return compileDeclaration(child as Declaration);

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

export function compileExpression(expr:Expression):ExprResult{

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
                let lvalue = compileLValue(expr.specification.left);
                let rvalue = compileExpression(expr.specification.right);

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
            let leftResult = compileExpression(expr.specification.left);
            let rightResult = compileExpression(expr.specification.right);

            switch (expr.expressionKind) {
                case ExpressionKind.ADDITION:
                {
                    //revisamos errores de tipos:
                    if(leftResult.myType.kind === MyTypeKind.STRING ||
                       rightResult.myType.kind === MyTypeKind.STRING){
                        throw new Error("implementacion de suma con strings no implementado todavia!");
                    }
                    else if(leftResult.myType.kind === MyTypeKind.NUMBER  &&
                            rightResult.myType.kind === MyTypeKind.NUMBER){

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

                default:
                    throw new Error(`operacion binaria: ${expr.expressionKind} no implementada todavia`);
            }
        }
        else if(expr.specification instanceof UnaryExpression){
            let unaryExpr = expr.specification as UnaryExpression;
            let operand = compileExpression(unaryExpr.expr);
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
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.IDENTIFIER:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            //The way we traverse member access is kinda weird because the way the AST is shaped
            //but we wont bother to describe it in a comment :/
            case ExpressionKind.MEMBER_ACCESS:
            {
                throw new Error(`compileExpr de ${expr.expressionKind} no implementado todavia`);
            }break;
            case ExpressionKind.LITERAL:
            {
                let lit  = expr.specification as LiteralExpression;

                if(lit.literal instanceof String){
                    throw new Error(`expression literal no implementado para: string todavia`);
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

function compileLValue(expr:Expression):LValueResult{
    if(expr.expressionKind === ExpressionKind.IDENTIFIER){
        let identExp = expr.specification as IdentifierExpression;
        //We get the value from the symbol table
        let getVarResult = Env.getVariable(identExp.name);
        if(getVarResult === null){
            throw new MyError(`No existe una variable con el nombre: '${identExp.name}' en este entorno`);
        }
        let isGlobal = getVarResult.isGlobal;
        let variable = getVarResult.variable;

        //Generamos c_ir diferente dependiendo de si es global
        //local
        if(isGlobal){

            let temp = getNextTemp();
            let c_ir:C_ir_instruction[] = [
                new Assignment(temp, variable.offset)
            ]

            return new LValueResult(variable.type, variable.isConst, true, temp, c_ir);
        }
        else{
            let temp = getNextTemp();
            let c_ir:C_ir_instruction[] = [
                new _3AddrAssignment(temp, P_REG, ArithOp.ADDITION, variable.offset)
            ];

            return new LValueResult(variable.type, variable.isConst, true, temp, c_ir);
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
// intended use: + - * / % entre 2 numbers. porque se genera C_IR practicamente identico para esos casos
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

export function compileDeclaration(declaration:Declaration):C_ir_instruction[]{

    let varType = compileTypeNode(declaration.myTypeNode);
    let exprResult:(ExprResult | null);
    if(declaration.expression !== null){
        exprResult = compileExpression(declaration.expression);

        //we must check types
        if(!MyType.compareTypes(varType, exprResult.myType)){
            throw MyError.makeMyError(
                MyErrorKind.TYPE_ERROR, 
                `Tipos no compatibles: '${varType.getName()} y '${exprResult.myType.getName()}'`
            );
        }

        //MEJORA: explicar porque no importa que trae la expression
        //We dont have to know if the expr is a pointer to a heap or whatever
        //if it is a pointer to the heap, we still have to store that pointer in the stack
        //If it is an imm we have to store the value itself in the stack
        //If it is a temp that doesnt have a pointer we copy still have to copy the value of the temp
        //exactly the same as if it were a temp with a pointer
        //"the expr deals with the allocation and we know the meaning of its T with the type"

        //we try to add the variable into the symboltable this might 
        //throw an exception that will be caught at compileStatement
        let id = declaration.identifier;
        let myType = varType;
        let varOffset = Env.addVariable(id, declaration.isConst, myType);

        //[!!!] once we add the variable the Env we MUST generate code
        //      because otherwise the code generated and the Env would 
        //      contradict eachother
        //      i.e. from this point on we cant throw any MyError

        //we need to put the value of the variable in stack[p+varOffset]
        //but c_ir doesnt only allows stack[temp|imm] so we must put 
        //p+varOffset in a temp
        let varPointerTemp = getNextTemp();

        let c_ir:C_ir_instruction[] = new Array();

        c_ir = c_ir.concat(
            exprResult.c_ir,
           [new _3AddrAssignment(varPointerTemp, P_REG, ArithOp.ADDITION, varOffset),
            new Assignment(Mem.stackAccess(varPointerTemp), exprResult.val)],
        );

        return c_ir;
    }
    else{
        //we check if it is const, if so error
        if(declaration.isConst){
            throw new MyError(`Declaraciones con 'const' deben de ser inicializadas`);
        }
        //otherwise just get the default value of the type

         //we try to add the variable into the symboltable this might 
        //throw an exception that will be caught at compileStatement
        let id = declaration.identifier;
        let myType = varType;
        let varOffset = Env.addVariable(id, false, myType);

        //[!!!] once we add the variable the Env we MUST generate code
        //      because otherwise the code generated and the Env would 
        //      contradict eachother
        //      i.e. from this point on we cant throw any MyError

        //we need to put the value of the variable in stack[p+varOffset]
        //but c_ir doesnt only allows stack[temp|imm] so we must put 
        //p+varOffset in a temp
        let varPointerTemp = getNextTemp();

        //varType.getDefaultVal only works if the defaultVal of every possible type
        //doesnt need generate c_ir code AND all types in have the same size
        //or are pointers
        let c_ir:C_ir_instruction[] = [
            new _3AddrAssignment(varPointerTemp, P_REG, ArithOp.ADDITION, varOffset),
            new Assignment(Mem.stackAccess(varPointerTemp), varType.getDefaultVal())
        ];

        return c_ir;
    }
    
}

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
