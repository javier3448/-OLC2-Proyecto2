#include <stdio.h>
//TODO: Ver que tamano de stack es mejor (deberia ser mucho mas pequenno que el heap)
double heap[0xfffff];
double stack[0xfffff];
double p = 0;
double h = 0;
double T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30, T31, T32, T33, T34, T35, T36, T37, T38, T39, T40, T41, T42, T43, T44, T45, T46, T47, T48, T49, T50, T51, T52, T53, T54, T55;
double _param1, _param2, _local1, _local2, _return1;
double _isNegative, _num, _auxNum, _pointerToSize, _digit, _mostSignificantDigit, _leastSignificantDigit, _iter, _fractionalPart;

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
        heap[(int)_pointerToSize] = _leastSignificantDigit - _pointerToSize;
    _isNotNegative1:
    goto _AuxNumIsEnd;

    _AuxNumIsNot0:
        _loop_back:
            if((int)_auxNum == 0) goto _loop_break;
            if(_iter < _mostSignificantDigit) goto _loop_break;
            _digit = (int)_auxNum % 10;
            heap[(int)_iter] = (int)'0' + _digit;
            _auxNum = _auxNum / 10;
            _iter = _iter - 1;
            goto _loop_back;
            _loop_break:
            _pointerToSize = _iter;

        if(_isNegative == 0) goto _isNegative2;
        heap[(int)_pointerToSize] = (int)'-';
        _pointerToSize = _pointerToSize - 1;
        _isNegative2:
        heap[(int)_pointerToSize] = _leastSignificantDigit - _pointerToSize;

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
    heap[(int)_pointerToSize] = heap[(int)_pointerToSize] + 6;
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
    printf("\n");
    goto _end;
_log_false:
    printf("f");
    printf("a");
    printf("l");
    printf("s");
    printf("e");
    printf("\n");
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
    printf("\n");
}

//maps to console.log(string);
void _log_string(){

    //end = size + pointer + 1
    _local1 = heap[(int)_param1] + _param1;
    _local1 = _local1 + 1;//end
    //beg = param1 + 1; porque lo primero que esta en un string (a lo que se apunta)
    //                  es su tamanno, no su primer caracter
    _param1 = _param1 + 1;//beg

    //if iter == end then return
_loop:
    if ((int)_param1 == (int)_local1) goto _end;
    printf("%c", (char)heap[(int)_param1]);
    _param1 = _param1 + 1;
    goto _loop;
_end:
    printf("\n");
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
//1234
//[ h+9 ]:10^0 4 num ends as 123
//[ h+8 ]:10^1 3 num ends as 12
//[ h+7 ]:10^2 2 num ends as 1
//[ h+6 ]:10^3 1 num ends as 0
//[ h+5 ]:10^4 0 num is 0 so we take T
//[ h+4 ]:10^5 0
//[ h+3 ]:10^6 0
//[ h+2 ]:10^7 0
//[ h+1 ]:signo
//[ h+0 ]:sizeOfString (only in case we need all 8 digits and sign)
//HEAP
//We always allocate at leat 9 possitions
//To avoid returning with leading zeros we find the position at which
//num becomes 0 lets call it T.
//if sign==true { heap[T]='-' T++; }
//we do heap[T]=posOfLeastSignificantDigit - T
//and return T
//There is a fuck ton of weird shit going on here because of converting int to double
//viceversa AND using double for comparisons
int main(){
    _param1 = 1234;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = -1234;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = 1234578.12345;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = -1234578.12345;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = 87654321.654321;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = -87654321.654321;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = 0;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = 0.12345;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    _param1 = -0.12345;
    _number_to_string();
    //we get the result in _return1
    _param1 = _return1;
    _log_string();

    return 0;
}
//OUTPUT OF TESTS SHOULD LOOK LIKE THIS:
//1234
//-1234
//12345678.12345
//87654321.65432
//-87654321.65432
//0
//0.12345
//-0.12345
