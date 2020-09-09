/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var RunnerParser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,9],$V1=[1,17],$V2=[1,11],$V3=[1,12],$V4=[1,7],$V5=[1,6],$V6=[1,10],$V7=[1,13],$V8=[1,14],$V9=[1,15],$Va=[1,16],$Vb=[5,11,12,16,17,20,30,35,37,38,39,40],$Vc=[1,21],$Vd=[1,22],$Ve=[1,23],$Vf=[1,24],$Vg=[1,25],$Vh=[1,26],$Vi=[1,27],$Vj=[1,28],$Vk=[1,29],$Vl=[1,30],$Vm=[1,31],$Vn=[1,32],$Vo=[1,33],$Vp=[1,35],$Vq=[1,36],$Vr=[9,19,20,21,22,23,24,25,26,27,28,29,31,32,36,43,44,45,46],$Vs=[9,19,20,21,22,23,24,25,26,27,28,29,36,43,46],$Vt=[2,42],$Vu=[9,19,20,24,25,26,27,28,29,36,43,46],$Vv=[9,19,20,21,22,24,25,26,27,28,29,36,43,46],$Vw=[9,28,29,36,43,46],$Vx=[36,43],$Vy=[9,13];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"S":3,"StatementList":4,"EOF":5,"StatementList_":6,"Statement":7,"Expression":8,";":9,"Declaration":10,"LET":11,"IDENTIFIER":12,"=":13,":":14,"Type":15,"NUMBER":16,"STRING":17,"BOOLEAN":18,"+":19,"-":20,"*":21,"/":22,"**":23,"<":24,"<=":25,">":26,">=":27,"==":28,"!=":29,"NOT":30,"++":31,"--":32,"MemberAccess":33,"F":34,"(":35,")":36,"TRUE":37,"FALSE":38,"NULL":39,"UNDEFINED":40,"ExpressionList_":41,"ExpressionList":42,",":43,".":44,"[":45,"]":46,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",9:";",11:"LET",12:"IDENTIFIER",13:"=",14:":",16:"NUMBER",17:"STRING",18:"BOOLEAN",19:"+",20:"-",21:"*",22:"/",23:"**",24:"<",25:"<=",26:">",27:">=",28:"==",29:"!=",30:"NOT",31:"++",32:"--",35:"(",36:")",37:"TRUE",38:"FALSE",39:"NULL",40:"UNDEFINED",43:",",44:".",45:"[",46:"]"},
productions_: [0,[3,2],[6,1],[6,0],[4,2],[4,1],[7,2],[7,2],[10,4],[10,6],[10,4],[15,1],[15,1],[15,1],[15,1],[8,3],[8,3],[8,3],[8,3],[8,3],[8,3],[8,3],[8,3],[8,3],[8,3],[8,3],[8,2],[8,2],[8,2],[8,2],[8,2],[8,1],[34,3],[34,1],[34,1],[34,1],[34,1],[34,1],[34,1],[34,1],[34,4],[41,1],[41,0],[42,3],[42,1],[33,5],[33,2],[33,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

        return $$[$0-1];
    
break;
case 2: case 31: case 41:

        this.$ = $$[$0];
    
break;
case 3: case 42:

        this.$ = new Array();
    
break;
case 4:

        this.$ = $$[$0-1];
        this.$.push($$[$0]);
    
break;
case 5: case 44:

        this.$ = new Array($$[$0]);
    
break;
case 6:

        this.$ = new Statement(StatementKind.ExpressionKind, $$[$0-1], _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 7:

        this.$ = new Statement(StatementKind.DeclarationKind, $$[$0-1], _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 8:

        this.$ = new Declaration($$[$0-2], null, $$[$0], _$[$0-3].first_line, _$[$0-3].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 9:

        this.$ = new Declaration($$[$0-4], $$[$0-2], $$[$0], _$[$0-5].first_line, _$[$0-5].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 10:

        this.$ = new Declaration($$[$0-3], $$[$0], null, _$[$0-3].first_line, _$[$0-3].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 11:

        this.$ = new MyTypeNode (MyTypeNodeKind.NUMBER, null);
    
break;
case 12:

        this.$ = new MyTypeNode (MyTypeNodeKind.STRING, null);
    
break;
case 13:

        this.$ = new MyTypeNode (MyTypeNodeKind.BOOLEAN, null);
    
break;
case 14:

        this.$ = new MyTypeNode (MyTypeNodeKind.CUSTOM, $$[$0]);
    
break;
case 15:

        this.$ = new Expression(ExpressionKind.ADDITION, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 16:

        this.$ = new Expression(ExpressionKind.SUBSTRACTION, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 17:
 
        this.$ = new Expression(ExpressionKind.MULTIPLICATION, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 18:

        this.$ = new Expression(ExpressionKind.DIVISION, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 19:

        this.$ = new Expression(ExpressionKind.POWER, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 20:

        this.$ = new Expression(ExpressionKind.LESS, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 21:

        this.$ = new Expression(ExpressionKind.LESS_OR_EQUAL, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 22:

        this.$ = new Expression(ExpressionKind.GREATER, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 23:

        this.$ = new Expression(ExpressionKind.GREATER_EQUAL, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 24:

        this.$ = new Expression(ExpressionKind.EQUAL, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 25:

        this.$ = new Expression(ExpressionKind.NOT_EQUAL, new BinaryExpression($$[$0-2], $$[$0]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 26:

        this.$ = new Expression(ExpressionKind.NOT, new UnaryExpression($$[$0]), _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 27:

        this.$ = new Expression(ExpressionKind.UNARY_MINUS, new UnaryExpression($$[$0]), _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 28:

        this.$ = new Expression(ExpressionKind.POSTFIX_INC, new UnaryExpression($$[$0-1]), _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 29:

        this.$ = new Expression(ExpressionKind.POSTFIX_DEC, new UnaryExpression($$[$0-1]), _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 30:

        this.$ = new Expression(ExpressionKind.MEMBER_ACCESS, new MemberAccessExpression($$[$0-1], $$[$0]), _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 32:
 
        //hay que pasar la ubicacion de inicio y final de los ( )
        this.$ = $$[$0-1];
        this.$.first_line = _$[$0-2].first_line;
        this.$.first_column = _$[$0-2].first_column;
        this.$.last_line = _$[$0].last_line;

        this.$.last_column = _$[$0].last_column;
    
break;
case 33:
 
        this.$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new Number($$[$0])), _$[$0].first_line, _$[$0].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 34:

        this.$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new String($$[$0])), _$[$0].first_line, _$[$0].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 35:

        this.$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new Boolean(true)), _$[$0].first_line, _$[$0].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 36:

        this.$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(new Boolean(false)), _$[$0].first_line, _$[$0].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 37:

        this.$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(null), _$[$0].first_line, _$[$0].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 38:

        this.$ = new Expression(ExpressionKind.LITERAL, new LiteralExpression(undefined), _$[$0].first_line, _$[$0].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 39:

        this.$ = new Expression(ExpressionKind.IDENTIFIER, new IdentifierExpression(new String($$[$0])), _$[$0].first_line, _$[$0].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 40:

        this.$ = new Expression(ExpressionKind.FUNCTION_CALL, new FunctionCallExpression(new String($$[$0-3]), $$[$0-1]), _$[$0-3].first_line, _$[$0-3].first_column, _$[$0-3].last_line, _$[$0-3].last_column);
    
break;
case 43:

        this.$ = $$[$0-2];
        this.$.push($$[$0]);
    
break;
case 45:

        this.$ = new MemberAccess(AccessKind.FunctionAccess, new FunctionAccess($$[$0-3], $$[$0-1]), _$[$0-4].first_line, _$[$0-4].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 46:

        this.$ = new MemberAccess(AccessKind.AttributeAccess, new AttributeAccess($$[$0]), _$[$0-1].first_line, _$[$0-1].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
case 47:

        this.$ = new MemberAccess(AccessKind.IndexAccess, new IndexAccess($$[$0-1]), _$[$0-2].first_line, _$[$0-2].first_column, _$[$0].last_line, _$[$0].last_column);
    
break;
}
},
table: [{3:1,4:2,7:3,8:4,10:5,11:$V0,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{1:[3]},{5:[1,18],7:19,8:4,10:5,11:$V0,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},o($Vb,[2,5]),{9:[1,20],19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,28:$Vl,29:$Vm,31:$Vn,32:$Vo,33:34,44:$Vp,45:$Vq},{9:[1,37]},{8:38,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:39,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},o($Vr,[2,31]),{12:[1,40]},{8:41,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},o($Vr,[2,33]),o($Vr,[2,34]),o($Vr,[2,35]),o($Vr,[2,36]),o($Vr,[2,37]),o($Vr,[2,38]),o($Vr,[2,39],{35:[1,42]}),{1:[2,1]},o($Vb,[2,4]),o($Vb,[2,6]),{8:43,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:44,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:45,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:46,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:47,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:48,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:49,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:50,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:51,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:52,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{8:53,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},o($Vr,[2,28]),o($Vr,[2,29]),o($Vr,[2,30]),{12:[1,54]},{8:55,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},o($Vb,[2,7]),o($Vs,[2,26],{33:34,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vs,[2,27],{33:34,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),{13:[1,56],14:[1,57]},{19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,28:$Vl,29:$Vm,31:$Vn,32:$Vo,33:34,36:[1,58],44:$Vp,45:$Vq},{8:61,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,36:$Vt,37:$V7,38:$V8,39:$V9,40:$Va,41:59,42:60},o($Vu,[2,15],{33:34,21:$Ve,22:$Vf,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vu,[2,16],{33:34,21:$Ve,22:$Vf,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vv,[2,17],{33:34,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vv,[2,18],{33:34,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vv,[2,19],{33:34,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vw,[2,20],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vw,[2,21],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vw,[2,22],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vw,[2,23],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vw,[2,24],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vw,[2,25],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vr,[2,46],{35:[1,62]}),{19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,28:$Vl,29:$Vm,31:$Vn,32:$Vo,33:34,44:$Vp,45:$Vq,46:[1,63]},{8:64,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{12:[1,69],15:65,16:[1,66],17:[1,67],18:[1,68]},o($Vr,[2,32]),{36:[1,70]},{36:[2,41],43:[1,71]},o($Vx,[2,44],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,28:$Vl,29:$Vm,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),{8:61,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,36:$Vt,37:$V7,38:$V8,39:$V9,40:$Va,41:72,42:60},o($Vr,[2,47]),{9:[2,8],19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,28:$Vl,29:$Vm,31:$Vn,32:$Vo,33:34,44:$Vp,45:$Vq},{9:[2,10],13:[1,73]},o($Vy,[2,11]),o($Vy,[2,12]),o($Vy,[2,13]),o($Vy,[2,14]),o($Vr,[2,40]),{8:74,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},{36:[1,75]},{8:76,12:$V1,16:$V2,17:$V3,20:$V4,30:$V5,34:8,35:$V6,37:$V7,38:$V8,39:$V9,40:$Va},o($Vx,[2,43],{33:34,19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,28:$Vl,29:$Vm,31:$Vn,32:$Vo,44:$Vp,45:$Vq}),o($Vr,[2,45]),{9:[2,9],19:$Vc,20:$Vd,21:$Ve,22:$Vf,23:$Vg,24:$Vh,25:$Vi,26:$Vj,27:$Vk,28:$Vl,29:$Vm,31:$Vn,32:$Vo,33:34,44:$Vp,45:$Vq}],
defaultActions: {18:[2,1]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

    const { Expression, ExpressionKind, UnaryExpression, BinaryExpression, TernaryExpression, LiteralExpression, IdentifierExpression, FunctionCallExpression, MemberAccessExpression} = require('../Ast/Expression');
    const { MemberAccess, AccessKind, FunctionAccess, IndexAccess, AttributeAccess } = require('../Ast/MemberAccess');
    const { Statement, StatementKind } = require('../Ast/Statement');
    const { Assignment } = require('../Ast/Assignment');
    const { Declaration } = require('../Ast/Declaration');
    const { MyTypeNode, MyTypeNodeKind } = require('../Ast/MyTypeNode');
    //const {Literal} = require('../Expression/Literal');
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-sensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:/* IGNORE */
break;
case 2:/* IGNORE */
break;
case 3:return 37
break;
case 4:return 38
break;
case 5:return 40
break;
case 6:return 39
break;
case 7:return 'OR'
break;
case 8:return 'AND'
break;
case 9:return 28
break;
case 10:return 29
break;
case 11:return 26
break;
case 12:return 24
break;
case 13:return 27
break;
case 14:return 25
break;
case 15:return 19
break;
case 16:return 20
break;
case 17:return 21
break;
case 18:return 22
break;
case 19:return '%'
break;
case 20:return 23
break;
case 21:return 30
break;
case 22:return 31
break;
case 23:return 32
break;
case 24:return 35
break;
case 25:return 36
break;
case 26:return 13
break;
case 27:return 44
break;
case 28:return 45
break;
case 29:return 46
break;
case 30:return 11
break;
case 31:return 16
break;
case 32:return 17
break;
case 33:return 18
break;
case 34:return 43
break;
case 35:return 9
break;
case 36:return '{'
break;
case 37:return '}'
break;
case 38:return 14
break;
case 39:return '~'
break;
case 40:return 5
break;
case 41:return 16
break;
case 42:return 12
break;
case 43:return 17
break;
}
},
rules: [/^(?:\s+)/,/^(?:\/\/.*)/,/^(?:[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/])/,/^(?:true\b)/,/^(?:false\b)/,/^(?:undefined\b)/,/^(?:null\b)/,/^(?:OR\b)/,/^(?:AND\b)/,/^(?:==)/,/^(?:!=)/,/^(?:>)/,/^(?:<)/,/^(?:>=)/,/^(?:<=)/,/^(?:\+)/,/^(?:-)/,/^(?:\*)/,/^(?:\/)/,/^(?:%)/,/^(?:\*\*)/,/^(?:NOT\b)/,/^(?:\+\+)/,/^(?:--)/,/^(?:\()/,/^(?:\))/,/^(?:=)/,/^(?:\.)/,/^(?:\[)/,/^(?:\])/,/^(?:let\b)/,/^(?:number\b)/,/^(?:string\b)/,/^(?:boolean\b)/,/^(?:,)/,/^(?:;)/,/^(?:\{)/,/^(?:\})/,/^(?::)/,/^(?:~)/,/^(?:$)/,/^(?:[0-9]+(\.[0-9]+)?)/,/^(?:([a-zA-Z_])[a-zA-Z0-9_????]*)/,/^(?:("[^"]*"))/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = RunnerParser;
exports.Parser = RunnerParser.Parser;
exports.parse = function () { return RunnerParser.parse.apply(RunnerParser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    //var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
