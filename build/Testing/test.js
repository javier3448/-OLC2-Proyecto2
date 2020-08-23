"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Translator_1 = require("../Translator/Translator");
var fs_1 = __importDefault(require("fs"));
// test1
{
    var inputFile = './TestFiles/input1.myts';
    var source = fs_1.default.readFileSync(inputFile).toString();
    console.log(source);
    var root = Translator_1.translate(source);
    console.log(root);
    console.log(root.children[0]);
}
