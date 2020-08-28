"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
var test1_1 = require("./test1");
var Node = /** @class */ (function () {
    function Node() {
        this.nodeId = ++test1_1.BaseNode.baseNodeId;
    }
    Node.prototype.getId = function () {
        return this.nodeId;
    };
    return Node;
}());
exports.Node = Node;
