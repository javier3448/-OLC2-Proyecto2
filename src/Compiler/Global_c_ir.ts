import { C_ir_instruction } from "./C_ir_instruction";
//solo porque necesitamos mantener el c_ir generado en dos grupos diferentes
//porque al agregar el header y el foot necesitamos que statements este dentro de main
//pero que funcs_c_ir este antes de de main
export class Global_c_ir{
    constructor(
        public funcs_c_ir:C_ir_instruction[],
        public main_c_ir:C_ir_instruction[],
    ){   }
}