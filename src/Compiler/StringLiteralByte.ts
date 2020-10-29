//DEBUGGING ONLY: we have it just to generate a commment next to the byte initialization
//                that tells us if said byte represents the size of the string or one of
//                its chars
//BADish perf
//TODO: think of a better name
//nos indica si value representa un char o un sizeof string
//nuestro c_ir 'byte' (ie 'smallest addressable unit of memory', in this context)
//is a double (64 bit float)
export class StringLiteralByte{
    constructor(
        public isSize:boolean,
        public val:number
    ){   }
}