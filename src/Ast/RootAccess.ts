import { MemberAccess } from "./MemberAccess";
import { AstNode } from "./AstNode";
import { Expression } from "./Expression";

export class RootAccess {
    public astNode:AstNode;

    expression:Expression;
    memberAccesses:Array<MemberAccess>;

    constructor(expression:Expression, memberAccesses:Array<MemberAccess>) {
        this.expression = expression;
        this.memberAccesses = memberAccesses;
    }
}