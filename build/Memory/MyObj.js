"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyUndefined = exports.MyNull = exports.MyObj = void 0;
var MyType_1 = require("./MyType");
// Decision: El typo del objeto se va llevar en el valor del mismo no solo va ser algo que pongamos 
// en la tabla de simbolos como en c/c++. Lo vamos a guardar en la memoria de runtime, como en java
// Nota: no estoy seguro si asi es como se llevan los tipos en c/c++ y java, pero asi pareciera.
// Entonces algo como:
//   Object
//      ^
//      |
//   MyType
// //objFactory retorna un tipo Object
// let a:Object = objFactory("quiero fabricar un tipo: MyType");
// console.log(typeof a); // <---esto imprimiria MyType
var MyObj = /** @class */ (function () {
    //NO TYPECHECKING
    //hace typechecking pero no se espera que atrapemos esa exception.
    //la intencion es hacer un assert estilo c
    function MyObj(myType, value) {
        this.myType = myType;
        value = value;
        //TODO: assert que my type y value esten de acuerdo
    }
    //retorna true si y solo si es de tipo number, string o boolean
    MyObj.prototype.isPrimitive = function () {
        switch (this.myType.kind) {
            case MyType_1.MyTypeKind.NUMBER:
            case MyType_1.MyTypeKind.STRING:
            case MyType_1.MyTypeKind.BOOLEAN:
                return true;
            default:
                return false;
        }
    };
    MyObj.prototype.isNull = function () {
        return this.myType.kind == MyType_1.MyTypeKind.NULL;
    };
    MyObj.prototype.isUndefined = function () {
        return this.myType.kind == MyType_1.MyTypeKind.UNDEFINED;
    };
    return MyObj;
}());
exports.MyObj = MyObj;
//instancia unica de null y undef.
exports.MyNull = new MyObj(new MyType_1.MyType(MyType_1.MyTypeKind.NULL), null);
exports.MyUndefined = new MyObj(new MyType_1.MyType(MyType_1.MyTypeKind.UNDEFINED), undefined);
//TODO?: poner un asssert que no permita construir un objeto con value null 
//o undef con la unica excepcion de estos dos casos
