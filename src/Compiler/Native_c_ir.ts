//MEJORA?: group all this in a bunch of smaller nested modules
//         like Native_c_ir.Reg.param1 or something like that
//solo para no tener el monton de string literals dentro de la funcion construct_c_ir_header
//en Compiler.ts
export module Native_c_ir{

    export const nativeTemps = "double _param1, _param2, _local1, _local2, _return1;\n"

    export const _param1 = new String("_param1");
    export const _param2 = new String("_param2");

    export const _local1 = new String("_local1");
    export const _local2 = new String("_local2");

    export const funcDefs = `
//params: _param1 boolean value
//return: _return1 pointer to a newly allocated string
//maps to nothing, its call by string concatenation
void _boolean_to_string(){
    if (_param1 == 0) goto _false_string;
    _return1 = 6;//pointer to 'true' string
    goto _end;
_false_string:
    _return1 = 0;//pointer to 'false' string
_end:
    return;
}

//params: _param1 number value
//return: _return1 pointer to a newly allocated string
//maps to nothing, its call by string concatenation
void _number_to_string(){
    if(fmod(T1, 1)){//is integer

    }
    else{

    }
}

//maps to console.log(bool);
void _log_boolean(){
    if (_param1 == 0) goto _log_false;
    printf("t");
    printf("r");
    printf("u");
    printf("e");
    printf("\\n");
    goto _end;
_log_false:
    printf("f");
    printf("a");
    printf("l");
    printf("s");
    printf("e");
    printf("\\n");
_end:
    return;
}

//maps to console.log(bool);
void _log_number(){
    _local1 = fmod(_param1, 1);
    if(_local1 != 0) goto _not_integer;//is not integer
    printf("%d", (int)_param1);
    goto _end;
_not_integer:
    printf("%lf", _param1);
_end:
    printf("\\n");
}

//maps to console.log(string);
void _log_string(){

    //end = size + pointer + 1
    _local1 = heap[(int)_param1] + _param1;
    _local1 = _local1 + 1;//end
    //beg = param1 + 1; porque lo primero que esta en un string (a lo que se apunta)
    //                  es su tamanno, no su primer caracter
    _param1 = _param1 + 1;//beg

    double iter = _param1;
    double end = _local1;

    //if iter == end then return
_loop:
    if ((int)iter == (int)end) goto _end;
    printf("%c", (char)heap[(int)iter]);
    iter = iter + 1;
    goto _loop;
_end:
    printf("\\n");
    return;
}

//maps to string.CharAt();
void _string_CharAt(){

}

//maps to string.ToLower();
void _string_ToLower(){

}

//maps to string.ToUpper();
void _string_ToUpper(){

}

//maps to string.concat();
void _string_Concat(){

}

//[?]
//maps to new Array() kinda. but I have no fucking idea
void _new_array(){

}

void _number_pow_number(){

}

`;

    export const stringLitsInitialization = `
heap[0] = 5;//'size'
heap[1] = 102;//'f'
heap[2] = 97;//'a'
heap[3] = 108;//'l'
heap[4] = 115;//'s'
heap[5] = 101;//'e'
heap[6] = 4;//'size'
heap[7] = 116;//'t'
heap[8] = 114;//'r'
heap[9] = 117;//'u'
heap[10] = 101;//'e'
`;
    export const stringLitsSize = 11;

    //MEJORA: find a way to store the native function signatures better.
    //        we should be able to see what params it expects and all that
    //some native function names
    export let logBoolean = "_log_boolean";
    export let logNumber = "_log_number";
    export let logString = "_log_string";
}   