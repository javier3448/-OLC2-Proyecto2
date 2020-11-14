import { OptimizationEntry } from 'src/app/app.component';
import { ArithOp, Assignment, Cond_goto, C_ir_instruction, 
         Debug_instruction, FuncClose, FuncOpening, 
         FunctionCall, Goto, LabelDeclaration, 
         _3AddrAssignment, Comment, c_ir_instruction_toString, Label, c_ir_instructions_toString, RelOp } from '../Compiler/C_ir_instruction';
import { Block } from "./Block";

let optimizations:OptimizationEntry[];

//MEJORA:
//the way we handle functions is very bad. they should have absolutely nothing to do with 
//blocks they should be their own thing


//que reportes necesitamos?
//seguro le tenemos que pasar algo para ir poniendo los reportes :/
//optimizations solo es para reportar que optimizaciones se van haciendo
//MEJORA!!!: this thing is slow, quadratic, and makes more passes than needed.
export function optimize(code:C_ir_instruction[], _optimizations:OptimizationEntry[]):C_ir_instruction[]{

    optimizations = _optimizations; 
    optimizations.length = 0;

    let blocks = new Array<Block>();

    let instructions_buffer = new Array<C_ir_instruction>();

    //Trabajamos bajo la asumcion que todas las funciones se cierran asi:
    // LabelDecl //L999:
    // funcClose //return;
    //           //}
    //CUALQUIER instrucion cualquier instruccion que no sea funcClose Debe tener una instruccion siguiente
    //funcOpen solo puede venir como primera instruccion o despues de un funcClose
    //no pueden venir dos 
    //Un bloque tiene que tener al menos 1 instruccion

    //PASSES:
    //1st: just make the blocks without any edges
    //2nd: we take all those blocks and set their edges
    //3rd: now that we have the graph we start optimize it by transforming it and what not
    //4th: we make a list of C_ir_instructions with the 'optimized graph' that will be the resulting optimized code

    for (let i = 0; i < code.length; i++) {
        let curr_ins = optimize_instruction(i, code[i]);
        if(curr_ins === null){
            continue;
        }

        if(curr_ins instanceof FuncClose){
            instructions_buffer.push(curr_ins);
            blocks.push(new Block(instructions_buffer, null, null));
            instructions_buffer = [];
        }
        else if(curr_ins instanceof FuncOpening){
            //funcOpening must be the first instruction in 
            //little assertion because FuncOpening must be the first c_ir_ins or come after a 
            //FuncClose (this does assure this 100% but it helps)
            if(instructions_buffer.length != 0){
                throw new Error("FuncOpening debe ser la primera instruccion o venir despues de un FuncClose!");
            }
            instructions_buffer.push(curr_ins);
        }
        else if(curr_ins instanceof LabelDeclaration){
            if(instructions_buffer.length != 0){
                blocks.push(new Block(instructions_buffer, null, null));
            }
            //vaciamos el buffer y le metemos esta instruccion porque es lider
            instructions_buffer = [curr_ins];
        }
        else if(curr_ins instanceof Goto){
            //metemos esta ins en el bloque actual y nos aseguramos que la instruccion siguiente sea lider,
            //sin importar que tipo de ins sea
            instructions_buffer.push(curr_ins);
            blocks.push(new Block(instructions_buffer, null, null));

            let lookAheadCurr_ins:C_ir_instruction = null
            while(lookAheadCurr_ins === null){
                i++;
                lookAheadCurr_ins = optimize_instruction(i, code[i]);
            }
            instructions_buffer = [lookAheadCurr_ins];
        }
        else if(curr_ins instanceof Cond_goto){
            //metemos esta ins en el bloque actual y nos aseguramos que la instruccion siguiente sea lider,
            //sin importar que tipo de ins sea
            instructions_buffer.push(curr_ins);
            blocks.push(new Block(instructions_buffer, null, null));

            let lookAheadCurr_ins:C_ir_instruction = null
            while(lookAheadCurr_ins === null){
                i++;
                lookAheadCurr_ins = optimize_instruction(i, code[i]);
            }
            instructions_buffer = [lookAheadCurr_ins];
        }
        else if(curr_ins instanceof Assignment){
            instructions_buffer.push(curr_ins);
        }
        else if(curr_ins instanceof _3AddrAssignment){
            instructions_buffer.push(curr_ins);
        }
        else if(curr_ins instanceof FunctionCall){
            instructions_buffer.push(curr_ins);           
        }
        else if(curr_ins instanceof Comment){
            instructions_buffer.push(curr_ins);
        }
        else if(curr_ins instanceof Debug_instruction){
            instructions_buffer.push(curr_ins);
        }
        else{
            throw new Error(`C_ir_instruction.toString no implementado para '${curr_ins}'!`);
        }
    }

    //THINK:
    //Because a block can only have up to two edge and we can make them when we find
    //the block's last instruction, it is posible to generate the blocks and their edges in 
    //'one pass' but because we cant guarantee that we have computed the block that we want to edge to
    //we would have to add another level of indirection and I dont know it thats worth it :/
    //So for now two passes is fine

    
    //2nd pass finish the data structure.
    //we could do some optimizations here without much trouble but for now we will do 4 passes
    //maybe later when I understand the problem better I can make it into 2 passes only
    for (let i = 0; i < blocks.length; i++) {
        let currBlock = blocks[i];
        let currLastIns = currBlock.c_ir_instructions[currBlock.c_ir_instructions.length - 1];

        //3 cases:
        //it has no nextBlock (last block of any function)

        if(i < blocks.length - 1){
            currBlock.nextBlock = blocks[i+1];
        }

        if(currLastIns instanceof Goto){
            currBlock.jumpBlock = getBlockByLabel(blocks, currLastIns.label);
        }
        else if(currLastIns instanceof Cond_goto){
            currBlock.jumpBlock = getBlockByLabel(blocks, currLastIns.label);
        }
    }
    
    //debugPrintGraphBlocks(blocks);

    //[???]podemos hacer todas las optimizaciones al mismo tiempo o tenemos que elegir una?
    //por ahora elegimos 1

    //3ra fase optimizamos reglas 1-2
    //si un pedaso de codigo fue eliminado por alguna regla ya no lo recorremos para 
    //optimizarlo
    //la 3ra fase va a modificar el grafo de manera tal que al iterar los .nextBlock
    //podamos construir el C_ir_instruction[] con el codigo ya optimizado
    for (let i = 0; i < blocks.length; i++) {
        let currBlock = blocks[i];
        let currLastIns = currBlock.c_ir_instructions[currBlock.c_ir_instructions.length - 1];

        //para la regla 1 solo necesitamos saber si al ultima instruccion de este bloque es un 
        //goto no condicional
        if(currLastIns instanceof Goto){
            //elminamos todo bloque despues de este que no tenga una declaracion
            //de etiqueta como lide
            //ASUMIMOS QUE LOS UNICOS BLOQUE QUE PUEDEN TENER .nextBlock NULL son los bloques
            //que cierran a las funciones, Y los bloques que cierren a las funciones siempre van a tener 
            //un lider declaracion de etiqueta

            //ASUMIMOS que cualquier bloque que termine con goto y solo tenga una instruccion
            //no puede ser el primer bloque
            let e = i + 1;
            let removedC_ir = "";
            while(!(blocks[e].c_ir_instructions[0] instanceof LabelDeclaration)){
                removedC_ir += c_ir_instructions_toString(blocks[e].c_ir_instructions);
                e++;
            }
            currBlock.nextBlock = blocks[e];

            //reportamos la optimizacion
            if(removedC_ir.length > 0){
                optimizations.push(new OptimizationEntry(
                    REGLA_1,
                    TIPO_BLOQUE,
                    removedC_ir,
                    null, 
                    //BUG! wrong line!
                    //to solve it maybe we should store line info of in every single instruction
                    e.toString()
                ));
            }

            //los bloques eliminados estarian serian [i+1, e)
            //entonces en el siguiente ciclo queremos que i este en e
            i = e - 1;
        }
        //el patron de:
        // |          ...              |
        // |   if (...==...) goto LX   |
        // ------------+----------------
        //             |
        //             |
        //-------------+---------------
        //|           goto            |
        // ------------+---------------
        //             |
        //            ...
        //Se utiliza para las reglas 2, 3, 4
        if(currLastIns instanceof Cond_goto && 
            (currLastIns.relOperator === RelOp.EQUAL_EQUAL || currLastIns.relOperator === RelOp.NOT_EQUAL) &&
            blocks[i + 1].c_ir_instructions[0] instanceof Goto)
        {
            let condGotoBlock = currBlock;
            let condGotoBlockLastIns = currLastIns as Cond_goto;

            let gotoBlock = blocks[i + 1];
            //in this case we can assume that gotoBlock will always have just 1 instruction (goto)
            let gotoBlockLastIns = gotoBlock.c_ir_instructions[0] as Goto;

            if(i + 2 >= blocks.length){
                continue;
            }


            //TODO:
            //we need to get the block that has label = to condGotoBlock.label (we will call it trueBlock)
            //trueBlock must be after gotoBlock
            //there cant be any block with labels in between gotoBlock and trueBlock
            let trueBlock:Block = null;
            //first block after gotoBlock
            let j = i + 2;
            for(; j < blocks.length; j++){
                //if it ends in funcClose we stop because we are not interested
                //in blocks outside the current func
                let candidateBlock = blocks[j];
                //trueBlock CANT be the last block of a funciton but falseBlock can
                if(candidateBlock.c_ir_instructions[candidateBlock.c_ir_instructions.length - 1] instanceof FuncClose){
                    break;
                }
                if(candidateBlock.c_ir_instructions[0] instanceof LabelDeclaration){
                    if(candidateBlock.c_ir_instructions[0].label.name === condGotoBlockLastIns.label.name){
                        trueBlock = candidateBlock;
                        break;
                    }
                    else{
                        break;
                    }
                }
            }
            //because we dont have goto in typescript :/
            if(trueBlock === null){
                continue;
            }

            //we look for a block that has label = to gotoBlock.label (we will call it falseBlock)
            //falseBlock must be after trueBlock
            let falseBlock:Block = null;
            //first block after trueBlock
            let k = j + 1;
            for(; k < blocks.length; k++){
                let candidateBlock = blocks[k];
                if(candidateBlock.c_ir_instructions[0] instanceof LabelDeclaration){
                    if(candidateBlock.c_ir_instructions[0].label.name === gotoBlockLastIns.label.name){
                        falseBlock = candidateBlock;
                        break;
                    }
                }
                //if it ends in funcClose we stop because we are not interested
                //in blocks outside the current func
                if(candidateBlock.c_ir_instructions[candidateBlock.c_ir_instructions.length - 1] instanceof FuncClose){
                    break;
                }
            }
            if(falseBlock === null){
                continue;
            }

            //then we do an 'easy' transform to condGotoBlock.next an condGotoBlockLastIns
            condGotoBlock.nextBlock = trueBlock;
            condGotoBlockLastIns.relOperator = (condGotoBlockLastIns.relOperator === RelOp.EQUAL_EQUAL ? RelOp.NOT_EQUAL : RelOp.EQUAL_EQUAL);
            condGotoBlockLastIns.label = gotoBlockLastIns.label;

            optimizations.push(new OptimizationEntry(
                REGLA_2,
                TIPO_BLOQUE,
                //BUG: aqui poner todo el codigo que removimos (es decir, lo que esta entre gotoLabel (incluyendose) y trueBlock)
                c_ir_instruction_toString(gotoBlockLastIns),
                c_ir_instruction_toString(condGotoBlockLastIns),
                //BUG! wrong line!
                //to solve it maybe we should store line info of in every single instruction
                i.toString()
            ));

        }

    }

    //debugPrintOptimizedGraphBlocks(blocks);

    let optimized_instructions = new Array<C_ir_instruction>();
    let iter = blocks.length > 0 ? blocks[0] : null;
    while(iter !== null){
        for (const ins of iter.c_ir_instructions) {
            optimized_instructions.push(ins);
        }
        iter = iter.nextBlock;
    }

    console.log(optimizations);

    return optimized_instructions;
}

//slow as hell :(
function getBlockByLabel(blocks:Block[], label:Label):Block{
    for (const block of blocks) {
        if(block.c_ir_instructions[0] instanceof LabelDeclaration){
            //We will just compare the names because i dont even know 
            //if our compiler can guarantee that the labels will have the same
            //reference.
            //Almost sure that we dont make new labels if we dont need to but 
            //we would have to prove and that is too much work right now
            if(block.c_ir_instructions[0].label.name == label.name){
                return block;
            }
        }
    }
    //assertion
    throw new Error(`Bloque con label: ${label.name} no encontrado`);
}

function debugPrintBlocks(blocks:Block[]):void{
    let s:string = "";
    for (let i = 0; i < blocks.length; i++) {
        console.log("//BEG BLOCK " + i);
        s += "//BEG BLOCK " + i + "\n";
        for (const ins of blocks[i].c_ir_instructions) {
            if(blocks[i] instanceof FuncClose){
                // console.log("    return;");
                // console.log("    }");
                s += "    return;\n";
                s += "    }\n";
            }
            else{
                // console.log("    " + c_ir_instruction_toString(ins));
                s += "    " + c_ir_instruction_toString(ins);
            }
        }
        // console.log("//END BLOCK " + i + "\n");
        s += "//END BLOCK " + i + "\n\n";


    }
    console.log(s);
}

//ONLY WORKS IF WE HAVENT OPTIMIZED ANYTHING YET
//but we have the edges set
function debugPrintGraphBlocks(blocks:Block[]):void{
    let s:string = "";
    for (let i = 0; i < blocks.length; i++) {
        // console.log("//BEG BLOCK " + i);
        s += "//BEG BLOCK " + i + "\n";
        for (const ins of blocks[i].c_ir_instructions) {
            if(blocks[i] instanceof FuncClose){
                // console.log("    return;");
                // console.log("    }");
                s += "    return;\n";
                s += "    }\n";
            }
            else{
                // console.log("    " + c_ir_instruction_toString(ins));
                s += "    " + c_ir_instruction_toString(ins);
            }
        }

        if(blocks[i].jumpBlock !== null){
            // console.log("//JUMP: " + (blocks[i].jumpBlock.c_ir_instructions[0] as LabelDeclaration).label.name);
            s += ("//JUMP: " + (blocks[i].jumpBlock.c_ir_instructions[0] as LabelDeclaration).label.name) + "\n";
        }
        if(blocks[i].nextBlock !== null){
            if(blocks[i].nextBlock === blocks[i + 1]){
                // console.log("//HAS SIGUIENTE " + i);
                s += "//HAS SIGUIENTE " + i + "\n\n";
            }
            else{
                throw new Error("next debe ser igual al siguiente en la lista, antes de optimizar");
            }
        }
        else{
            // console.log("//END END " + i + "\n");
            s += "//END END " + i + "\n\n";
        }
        // console.log("//END BLOCK " + i);
        s += "//END BLOCK " + i + "\n";

    }
    console.log(s);
}

function debugPrintOptimizedGraphBlocks(blocks:Block[]):void{

    let s = "";
    let iter = blocks[0];
    let i = 0;
    while (iter !== null) {
        // console.log("//BEG BLOCK " + i);
        s += "//BEG BLOCK " + i + "\n";
        for (const ins of iter.c_ir_instructions) {
            if(iter instanceof FuncClose){
                // console.log("    return;");
                // console.log("    }");
                s += "    return;\n";
                s += "    }\n";
            }
            else{
                // console.log("    " + c_ir_instruction_toString(ins));
                s += "    " + c_ir_instruction_toString(ins);
            }
        }

        if(iter.jumpBlock !== null){
            // console.log("//JUMP: " + (iter.jumpBlock.c_ir_instructions[0] as LabelDeclaration).label.name);
            s += ("//JUMP: " + (iter.jumpBlock.c_ir_instructions[0] as LabelDeclaration).label.name) + "\n";
        }

        // console.log("//END BLOCK " + i);
        s += "//END BLOCK " + i + "\n";

        i++;
        iter = iter.nextBlock;
    }
    console.log(s);
}

//Si no hacemos optimizaciones por bloque aqui estan las de mirilla gratis:

    // let optimized_instructions = new Array<C_ir_instruction>();
    // for (let i = 0; i < code.length; i++) {
    //     let curr_ins = optimize_instruction(i, code[i]);
    //     if(curr_ins !== null){
    //         optimized_instructions.push(curr_ins);
    //     }
    // }

    // console.log(optimizations);

//KINDA CHAPUZ:
const TIPO_MIRILLA = "Mirilla"
const TIPO_BLOQUE = "Bloque"
//reglas:
const REGLA_1 = "regla 1";
const REGLA_2 = "regla 2";
const REGLA_3 = "regla 3";
const REGLA_4 = "regla 4";
const REGLA_5 = "regla 5";
const REGLA_6 = "regla 6";
const REGLA_7 = "regla 7";
const REGLA_8 = "regla 8";
const REGLA_9 = "regla 9";
const REGLA_10 = "regla 10";
const REGLA_11 = "regla 11";
const REGLA_12 = "regla 12";
const REGLA_13 = "regla 13";
const REGLA_14 = "regla 14";
const REGLA_15 = "regla 15";
const REGLA_16 = "regla 16";

//always returns a new instruction even if
//we dont change the instruction
//that might be a bad thing idk
//si retorna null es porque la optimizacion es eliminar la instruccion
//line es solo un chapuz para hacer el reporte
export function optimize_instruction(line:number, c_ir_ins:C_ir_instruction):(C_ir_instruction | null){

    if(c_ir_ins instanceof _3AddrAssignment){
        //IMPORTANTE:
        //ugh hay que hacer un branch por regla querramos o no :/ para el reporte
        //(si no hacemos 1 branch por regla se complica mas todavia)
        if(c_ir_ins.dest == c_ir_ins.left){
            switch(c_ir_ins.arithOp){
                case ArithOp.ADDITION:
                {
                    if(c_ir_ins.right instanceof Number && c_ir_ins.right.valueOf() == 0){
                        optimizations.push(new OptimizationEntry(
                            REGLA_6,
                            TIPO_MIRILLA,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                }break;
                case ArithOp.SUBSTRACTION:
                {
                    if(c_ir_ins.right instanceof Number && c_ir_ins.right.valueOf() == 0){
                        optimizations.push(new OptimizationEntry(
                            REGLA_7,
                            TIPO_MIRILLA,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                }break;
                case ArithOp.MULTIPLICATION:
                {
                    if(c_ir_ins.right instanceof Number && c_ir_ins.right.valueOf() == 1){
                        optimizations.push(new OptimizationEntry(
                            REGLA_8,
                            TIPO_MIRILLA,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                }break;
                case ArithOp.DIVISION:
                {
                    if(c_ir_ins.right instanceof Number && c_ir_ins.right.valueOf() == 1){
                        optimizations.push(new OptimizationEntry(
                            REGLA_9,
                            TIPO_MIRILLA,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                }break;
            }
            //dont optimize anything in default case and 'fall through?' case
            return new _3AddrAssignment(c_ir_ins.dest, c_ir_ins.left, c_ir_ins.arithOp, c_ir_ins.right);
        }
        else{
            //si llegamos a este punto del codigo es porque dest y left no son iguales
            switch(c_ir_ins.arithOp){
                case ArithOp.ADDITION:
                {
                    if(c_ir_ins.right instanceof Number && c_ir_ins.right.valueOf() == 0){
                        let newInstruction = new Assignment(c_ir_ins.dest, c_ir_ins.left);
                        optimizations.push(new OptimizationEntry(
                            REGLA_10,
                            TIPO_MIRILLA,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction), 
                            line.toString()
                        ));
                        return newInstruction;
                    }
                }break;
                case ArithOp.SUBSTRACTION:
                {
                    if(c_ir_ins.right instanceof Number && c_ir_ins.right.valueOf() == 0){
                        let newInstruction = new Assignment(c_ir_ins.dest, c_ir_ins.left);
                        optimizations.push(new OptimizationEntry(
                            REGLA_11,
                            TIPO_MIRILLA,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction), 
                            line.toString()
                        ));
                        return newInstruction;
                    }
                }break;
                case ArithOp.MULTIPLICATION:
                {
                    if(c_ir_ins.right instanceof Number){
                        if(c_ir_ins.right.valueOf() == 1){
                            let newInstruction = new Assignment(c_ir_ins.dest, c_ir_ins.left);
                            optimizations.push(new OptimizationEntry(
                                REGLA_12,
                                TIPO_MIRILLA,
                                c_ir_instruction_toString(c_ir_ins),
                                c_ir_instruction_toString(newInstruction), 
                                line.toString()
                            ));
                            return newInstruction;
                        }
                        else if(c_ir_ins.right.valueOf() == 2){
                            let newInstruction = new _3AddrAssignment(c_ir_ins.dest, c_ir_ins.left, ArithOp.ADDITION, c_ir_ins.right);
                            optimizations.push(new OptimizationEntry(
                                REGLA_14,
                                TIPO_MIRILLA,
                                c_ir_instruction_toString(c_ir_ins),
                                c_ir_instruction_toString(newInstruction), 
                                line.toString()
                            ));
                            return newInstruction;
                        }
                        else if(c_ir_ins.right.valueOf() == 0){
                            let newInstruction = new Assignment(c_ir_ins.dest, new Number(0));
                            optimizations.push(new OptimizationEntry(
                                REGLA_15,
                                TIPO_MIRILLA,
                                c_ir_instruction_toString(c_ir_ins),
                                c_ir_instruction_toString(newInstruction), 
                                line.toString()
                            ));
                            return newInstruction;
                        }
                    }
                }break;
                case ArithOp.DIVISION:
                {
                    if(c_ir_ins.right instanceof Number ){
                        if(c_ir_ins.right.valueOf() == 1){
                            let newInstruction = new Assignment(c_ir_ins.dest, c_ir_ins.left);
                            optimizations.push(new OptimizationEntry(
                                REGLA_13,
                                TIPO_MIRILLA,
                                c_ir_instruction_toString(c_ir_ins),
                                c_ir_instruction_toString(newInstruction),
                                line.toString()
                            ));
                            return newInstruction;
                        }
                        else if(c_ir_ins.right.valueOf() == 0){
                            let newInstruction = new Assignment(c_ir_ins.dest, new Number(0));
                            optimizations.push(new OptimizationEntry(
                                REGLA_16,
                                TIPO_MIRILLA,
                                c_ir_instruction_toString(c_ir_ins),
                                c_ir_instruction_toString(newInstruction),
                                line.toString()
                            ));
                            return newInstruction;
                        }
                    }
                }break;
            }
            //dont optimize anything in default case and 'fall through?' case
            //dont optimize anything in default case and 'fall through?' case
            return new _3AddrAssignment(c_ir_ins.dest, c_ir_ins.left, c_ir_ins.arithOp, c_ir_ins.right);
        }
    }
    //[!] dice que es tipo bloque pero en realidad es tipo mirilla, no se porque en el 
    //    enunciado ponen que es tipo bloque :/
    else if(c_ir_ins instanceof Cond_goto){
        if((c_ir_ins.leftVal instanceof Number) && (c_ir_ins.rightVal instanceof Number)){
            switch (c_ir_ins.relOperator) {
                case RelOp.LESS:
                    if(c_ir_ins.leftVal.valueOf() < c_ir_ins.rightVal.valueOf()){
                        let newInstruction = new Goto(c_ir_ins.label);
                        optimizations.push(new OptimizationEntry(
                            REGLA_3,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction),
                            line.toString()
                        ));
                        return newInstruction;
                    }
                    else{
                        optimizations.push(new OptimizationEntry(
                            REGLA_4,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                case RelOp.GREATER:
                    if(c_ir_ins.leftVal.valueOf() > c_ir_ins.rightVal.valueOf()){
                        let newInstruction = new Goto(c_ir_ins.label);
                        optimizations.push(new OptimizationEntry(
                            REGLA_3,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction),
                            line.toString()
                        ));
                        return newInstruction;
                    }
                    else{
                        optimizations.push(new OptimizationEntry(
                            REGLA_4,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                case RelOp.LESS_OR_EQUAL:
                    if(c_ir_ins.leftVal.valueOf() <= c_ir_ins.rightVal.valueOf()){
                        let newInstruction = new Goto(c_ir_ins.label);
                        optimizations.push(new OptimizationEntry(
                            REGLA_3,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction),
                            line.toString()
                        ));
                        return newInstruction;
                    }
                    else{
                        optimizations.push(new OptimizationEntry(
                            REGLA_4,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                case RelOp.GREATER_OR_EQUAL:
                    if(c_ir_ins.leftVal.valueOf() >= c_ir_ins.rightVal.valueOf()){
                        let newInstruction = new Goto(c_ir_ins.label);
                        optimizations.push(new OptimizationEntry(
                            REGLA_3,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction),
                            line.toString()
                        ));
                        return newInstruction;
                    }
                    else{
                        optimizations.push(new OptimizationEntry(
                            REGLA_4,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                case RelOp.EQUAL_EQUAL:
                    if(c_ir_ins.leftVal.valueOf() == c_ir_ins.rightVal.valueOf()){
                        let newInstruction = new Goto(c_ir_ins.label);
                        optimizations.push(new OptimizationEntry(
                            REGLA_3,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction),
                            line.toString()
                        ));
                        return newInstruction;
                    }
                    else{
                        optimizations.push(new OptimizationEntry(
                            REGLA_4,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
                case RelOp.NOT_EQUAL:
                    if(c_ir_ins.leftVal.valueOf() != c_ir_ins.rightVal.valueOf()){
                        let newInstruction = new Goto(c_ir_ins.label);
                        optimizations.push(new OptimizationEntry(
                            REGLA_3,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            c_ir_instruction_toString(newInstruction),
                            line.toString()
                        ));
                        return newInstruction;
                    }
                    else{
                        optimizations.push(new OptimizationEntry(
                            REGLA_4,
                            TIPO_BLOQUE,
                            c_ir_instruction_toString(c_ir_ins),
                            null, 
                            line.toString()
                        ));
                        return null;
                    }
            }           
        }
        else{
            return new Cond_goto(c_ir_ins.leftVal, c_ir_ins.relOperator, c_ir_ins.rightVal, c_ir_ins.label);
        }
    }
    //else memcopy
    else if(c_ir_ins instanceof LabelDeclaration){
        return new LabelDeclaration(c_ir_ins.label);
    }
    else if(c_ir_ins instanceof Assignment){
        return new Assignment(c_ir_ins.dest, c_ir_ins.source);
    }
    else if(c_ir_ins instanceof Goto){
        return new Goto(c_ir_ins.label);
    }
    else if(c_ir_ins instanceof FunctionCall){
        return new FunctionCall(c_ir_ins.funcName);
    }
    else if(c_ir_ins instanceof FuncOpening){
        return new FuncOpening(c_ir_ins.funcName);
    }
    else if(c_ir_ins instanceof FuncClose){
        return new FuncClose();
    }
    else if(c_ir_ins instanceof Debug_instruction){
        return new Debug_instruction(c_ir_ins.ins);
    }
    else if(c_ir_ins instanceof Comment){
        return new Comment(c_ir_ins.comment);
    }
    else{
        throw new Error(`optimize_instruction no implementado para '${c_ir_ins}'!`);
    }

}