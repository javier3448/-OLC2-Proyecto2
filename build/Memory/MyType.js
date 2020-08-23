"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyType = exports.MyTypeKind = void 0;
var MyTypeKind;
(function (MyTypeKind) {
    MyTypeKind[MyTypeKind["NUMBER"] = 0] = "NUMBER";
    MyTypeKind[MyTypeKind["STRING"] = 1] = "STRING";
    MyTypeKind[MyTypeKind["BOOLEAN"] = 2] = "BOOLEAN";
    MyTypeKind[MyTypeKind["NULL"] = 3] = "NULL";
    MyTypeKind[MyTypeKind["UNDEFINED"] = 4] = "UNDEFINED";
    MyTypeKind[MyTypeKind["CUSTOM"] = 5] = "CUSTOM";
})(MyTypeKind = exports.MyTypeKind || (exports.MyTypeKind = {}));
//describe el tipo de un chunk of memory.
//Hicimos una clase y no un simple enum porque el usuario puede definir sus propios tipos
//y la signature de dicho tipo esta en un objeto en algun otro lugar
var MyType = /** @class */ (function () {
    //TODO:
    // optional pointer to MyCustomType en la tabla de simbolos\
    // recordar que no podemos especificar el tipo custom solo con su nombre
    // porque pueden existir dos tipos con el mismo nombre siempre y cuando esten 
    // en diferentes scopes
    function MyType(kind) {
        this.kind = kind;
        //this.pointer_to_Custom = bleh;
        //TODO?: Assertions que si kind no es custom entonces pointer to custom DEBE SER null
    }
    return MyType;
}());
exports.MyType = MyType;
