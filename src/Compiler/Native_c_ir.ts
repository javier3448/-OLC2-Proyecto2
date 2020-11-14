//MEJORA?: group all this in a bunch of smaller nested modules
//         like Native_c_ir.Reg.param1 or something like that
//solo para no tener el monton de string literals dentro de la funcion construct_c_ir_header

import { Assignment, Mem } from './C_ir_instruction';

//en Compiler.ts
export module Native_c_ir{

    export const nativeTemps = "double _param1, _param2, _local1, _local2, _local3, _local4, _return1, _isNegative, _num, _auxNum, _pointerToSize, _digit, _mostSignificantDigit, _leastSignificantDigit, _iter, _fractionalPart, _native_temp1;\n"

    export const _param1 = new String("_param1");
    export const _param2 = new String("_param2");

    export const _return1 = new String("_return1");

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

    //Temps reservados para number_to_string
    //params: _param1 number value
    //return: _return1 pointer to a newly allocated string
    //maps to nothing, its call by string concatenation
    void _number_to_string(){
        _num = _param1;

        //Le quitamos el negativo (esto afecta a la parte que hace el string despues del punto tambien)
        //por eso no lo ponemos en auxNum
        _isNegative = _num < 0;
        if(_isNegative == 0) goto _NotNegative1;
        _num = -_num;
        goto _EndIsNegative1;
        _NotNegative1:
        //_num = _num;
        _EndIsNegative1:


        //hacemos la parte antes del punto. Siempre!
        _auxNum = (int)_num;
        //hasta 8 digitos para los enteros porque el float
        //tiene entero 100% preciso hasta el entero (16,777,217)
        //(no es una muy buena razon pero es mejor que nada :/)

        //reservamos el espacio en el heap
        //+1 por el size
        _mostSignificantDigit = h + 1;
        h = h + 9;
        _leastSignificantDigit = h - 1;//(inclusive)
        _iter = _leastSignificantDigit;

        if(_auxNum == 0)goto _AuxNumIs0;
        goto _AuxNumIsNot0;

        _AuxNumIs0:
            _pointerToSize = _leastSignificantDigit - 1;
            heap[(int)_leastSignificantDigit] = (int)'0';
            heap[(int)_pointerToSize] = 1;
            if(_isNegative == 0) goto _isNotNegative1;
            heap[(int)_pointerToSize] = (int)'-';
            _pointerToSize = _pointerToSize - 1;
            _native_temp1 = _leastSignificantDigit - _pointerToSize;
            heap[(int)_pointerToSize] = _native_temp1;
        _isNotNegative1:
        goto _AuxNumIsEnd;

        _AuxNumIsNot0:
            _loop_back:
                if((int)_auxNum == 0) goto _loop_break;
                if(_iter < _mostSignificantDigit) goto _loop_break;
                _digit = (int)_auxNum % 10;
                _native_temp1 = (int)'0' + _digit;
                heap[(int)_iter] = _native_temp1;
                _auxNum = _auxNum / 10;
                _iter = _iter - 1;
                goto _loop_back;
                _loop_break:
                _pointerToSize = _iter;

            if(_isNegative == 0) goto _isNegative2;
            heap[(int)_pointerToSize] = (int)'-';
            _pointerToSize = _pointerToSize - 1;
            _isNegative2:
            _native_temp1 = _leastSignificantDigit - _pointerToSize;
            heap[(int)_pointerToSize] = _native_temp1;

        _AuxNumIsEnd:

        //Hacemos la parte despues del punto (de ser necesario)
        //Remember: at this point pointerToSize is valid and we can use it
        _fractionalPart = fmod(_num, 1);
        if(_fractionalPart == 0) goto _hasNoFractionalPart;
        //at the end we will have reserved another 6 spaces in the heap
        //we add the dot
        heap[(int)h] = (int)'.';
        h = h + 1;
        _fractionalPart = _fractionalPart * 10;
        _digit = (int)'0' + (int)_fractionalPart;
        heap[(int)h] = _digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        _fractionalPart = fmod(_fractionalPart, 1);
        _fractionalPart = _fractionalPart * 10;
        _digit = (int)'0' + (int)_fractionalPart;
        heap[(int)h] = _digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        _fractionalPart = fmod(_fractionalPart, 1);
        _fractionalPart = _fractionalPart * 10;
        _digit = (int)'0' + (int)_fractionalPart;
        heap[(int)h] = _digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        _fractionalPart = fmod(_fractionalPart, 1);
        _fractionalPart = _fractionalPart * 10;
        _digit = (int)'0' + (int)_fractionalPart;
        heap[(int)h] = _digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        _fractionalPart = fmod(_fractionalPart, 1);
        _fractionalPart = _fractionalPart * 10;
        _digit = (int)'0' + (int)_fractionalPart;
        heap[(int)h] = _digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        _fractionalPart = fmod(_fractionalPart, 1);
        //cambiamos el size de ultimo
        _native_temp1 = heap[(int)_pointerToSize];
        _native_temp1 = _native_temp1 + 6;
        heap[(int)_pointerToSize] = _native_temp1;
        //retornamos (totalmente innecesario cambio de reg pero es para que se entienda mejor)
        _hasNoFractionalPart:
        _return1 = _pointerToSize;
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
        _native_temp1 = heap[(int)_param1];
        _local1 = _native_temp1 + _param1;
        _local1 = _local1 + 1;//end
        //beg = param1 + 1; porque lo primero que esta en un string (a lo que se apunta)
        //                  es su tamanno, no su primer caracter
        _param1 = _param1 + 1;//beg

        //if iter == end then return
    _loop:
        if ((int)_param1 == (int)_local1) goto _end;
        _native_temp1 = heap[(int)_param1];
        printf("%c", (char)_native_temp1);
        _param1 = _param1 + 1;
        goto _loop;
    _end:
        printf("\\n");
        return;
    }

    //maps to string.CharAt();
    //_param1 string
    //_param2 number of index
    void _string_CharAt(){
        _local1 = _param1 + _param2;
        _local1 = _local1 + 1;

        //hacemos otro string
        heap[(int)h] = 1;
        h = h + 1;
        _native_temp1 = heap[(int)_local1];
        heap[(int)h] = _native_temp1;
        h = h + 1;

        _return1 = h - 2;
    }

    //maps to string.ToLower();
    //_param1 string
    void _string_ToLower(){
        //hacemos el nuevo string

        //puntero al nuevo string donde inician los caracteres, no donde esta el size:
        _local1 = h + 1;
        //puntero al nuevo string:
        _return1 = h;
        //seteamos el size del nuevo string
        _native_temp1 = heap[(int)_param1];
        heap[(int)h] = _native_temp1;
        //reservamos el espacio para el nuevo string
        _native_temp1 = heap[(int)_param1];
        h = h + _native_temp1;
        h = h + 1;

        //para que apuntemos a donde estan los caracteres y no donde esta el size
        _param1 = _param1 + 1;
        _loop_back:
        if(_local1 >= h) goto _end_loop;

        _native_temp1 = heap[(int)_param1];
        if(_native_temp1 < 65) goto _dont_change;
        if(_native_temp1 > 90) goto _dont_change;
        _change:
        _native_temp1 = heap[(int)_param1];
        _native_temp1 = _native_temp1 + 32;
        heap[(int)_local1] = _native_temp1;
        goto _end_if;
        _dont_change:
        _native_temp1 = heap[(int)_param1];
        heap[(int)_local1] = _native_temp1;

        _end_if:
        _param1 = _param1 + 1;
        _local1 = _local1 + 1;
        goto _loop_back;
        _end_loop:

        return;
    }

    //maps to string.ToUpper();
    void _string_ToUpper(){
        //hacemos el nuevo string

        //puntero al nuevo string donde inician los caracteres, no donde esta el size:
        _local1 = h + 1;
        //puntero al nuevo string:
        _return1 = h;
        //seteamos el size del nuevo string
        _native_temp1 = heap[(int)_param1];
        heap[(int)h] = _native_temp1;
        //reservamos el espacio para el nuevo string
        _native_temp1 = heap[(int)_param1];
        h = h + _native_temp1;
        h = h + 1;

        //para que apuntemos a donde estan los caracteres y no donde esta el size
        _param1 = _param1 + 1;
        _loop_back:
        if(_local1 >= h) goto _end_loop;

        _native_temp1 = heap[(int)_param1];
        if(_native_temp1 < 97) goto _dont_change;
        if(_native_temp1 > 122) goto _dont_change;
        _change:
        _native_temp1 = heap[(int)_param1];
        _native_temp1 = _native_temp1 - 32;
        heap[(int)_local1] = _native_temp1;
        goto _end_if;
        _dont_change:
        _native_temp1 = heap[(int)_param1];
        heap[(int)_local1] = _native_temp1;

        _end_if:
        _param1 = _param1 + 1;
        _local1 = _local1 + 1;
        goto _loop_back;
        _end_loop:

        return;
    }

    //maps to string.concat();
    //_param1: left string
    //_param2: right string
    //_return1: resulting string
    void _string_Concat(){
        //right size
        _local1 = heap[(int)_param1];
        _param1 = _param1 + 1;
        //left size
        _local2 = heap[(int)_param2];
        _param2 = _param2 + 1;
        //new size
        _return1 = h;
        heap[(int)h] = _local1 + _local2;
        h = h + 1;

        //counter
        _local3 = 0;

        _write_left_string_loop:
        if(_local3 >= _local1) goto end_write_left_string_loop;
        _native_temp1 = heap[(int)_param1];
        heap[(int)h] = _native_temp1;
        h = h + 1;
        _param1 = _param1 + 1;
        _local3 = _local3 + 1;
        goto _write_left_string_loop;
        end_write_left_string_loop:

        _local3 = 0;
        _write_right_string_loop:
        if(_local3 >= _local2) goto end_write_right_string_loop;
        _native_temp1 = heap[(int)_param2];
        heap[(int)h] = _native_temp1;
        h = h + 1;
        _param2 = _param2 + 1;
        _local3 = _local3 + 1;
        goto _write_right_string_loop;
        end_write_right_string_loop:

        return;
    }

    //_param1: num izq
    //_param2: num der
    //_param1 ** _param2
    void _number_pow_number(){
        //accumlator
        _return1 = 1;
        //convertimos a entero
        _param1 = (int)_param1;
        _param2 = (int)_param2;

        _loop_back:
        if(_param2 <= 0) goto _end_loop;
        _return1 = _return1 * _param1;
        _param2 = _param2 - 1;
        goto _loop_back;
        _end_loop:
        return;
    }

    //_param1:  leftString
    //_param2:  rightString
    //_return1  0: they are not equal
    //          1: they are equal
    void _string_equal_string(){

        //Verificamos en caso que 1 o mas sean null
        if(_param1 == -1) goto _param1_is_null;
        //here param1 is not null
        if(_param2 != -1) goto _compare_strings;//neither is null
        goto _return_false; //param1 not null, param2 null

        _param1_is_null:
        if(_param2 == -1) goto _return_true;//param1 null, param2 not null
        goto _return_false;//param1 null, param2 not null


        _compare_strings:
        _native_temp1 = heap[(int)_param1];
        _local3 = _param1 + _native_temp1;//pointer to end of first string
        _local3 = _local3 + 1;
        _loop_back:
        if(_param1 == _local3) goto _return_true;
        _local1 = heap[(int)_param1];
        _local2 = heap[(int)_param2];
        if(_local1 != _local2) goto _return_false;
        _param1 = _param1 + 1;
        _param2 = _param2 + 1;
        goto _loop_back;

        _return_true:
        _return1 = 1;
        goto _end;

        _return_false:
        _return1 = 0;

        _end:
        return;
    }

    //_param1: leftString
    //_param2: rightString
    void _string_not_equal_string(){
         //chapuz: solo negamos el return _string_equal_string
         _string_equal_string();
         if(_return1 == 1) goto _return_false;
         _return1 = 1;
         goto _end;
        _return_false:
        _return1 = 0;
        _end:
        return;
    }
`;

    export const stringLitsInitialization = [
        new Assignment(Mem.heapAccess(new Number(0)), new Number(5)),    //'size'
        new Assignment(Mem.heapAccess(new Number(1)), new Number(102)),  //'f'
        new Assignment(Mem.heapAccess(new Number(2)), new Number(97)),   //'a'
        new Assignment(Mem.heapAccess(new Number(3)), new Number(108)),  //'l'
        new Assignment(Mem.heapAccess(new Number(4)), new Number(115)),  //'s'
        new Assignment(Mem.heapAccess(new Number(5)), new Number(101)),  //'e'
        new Assignment(Mem.heapAccess(new Number(6)), new Number(4)),    //'size'
        new Assignment(Mem.heapAccess(new Number(7)), new Number(116)),  //'t'
        new Assignment(Mem.heapAccess(new Number(8)), new Number(114)),  //'r'
        new Assignment(Mem.heapAccess(new Number(9)), new Number(117)),  //'u'
        new Assignment(Mem.heapAccess(new Number(10)), new Number(101)), //'e'
    ];

    //MEJORA: find a way to store the native function signatures better.
    //        we should be able to see what params it expects and all that
    //some native function names
    export let logBoolean = "_log_boolean";
    export let logNumber = "_log_number";
    export let logString = "_log_string";
    export let booleanToString = "_boolean_to_string";
    export let numberToString = "_number_to_string";
    export let power = "_number_pow_number";
    export let stringConcat = "_string_Concat";
    export let stringCharAt = "_string_CharAt";
    export let stringToUpperCase = "_string_ToUpper";
    export let stringToLowerCase = "_string_ToLower";
    export let stringEqualString = "_string_equal_string";
    export let stringNotEqualString = "_string_not_equal_string";
}   