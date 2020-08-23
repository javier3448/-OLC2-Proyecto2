"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pointer = void 0;
var MyObj_1 = require("./MyObj");
var MyType_1 = require("./MyType");
//Hicimos esta clase porque ser requieren dos niveles de punteros para implementar el comportamiento pasar parametros por
//ref y setear dos simbolos al mismo objeto
//        |Symbol|*|---->|Pointer|*|----->|MyObj|
//                        ^                   ^
//                        |                   |
//        |Symbol|*|------+                   | 
//        //Si queremos que un                |
//        //simbolo sea referencia de otro    |
//        //(ejmplo: al llamar un metodo)     |
//                                            |
//        |Symbol|*|---->|Pointer|*|----------+//Si queremos que dos simbolos apunten al mismo objeto
//                                             //como al hacer asignaciones
//                                             //(a = new obj;
//                                                b = a;)
var Pointer = /** @class */ (function () {
    function Pointer() {
        this.myObj = new MyObj_1.MyObj(new MyType_1.MyType(MyType_1.MyTypeKind.BOOLEAN), null);
    }
    Pointer.prototype.getValue = function () {
        return this.myObj.value;
    };
    Pointer.prototype.getType = function () {
        return this.myObj.myType;
    };
    //NO TYPECHECKING
    Pointer.prototype.setValue = function (myObj) {
        var originalType = this.getType();
        if (myObj.isPrimitive()) {
            //TODO
        }
        if (myObj.value instanceof Number) {
        }
    };
    return Pointer;
}());
exports.Pointer = Pointer;
