#include <stdio.h>
//TODO: Ver que tamano de stack es mejor (deberia ser mucho mas pequenno que el heap)
double heap[0xfffff];
double stack[0xfffff];
double p = 0;
double h = 0;
double T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30, T31, T32, T33, T34, T35, T36, T37, T38, T39, T40, T41, T42, T43, T44, T45, T46, T47, T48, T49, T50, T51, T52, T53, T54, T55;
double _param1, _param2, _local1, _local2, _return1;

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
    double num = _param1;
    double auxNum;

    double pointerToSize;
    double digit;

    //Le quitamos el negativo (esto afecta a la parte que hace el string despues del punto tambien)
    //por eso no lo ponemos en auxNum
    double isNegative = num < 0;
    if(isNegative){
        num = -num;
    }
    else{
        num = num;
    }
    //hacemos la parte antes del punto. Siempre!
    {
        auxNum = (int)num;
        //hasta 8 digitos para los enteros porque el float
        //tiene entero 100% preciso hasta el entero (16,777,217)
        //(no es una muy buena razon pero es mejor que nada :/)

        //reservamos el espacio en el heap
        //+1 por el size
        double mostSignificantDigit = h + 1;
        h = h + 9;
        double leastSignificantDigit = h - 1;//(inclusive)
        double iter = leastSignificantDigit;
        //the first digit (from
        //double pointerToSize;

        if(auxNum == 0){
            pointerToSize = leastSignificantDigit - 1;
            heap[(int)leastSignificantDigit] = (int)'0';
            heap[(int)pointerToSize] = 1;
            if(isNegative){
                heap[(int)pointerToSize] = (int)'-';
                pointerToSize = pointerToSize - 1;
                heap[(int)pointerToSize] = leastSignificantDigit - pointerToSize;
            }
        }
        else{
            while(1){
                if((int)auxNum == 0){
                    pointerToSize = iter;
                    break;
                }
                if(iter < mostSignificantDigit){
                    pointerToSize = iter;
                    break;
                }
                digit = (int)auxNum % 10;
                heap[(int)iter] = (int)'0' + digit;
                auxNum = auxNum / 10;
                iter--;
            }
            if(isNegative){
                heap[(int)pointerToSize] = (int)'-';
                pointerToSize = pointerToSize - 1;
            }
            heap[(int)pointerToSize] = leastSignificantDigit - pointerToSize;
        }
    }

    //Hacemos la parte despues del punto (de ser necesario)
    //Remember: at this point pointerToSize is valid and we can use it
    double fractionalPart = fmod(num, 1);
    if(fractionalPart != 0)
    {
        //at the end we will have reserved another 6 spaces in the heap
        //we add the dot
        heap[(int)h] = (int)'.';
        h = h + 1;

        fractionalPart = fractionalPart * 10;
        digit = (int)'0' + (int)fractionalPart;
        heap[(int)h] = digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        fractionalPart = fmod(fractionalPart, 1);
        fractionalPart = fractionalPart * 10;
        digit = (int)'0' + (int)fractionalPart;
        heap[(int)h] = digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        fractionalPart = fmod(fractionalPart, 1);
        fractionalPart = fractionalPart * 10;
        digit = (int)'0' + (int)fractionalPart;
        heap[(int)h] = digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        fractionalPart = fmod(fractionalPart, 1);
        fractionalPart = fractionalPart * 10;
        digit = (int)'0' + (int)fractionalPart;
        heap[(int)h] = digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        fractionalPart = fmod(fractionalPart, 1);
        fractionalPart = fractionalPart * 10;
        digit = (int)'0' + (int)fractionalPart;
        heap[(int)h] = digit;
        h = h + 1;
        //so fucking expensive you should be ashemed :(((((
        fractionalPart = fmod(fractionalPart, 1);

        //cambiamos el size de ultimo
        heap[(int)pointerToSize] = heap[(int)pointerToSize] + 6;
    }
    //retornamos (totalmente innecesario cambio de reg pero es para que se entienda mejor)
    _return1 = pointerToSize;
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

    double iter = _param1;
    double end = _local1;

    //if iter == end then return
_loop:
    if ((int)iter == (int)end) goto _end;
    printf("%c", (char)heap[(int)iter]);
    iter = iter + 1;
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


    _param1 = _return1;
    _log_string();

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
//-12345678.12345
//87654321.65432
//-87654321.65432
//0
//0.12345
//-0.12345
