//solo porque necesitamos mantener el c_ir generado en dos grupos diferentes
//porque al agregar el header y el foot necesitamos que statements este dentro de main
//pero que funcs_c_ir este antes de de main
export class Global_c_ir{
    constructor(
        public funcs_c_ir:string,
        public statements_c_ir:string,
    ){   }
}