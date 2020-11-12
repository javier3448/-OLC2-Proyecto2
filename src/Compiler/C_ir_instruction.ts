//CONVENCIO DE 18/10 EN ADELANTE:
//Vamos a usar metodos estaticos make.. para 'instanciar' los objetos porque
//el new hace bulto y quiero poder escribir mas de un constructor y typescript
//no me deja

//TODO HACER ESTE MERGE DE NAMESPACES PARA TODOS TUS ENUMS
//asi el valor del enum como tal no tiene que tener su representacion en 
//string y podemos llamar anEnum.toString comodamente
export enum ArithOp{
    ADDITION,
    SUBSTRACTION,
    MULTIPLICATION,
    DIVISION,
    MODULUS
}

//ArithOperator
export function arithOpToString(arithOperator:ArithOp):string{
    switch (arithOperator) {
        case ArithOp.ADDITION:
            return "ADDITION";
        case ArithOp.SUBSTRACTION:
            return "SUBSTRACTION";
        case ArithOp.MULTIPLICATION:
            return "MULTIPLICATION";
        case ArithOp.DIVISION:
            return "DIVISION";
        case ArithOp.MODULUS:
            return "MODULUS";
        default:
            throw new Error(`ArithOperator.toString no implementado para '${arithOperator}'!`);
    }
}
export function arithOpGetSymbol(arithOp:ArithOp):string{
    switch (arithOp) {
        case ArithOp.ADDITION:
            return "+";
        case ArithOp.SUBSTRACTION:
            return "-";
        case ArithOp.MULTIPLICATION:
            return "*";
        case ArithOp.DIVISION:
            return "/";
        case ArithOp.MODULUS:
            return "%";
        default:
            throw new Error(`ArithOperator.getSymbol no implementado para '${arithOp}'!`);
    }
}

export enum RelOp{
    LESS,
    GREATER,
    LESS_OR_EQUAL,
    GREATER_OR_EQUAL,
    EQUAL_EQUAL,
    NOT_EQUAL,
}

export function relOpToString(relationalOperator:RelOp):string{
    switch (relationalOperator) {
        case RelOp.LESS:
            return "LESS";
        case RelOp.GREATER:
            return "GREATER";
        case RelOp.LESS_OR_EQUAL:
            return "LESS_OR_EQUAL";
        case RelOp.GREATER_OR_EQUAL:
            return "GREATER_OR_EQUAL";
        case RelOp.EQUAL_EQUAL:
            return "EQUAL_EQUAL";
        case RelOp.NOT_EQUAL:
            return "NOT_EQUAL";

        default:
            throw new Error(`RelationalOperator.toString no implementado para '${relationalOperator}'!`);
    }
}

export function relOpGetSymbol(relationalOperator:RelOp):string{
    switch (relationalOperator) {
        case RelOp.LESS:
            return "<";
        case RelOp.GREATER:
            return ">";
        case RelOp.LESS_OR_EQUAL:
            return "<=";
        case RelOp.GREATER_OR_EQUAL:
            return ">=";
        case RelOp.EQUAL_EQUAL:
            return "==";
        case RelOp.NOT_EQUAL:
            return "!=";

        default:
            throw new Error(`RelationalOperator.toString no implementado para '${relationalOperator}'!`);
    }
}

export enum MemKind{
    HEAP,
    STACK
}

export function memKindToString(memKind:MemKind){
    switch (memKind) {
        case MemKind.STACK:
            return "STACK";
        case MemKind.HEAP:
            return "HEAP";
    
        default:
            break;
    }
}

//Accesso a memoria en la forma stack/heap[imm | temp]
//no podemos hacer operaciones adentro de []
export class Mem{
    private constructor(
        public kind:MemKind,
        //offset can be a Temp or a immediate
        public offset:(String | Number)
    ) {   }

    public static stackAccess(offset:(String | Number)){
        return new Mem(MemKind.STACK, offset);
    }

    public static heapAccess(offset:(String | Number)){
        return new Mem(MemKind.HEAP, offset);
    }

    //MEJORA: better name
    public static access(memKind:MemKind, offset:(String | Number)){
        return new Mem(memKind, offset);
    }

    public toString():string{

        switch (this.kind) {
            case MemKind.STACK:
                return `stack[(int)${this.offset.toString()}]`
            case MemKind.HEAP:
                return `heap[(int)${this.offset.toString()}]`
            default:
                throw new Error(`Mem.toString no implementado para MemKind '${this.kind}'!`);
        }
    }
}

export class Label{
    //MEJORA:Talvez sea mejor solo guardar el numero del label 
    //       en vez de su string "L1234"
    constructor(
        public name:String,
    ) {}
}

//
export class _3AddrAssignment{
    constructor(
        //it can be a String:temp 
        public dest:(String),
        //it can be a String:temp or an immediate a "constexpr"
        public left:(String | Number),

        public arithOp:ArithOp,

        //it can be a String:temp Mem:stack/heap_accesss or an immediate a "constexpr"
        public right:(String | Mem | Number),
    ){}
}

//[!!!!!] EL ENUNCIADO DICE QUE SOLO PUEDE VENIR 1 MEM
//[temp|] = [temp|imm]
export class Assignment{
    constructor(
        //it can be a String:temp Mem:stack/heap_accesss 
        public dest:(String | Mem),
        //it can be a String:temp Mem:stack/heap_accesss or an immediate a "constexpr"
        public source:(String | Mem | Number),
    ){}
}

export class Goto{
    constructor(public label:Label) {   }
}

//Existe porque para nostros la declaracion de una label
//es una instruccion en c_ir
export class LabelDeclaration{
    constructor(public label:Label) {   }
}

// if [temp|imm] relOperator [temp|imm] goto lable
export class Cond_goto{
    constructor(
        public leftVal:(String | Number),
        public relOperator:RelOp,
        public rightVal:(String | Number),

        public label:Label
    ) {   }
}

//DEBUG: Basically cheating. For debuggin ONLY
export class Debug_instruction{
    constructor(
        public ins:String,
    ) {   }
}

//DEBUG: just comments, which are allowed but we will still remove in the final commit
export class Comment{
    constructor(
        public comment:String,
    ) {   }
}
export class FunctionCall{
    constructor(
        public funcName:string
    ) {   }
}

export class FuncOpening{
    constructor(
        public funcName:string
    ){   }
}

export class FuncClose{

}

//TODO?: c_ir para printf?

export type C_ir_instruction = (LabelDeclaration | Assignment | _3AddrAssignment | Goto | Cond_goto | FunctionCall | Debug_instruction | FuncOpening | FuncClose | Comment);

export function c_ir_instruction_toString(c_ir_ins:C_ir_instruction):string{
    if(c_ir_ins instanceof LabelDeclaration){
        return `${c_ir_ins.label.name}:\n`;
    }
    else if(c_ir_ins instanceof _3AddrAssignment){
        //        [Temp] = [Temp|imm] OP [Temp|imm];
        //Example:  T1 = stack[T2] + 10;
        if(c_ir_ins.arithOp !== ArithOp.MODULUS){
            return `${c_ir_ins.dest.toString()} = ${c_ir_ins.left.toString()} ${arithOpGetSymbol(c_ir_ins.arithOp)} ${c_ir_ins.right.toString()};\n`;
        }
        //MEDIO CHAPUZ 
        else{//CASO ESPECIAL DEL MODULUS PORQUE REQUIERE CASTEO A (int)!
            return `${c_ir_ins.dest.toString()} = (int)${c_ir_ins.left.toString()} ${arithOpGetSymbol(c_ir_ins.arithOp)} (int)${c_ir_ins.right.toString()};\n`;
        }
    }
    else if(c_ir_ins instanceof Assignment){
        //[!!!!!] EL ENUNCIADO DICE QUE SOLO PUEDE VENIR 1 MEM
        //        [Temp|Mem] = [Temp|Mem|imm]
        //Example:  T1 = stack[T2] 
        return `${c_ir_ins.dest.toString()} = ${c_ir_ins.source.toString()};\n`;
    }
    else if(c_ir_ins instanceof Goto){
        return `goto ${c_ir_ins.label.name};\n`
    }
    else if(c_ir_ins instanceof Cond_goto){
        return `if (${c_ir_ins.leftVal.toString()} ${relOpGetSymbol(c_ir_ins.relOperator)} ${c_ir_ins.rightVal.toString()}) goto ${c_ir_ins.label.name};\n`
    }
    else if(c_ir_ins instanceof FunctionCall){
        //POSSIBLE BUG: if we name a function with a C keyword this gets all messed up
        return `${c_ir_ins.funcName}();\n`;
    }
    else if(c_ir_ins instanceof Debug_instruction){
        //DEBUG: Basically cheating. For debuggin ONLY
        return c_ir_ins.ins.toString();
    }
    else if(c_ir_ins instanceof FuncOpening){
        return `void ${c_ir_ins.funcName}(){\n`;
    }
    else if(c_ir_ins instanceof FuncClose){
        return `return;\n}\n`;
    }
    else if(c_ir_ins instanceof Debug_instruction){
        return c_ir_ins.ins.toString();
    }
    else if(c_ir_ins instanceof Comment){
        //DEBUG: For debuggin ONLY
        return("//" + c_ir_ins.comment.toString() + "\n").toString();
    }
    else{
        throw new Error(`C_ir_instruction.toString no implementado para '${c_ir_ins}'!`);
    }
}

export function c_ir_value_toString(val:(String | Mem | Number)):string{
    if(val instanceof String){
        return val.valueOf();
    }
    else if(val instanceof Mem){
        return val.toString();
    }
    else if(val instanceof Number){
        return val.toString();
    }
    else{
        throw new Error(`c_ir_value_toString no implementado para '${val}'!`);
    }
}

export function c_ir_instructions_toString(c_ir_instructions:C_ir_instruction[]):string{
    //MEJORA: hacer un reserve o al menos usar un string buffer
    let result = "";
    for (const instruction of c_ir_instructions) {
        result += c_ir_instruction_toString(instruction);
    }
    return result;
}