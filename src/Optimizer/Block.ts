import { C_ir_instruction } from "../Compiler/C_ir_instruction";


//un bloque solo puede tener 2 arcos.
//un bloque debe tener nextBlock a menos que sea el ultimo bloque de todo el codigo
export class Block{
    constructor(
        public c_ir_instructions:C_ir_instruction[],
        public nextBlock:(Block | null),
        public jumpBlock:(Block | null),
    ) {   }

}