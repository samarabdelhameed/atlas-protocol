module.exports=[41704,a=>{"use strict";let b;var c,d,e,f,g,h,i,j,k=a.i(87924),l=a.i(72131);class m extends Error{response;request;constructor(a,b){super(`${m.extractMessage(a)}: ${JSON.stringify({response:a,request:b})}`),Object.setPrototypeOf(this,m.prototype),this.response=a,this.request=b,"function"==typeof Error.captureStackTrace&&Error.captureStackTrace(this,m)}static extractMessage(a){return a.errors?.[0]?.message??`GraphQL Error (Code: ${String(a.status)})`}}let n=a=>"function"==typeof a?a():a,o=(a,b)=>a.map((a,c)=>[a,b[c]]),p=a=>{let b={};return a instanceof Headers?b=q(a):Array.isArray(a)?a.forEach(([a,c])=>{a&&void 0!==c&&(b[a]=c)}):a&&(b=a),b},q=a=>{let b={};return a.forEach((a,c)=>{b[c]=a}),b},r=a=>a instanceof Error?a:Error(String(a)),s=a=>{throw Error(`Unhandled case: ${String(a)}`)},t=a=>"object"==typeof a&&null!==a&&!Array.isArray(a);(c=g||(g={})).NAME="Name",c.DOCUMENT="Document",c.OPERATION_DEFINITION="OperationDefinition",c.VARIABLE_DEFINITION="VariableDefinition",c.SELECTION_SET="SelectionSet",c.FIELD="Field",c.ARGUMENT="Argument",c.FRAGMENT_SPREAD="FragmentSpread",c.INLINE_FRAGMENT="InlineFragment",c.FRAGMENT_DEFINITION="FragmentDefinition",c.VARIABLE="Variable",c.INT="IntValue",c.FLOAT="FloatValue",c.STRING="StringValue",c.BOOLEAN="BooleanValue",c.NULL="NullValue",c.ENUM="EnumValue",c.LIST="ListValue",c.OBJECT="ObjectValue",c.OBJECT_FIELD="ObjectField",c.DIRECTIVE="Directive",c.NAMED_TYPE="NamedType",c.LIST_TYPE="ListType",c.NON_NULL_TYPE="NonNullType",c.SCHEMA_DEFINITION="SchemaDefinition",c.OPERATION_TYPE_DEFINITION="OperationTypeDefinition",c.SCALAR_TYPE_DEFINITION="ScalarTypeDefinition",c.OBJECT_TYPE_DEFINITION="ObjectTypeDefinition",c.FIELD_DEFINITION="FieldDefinition",c.INPUT_VALUE_DEFINITION="InputValueDefinition",c.INTERFACE_TYPE_DEFINITION="InterfaceTypeDefinition",c.UNION_TYPE_DEFINITION="UnionTypeDefinition",c.ENUM_TYPE_DEFINITION="EnumTypeDefinition",c.ENUM_VALUE_DEFINITION="EnumValueDefinition",c.INPUT_OBJECT_TYPE_DEFINITION="InputObjectTypeDefinition",c.DIRECTIVE_DEFINITION="DirectiveDefinition",c.SCHEMA_EXTENSION="SchemaExtension",c.SCALAR_TYPE_EXTENSION="ScalarTypeExtension",c.OBJECT_TYPE_EXTENSION="ObjectTypeExtension",c.INTERFACE_TYPE_EXTENSION="InterfaceTypeExtension",c.UNION_TYPE_EXTENSION="UnionTypeExtension",c.ENUM_TYPE_EXTENSION="EnumTypeExtension",c.INPUT_OBJECT_TYPE_EXTENSION="InputObjectTypeExtension",c.TYPE_COORDINATE="TypeCoordinate",c.MEMBER_COORDINATE="MemberCoordinate",c.ARGUMENT_COORDINATE="ArgumentCoordinate",c.DIRECTIVE_COORDINATE="DirectiveCoordinate",c.DIRECTIVE_ARGUMENT_COORDINATE="DirectiveArgumentCoordinate";let u="Accept",v="Content-Type",w="application/json",x="application/graphql-response+json",y=a=>a.replace(/([\s,]|#[^\n\r]+)+/g," ").trim(),z=a=>{try{if(Array.isArray(a))return{_tag:"Batch",executionResults:a.map(A)};if(t(a))return{_tag:"Single",executionResult:A(a)};throw Error(`Invalid execution result: result is not object or array. 
Got:
${String(a)}`)}catch(a){return a}},A=a=>{let b,c,d;if("object"!=typeof a||null===a)throw Error("Invalid execution result: result is not object");if("errors"in a){if(!t(a.errors)&&!Array.isArray(a.errors))throw Error("Invalid execution result: errors is not plain object OR array");b=a.errors}if("data"in a){if(!t(a.data)&&null!==a.data)throw Error("Invalid execution result: data is not plain object");c=a.data}if("extensions"in a){if(!t(a.extensions))throw Error("Invalid execution result: extensions is not plain object");d=a.extensions}return{data:c,errors:b,extensions:d}},B=a=>Array.isArray(a.errors)?a.errors.length>0:!!a.errors,C=a=>"object"==typeof a&&null!==a&&"kind"in a&&a.kind===g.OPERATION_DEFINITION,D=/\r\n|[\n\r]/g;function E(a,b){let c=0,d=1;for(let e of a.body.matchAll(D)){if("number"==typeof e.index||function(a,b){if(!a)throw Error("Unexpected invariant triggered.")}(!1),e.index>=b)break;c=e.index+e[0].length,d+=1}return{line:d,column:b+1-c}}function F(a,b){let c=a.locationOffset.column-1,d="".padStart(c)+a.body,e=b.line-1,f=a.locationOffset.line-1,g=b.line+f,h=1===b.line?c:0,i=b.column+h,j=`${a.name}:${g}:${i}
`,k=d.split(/\r\n|[\n\r]/g),l=k[e];if(l.length>120){let a=Math.floor(i/80),b=[];for(let a=0;a<l.length;a+=80)b.push(l.slice(a,a+80));return j+G([[`${g} |`,b[0]],...b.slice(1,a+1).map(a=>["|",a]),["|","^".padStart(i%80)],["|",b[a+1]]])}return j+G([[`${g-1} |`,k[e-1]],[`${g} |`,l],["|","^".padStart(i)],[`${g+1} |`,k[e+1]]])}function G(a){let b=a.filter(([a,b])=>void 0!==b),c=Math.max(...b.map(([a])=>a.length));return b.map(([a,b])=>a.padStart(c)+(b?" "+b:"")).join("\n")}class H extends Error{constructor(a,...b){var c,d,e;const{nodes:f,source:g,positions:h,path:i,originalError:j,extensions:k}=function(a){let b=a[0];return null==b||"kind"in b||"length"in b?{nodes:b,source:a[1],positions:a[2],path:a[3],originalError:a[4],extensions:a[5]}:b}(b);super(a),this.name="GraphQLError",this.path=null!=i?i:void 0,this.originalError=null!=j?j:void 0,this.nodes=I(Array.isArray(f)?f:f?[f]:void 0);const l=I(null==(c=this.nodes)?void 0:c.map(a=>a.loc).filter(a=>null!=a));this.source=null!=g?g:null==l||null==(d=l[0])?void 0:d.source,this.positions=null!=h?h:null==l?void 0:l.map(a=>a.start),this.locations=h&&g?h.map(a=>E(g,a)):null==l?void 0:l.map(a=>E(a.source,a.start));const m=!function(a){return"object"==typeof a&&null!==a}(null==j?void 0:j.extensions)||null==j?void 0:j.extensions;this.extensions=null!=(e=null!=k?k:m)?e:Object.create(null),Object.defineProperties(this,{message:{writable:!0,enumerable:!0},name:{enumerable:!1},nodes:{enumerable:!1},source:{enumerable:!1},positions:{enumerable:!1},originalError:{enumerable:!1}}),null!=j&&j.stack?Object.defineProperty(this,"stack",{value:j.stack,writable:!0,configurable:!0}):Error.captureStackTrace?Error.captureStackTrace(this,H):Object.defineProperty(this,"stack",{value:Error().stack,writable:!0,configurable:!0})}get[Symbol.toStringTag](){return"GraphQLError"}toString(){let a=this.message;if(this.nodes)for(let c of this.nodes){var b;c.loc&&(a+="\n\n"+F((b=c.loc).source,E(b.source,b.start)))}else if(this.source&&this.locations)for(let b of this.locations)a+="\n\n"+F(this.source,b);return a}toJSON(){let a={message:this.message};return null!=this.locations&&(a.locations=this.locations),null!=this.path&&(a.path=this.path),null!=this.extensions&&Object.keys(this.extensions).length>0&&(a.extensions=this.extensions),a}}function I(a){return void 0===a||0===a.length?void 0:a}function J(a,b,c){return new H(`Syntax Error: ${c}`,{source:a,positions:[b]})}class K{constructor(a,b,c){this.start=a.start,this.end=b.end,this.startToken=a,this.endToken=b,this.source=c}get[Symbol.toStringTag](){return"Location"}toJSON(){return{start:this.start,end:this.end}}}class L{constructor(a,b,c,d,e,f){this.kind=a,this.start=b,this.end=c,this.line=d,this.column=e,this.value=f,this.prev=null,this.next=null}get[Symbol.toStringTag](){return"Token"}toJSON(){return{kind:this.kind,value:this.value,line:this.line,column:this.column}}}let M={Name:[],Document:["definitions"],OperationDefinition:["description","name","variableDefinitions","directives","selectionSet"],VariableDefinition:["description","variable","type","defaultValue","directives"],Variable:["name"],SelectionSet:["selections"],Field:["alias","name","arguments","directives","selectionSet"],Argument:["name","value"],FragmentSpread:["name","directives"],InlineFragment:["typeCondition","directives","selectionSet"],FragmentDefinition:["description","name","variableDefinitions","typeCondition","directives","selectionSet"],IntValue:[],FloatValue:[],StringValue:[],BooleanValue:[],NullValue:[],EnumValue:[],ListValue:["values"],ObjectValue:["fields"],ObjectField:["name","value"],Directive:["name","arguments"],NamedType:["name"],ListType:["type"],NonNullType:["type"],SchemaDefinition:["description","directives","operationTypes"],OperationTypeDefinition:["type"],ScalarTypeDefinition:["description","name","directives"],ObjectTypeDefinition:["description","name","interfaces","directives","fields"],FieldDefinition:["description","name","arguments","type","directives"],InputValueDefinition:["description","name","type","defaultValue","directives"],InterfaceTypeDefinition:["description","name","interfaces","directives","fields"],UnionTypeDefinition:["description","name","directives","types"],EnumTypeDefinition:["description","name","directives","values"],EnumValueDefinition:["description","name","directives"],InputObjectTypeDefinition:["description","name","directives","fields"],DirectiveDefinition:["description","name","arguments","locations"],SchemaExtension:["directives","operationTypes"],ScalarTypeExtension:["name","directives"],ObjectTypeExtension:["name","interfaces","directives","fields"],InterfaceTypeExtension:["name","interfaces","directives","fields"],UnionTypeExtension:["name","directives","types"],EnumTypeExtension:["name","directives","values"],InputObjectTypeExtension:["name","directives","fields"],TypeCoordinate:["name"],MemberCoordinate:["name","memberName"],ArgumentCoordinate:["name","fieldName","argumentName"],DirectiveCoordinate:["name"],DirectiveArgumentCoordinate:["name","argumentName"]},N=new Set(Object.keys(M));function O(a){let b=null==a?void 0:a.kind;return"string"==typeof b&&N.has(b)}function P(a){return 9===a||32===a}function Q(a){return a>=48&&a<=57}function R(a){return a>=97&&a<=122||a>=65&&a<=90}function S(a){return R(a)||95===a}(d=h||(h={})).QUERY="query",d.MUTATION="mutation",d.SUBSCRIPTION="subscription",(e=i||(i={})).QUERY="QUERY",e.MUTATION="MUTATION",e.SUBSCRIPTION="SUBSCRIPTION",e.FIELD="FIELD",e.FRAGMENT_DEFINITION="FRAGMENT_DEFINITION",e.FRAGMENT_SPREAD="FRAGMENT_SPREAD",e.INLINE_FRAGMENT="INLINE_FRAGMENT",e.VARIABLE_DEFINITION="VARIABLE_DEFINITION",e.SCHEMA="SCHEMA",e.SCALAR="SCALAR",e.OBJECT="OBJECT",e.FIELD_DEFINITION="FIELD_DEFINITION",e.ARGUMENT_DEFINITION="ARGUMENT_DEFINITION",e.INTERFACE="INTERFACE",e.UNION="UNION",e.ENUM="ENUM",e.ENUM_VALUE="ENUM_VALUE",e.INPUT_OBJECT="INPUT_OBJECT",e.INPUT_FIELD_DEFINITION="INPUT_FIELD_DEFINITION",(f=j||(j={})).SOF="<SOF>",f.EOF="<EOF>",f.BANG="!",f.DOLLAR="$",f.AMP="&",f.PAREN_L="(",f.PAREN_R=")",f.DOT=".",f.SPREAD="...",f.COLON=":",f.EQUALS="=",f.AT="@",f.BRACKET_L="[",f.BRACKET_R="]",f.BRACE_L="{",f.PIPE="|",f.BRACE_R="}",f.NAME="Name",f.INT="Int",f.FLOAT="Float",f.STRING="String",f.BLOCK_STRING="BlockString",f.COMMENT="Comment";class T{constructor(a){const b=new L(j.SOF,0,0,0,0);this.source=a,this.lastToken=b,this.token=b,this.line=1,this.lineStart=0}get[Symbol.toStringTag](){return"Lexer"}advance(){return this.lastToken=this.token,this.token=this.lookahead()}lookahead(){let a=this.token;if(a.kind!==j.EOF)do if(a.next)a=a.next;else{let b=function(a,b){let c=a.source.body,d=c.length,e=b;for(;e<d;){let b=c.charCodeAt(e);switch(b){case 65279:case 9:case 32:case 44:++e;continue;case 10:++e,++a.line,a.lineStart=e;continue;case 13:10===c.charCodeAt(e+1)?e+=2:++e,++a.line,a.lineStart=e;continue;case 35:return function(a,b){let c=a.source.body,d=c.length,e=b+1;for(;e<d;){let a=c.charCodeAt(e);if(10===a||13===a)break;if(U(a))++e;else if(V(c,e))e+=2;else break}return Z(a,j.COMMENT,b,e,c.slice(b+1,e))}(a,e);case 33:return Z(a,j.BANG,e,e+1);case 36:return Z(a,j.DOLLAR,e,e+1);case 38:return Z(a,j.AMP,e,e+1);case 40:return Z(a,j.PAREN_L,e,e+1);case 41:return Z(a,j.PAREN_R,e,e+1);case 46:if(46===c.charCodeAt(e+1)&&46===c.charCodeAt(e+2))return Z(a,j.SPREAD,e,e+3);break;case 58:return Z(a,j.COLON,e,e+1);case 61:return Z(a,j.EQUALS,e,e+1);case 64:return Z(a,j.AT,e,e+1);case 91:return Z(a,j.BRACKET_L,e,e+1);case 93:return Z(a,j.BRACKET_R,e,e+1);case 123:return Z(a,j.BRACE_L,e,e+1);case 124:return Z(a,j.PIPE,e,e+1);case 125:return Z(a,j.BRACE_R,e,e+1);case 34:if(34===c.charCodeAt(e+1)&&34===c.charCodeAt(e+2))return function(a,b){let c=a.source.body,d=c.length,e=a.lineStart,f=b+3,g=f,h="",i=[];for(;f<d;){let d=c.charCodeAt(f);if(34===d&&34===c.charCodeAt(f+1)&&34===c.charCodeAt(f+2)){h+=c.slice(g,f),i.push(h);let d=Z(a,j.BLOCK_STRING,b,f+3,(function(a){var b,c;let d=Number.MAX_SAFE_INTEGER,e=null,f=-1;for(let b=0;b<a.length;++b){let g=a[b],h=function(a){let b=0;for(;b<a.length&&P(a.charCodeAt(b));)++b;return b}(g);h!==g.length&&(e=null!=(c=e)?c:b,f=b,0!==b&&h<d&&(d=h))}return a.map((a,b)=>0===b?a:a.slice(d)).slice(null!=(b=e)?b:0,f+1)})(i).join("\n"));return a.line+=i.length-1,a.lineStart=e,d}if(92===d&&34===c.charCodeAt(f+1)&&34===c.charCodeAt(f+2)&&34===c.charCodeAt(f+3)){h+=c.slice(g,f),g=f+1,f+=4;continue}if(10===d||13===d){h+=c.slice(g,f),i.push(h),13===d&&10===c.charCodeAt(f+1)?f+=2:++f,h="",g=f,e=f;continue}if(U(d))++f;else if(V(c,f))f+=2;else throw J(a.source,f,`Invalid character within String: ${Y(a,f)}.`)}throw J(a.source,f,"Unterminated string.")}(a,e);return function(a,b){let c=a.source.body,d=c.length,e=b+1,f=e,g="";for(;e<d;){let d=c.charCodeAt(e);if(34===d)return g+=c.slice(f,e),Z(a,j.STRING,b,e+1,g);if(92===d){g+=c.slice(f,e);let b=117===c.charCodeAt(e+1)?123===c.charCodeAt(e+2)?function(a,b){let c=a.source.body,d=0,e=3;for(;e<12;){let a=c.charCodeAt(b+e++);if(125===a){if(e<5||!U(d))break;return{value:String.fromCodePoint(d),size:e}}if((d=d<<4|aa(a))<0)break}throw J(a.source,b,`Invalid Unicode escape sequence: "${c.slice(b,b+e)}".`)}(a,e):function(a,b){let c=a.source.body,d=_(c,b+2);if(U(d))return{value:String.fromCodePoint(d),size:6};if(W(d)&&92===c.charCodeAt(b+6)&&117===c.charCodeAt(b+7)){let a=_(c,b+8);if(X(a))return{value:String.fromCodePoint(d,a),size:12}}throw J(a.source,b,`Invalid Unicode escape sequence: "${c.slice(b,b+6)}".`)}(a,e):function(a,b){let c=a.source.body;switch(c.charCodeAt(b+1)){case 34:return{value:'"',size:2};case 92:return{value:"\\",size:2};case 47:return{value:"/",size:2};case 98:return{value:"\b",size:2};case 102:return{value:"\f",size:2};case 110:return{value:"\n",size:2};case 114:return{value:"\r",size:2};case 116:return{value:"	",size:2}}throw J(a.source,b,`Invalid character escape sequence: "${c.slice(b,b+2)}".`)}(a,e);g+=b.value,e+=b.size,f=e;continue}if(10===d||13===d)break;if(U(d))++e;else if(V(c,e))e+=2;else throw J(a.source,e,`Invalid character within String: ${Y(a,e)}.`)}throw J(a.source,e,"Unterminated string.")}(a,e)}if(Q(b)||45===b)return function(a,b,c){let d=a.source.body,e=b,f=c,g=!1;if(45===f&&(f=d.charCodeAt(++e)),48===f){if(Q(f=d.charCodeAt(++e)))throw J(a.source,e,`Invalid number, unexpected digit after 0: ${Y(a,e)}.`)}else e=$(a,e,f),f=d.charCodeAt(e);if(46===f&&(g=!0,f=d.charCodeAt(++e),e=$(a,e,f),f=d.charCodeAt(e)),(69===f||101===f)&&(g=!0,(43===(f=d.charCodeAt(++e))||45===f)&&(f=d.charCodeAt(++e)),e=$(a,e,f),f=d.charCodeAt(e)),46===f||S(f))throw J(a.source,e,`Invalid number, expected digit but got: ${Y(a,e)}.`);return Z(a,g?j.FLOAT:j.INT,b,e,d.slice(b,e))}(a,e,b);if(S(b))return function(a,b){let c=a.source.body,d=c.length,e=b+1;for(;e<d;){var f;if(R(f=c.charCodeAt(e))||Q(f)||95===f)++e;else break}return Z(a,j.NAME,b,e,c.slice(b,e))}(a,e);throw J(a.source,e,39===b?"Unexpected single quote character ('), did you mean to use a double quote (\")?":U(b)||V(c,e)?`Unexpected character: ${Y(a,e)}.`:`Invalid character: ${Y(a,e)}.`)}return Z(a,j.EOF,d,d)}(this,a.end);a.next=b,b.prev=a,a=b}while(a.kind===j.COMMENT)return a}}function U(a){return a>=0&&a<=55295||a>=57344&&a<=1114111}function V(a,b){return W(a.charCodeAt(b))&&X(a.charCodeAt(b+1))}function W(a){return a>=55296&&a<=56319}function X(a){return a>=56320&&a<=57343}function Y(a,b){let c=a.source.body.codePointAt(b);if(void 0===c)return j.EOF;if(c>=32&&c<=126){let a=String.fromCodePoint(c);return'"'===a?"'\"'":`"${a}"`}return"U+"+c.toString(16).toUpperCase().padStart(4,"0")}function Z(a,b,c,d,e){let f=a.line,g=1+c-a.lineStart;return new L(b,c,d,f,g,e)}function $(a,b,c){if(!Q(c))throw J(a.source,b,`Invalid number, expected digit but got: ${Y(a,b)}.`);let d=a.source.body,e=b+1;for(;Q(d.charCodeAt(e));)++e;return e}function _(a,b){return aa(a.charCodeAt(b))<<12|aa(a.charCodeAt(b+1))<<8|aa(a.charCodeAt(b+2))<<4|aa(a.charCodeAt(b+3))}function aa(a){return a>=48&&a<=57?a-48:a>=65&&a<=70?a-55:a>=97&&a<=102?a-87:-1}function ab(a,b){if(!a)throw Error(b)}function ac(a,b){switch(typeof a){case"string":return JSON.stringify(a);case"function":return a.name?`[function ${a.name}]`:"[function]";case"object":return function(a,b){let c;if(null===a)return"null";if(b.includes(a))return"[Circular]";let d=[...b,a];if("function"==typeof a.toJSON){let b=a.toJSON();if(b!==a)return"string"==typeof b?b:ac(b,d)}else if(Array.isArray(a)){var e,f,g=a,h=d;if(0===g.length)return"[]";if(h.length>2)return"[Array]";let b=Math.min(10,g.length),c=g.length-b,i=[];for(let a=0;a<b;++a)i.push(ac(g[a],h));return 1===c?i.push("... 1 more item"):c>1&&i.push(`... ${c} more items`),"["+i.join(", ")+"]"}return e=a,f=d,0===(c=Object.entries(e)).length?"{}":f.length>2?"["+function(a){let b=Object.prototype.toString.call(a).replace(/^\[object /,"").replace(/]$/,"");if("Object"===b&&"function"==typeof a.constructor){let b=a.constructor.name;if("string"==typeof b&&""!==b)return b}return b}(e)+"]":"{ "+c.map(([a,b])=>a+": "+ac(b,f)).join(", ")+" }"}(a,b);default:return String(a)}}let ad=globalThis.process&&1?function(a,b){return a instanceof b}:function(a,b){if(a instanceof b)return!0;if("object"==typeof a&&null!==a){var c;let d=b.prototype[Symbol.toStringTag];if(d===(Symbol.toStringTag in a?a[Symbol.toStringTag]:null==(c=a.constructor)?void 0:c.name)){let b=ac(a,[]);throw Error(`Cannot use ${d} "${b}" from another module or realm.

Ensure that there is only one instance of "graphql" in the node_modules
directory. If different versions of "graphql" are the dependencies of other
relied on modules, use "resolutions" to ensure only one version is installed.

https://yarnpkg.com/en/docs/selective-version-resolutions

Duplicate "graphql" modules cannot be used at the same time since different
versions may have different capabilities and behavior. The data from one
version used in the function from another could produce confusing and
spurious results.`)}}return!1};class ae{constructor(a,b="GraphQL request",c={line:1,column:1}){"string"==typeof a||ab(!1,`Body must be a string. Received: ${ac(a,[])}.`),this.body=a,this.name=b,this.locationOffset=c,this.locationOffset.line>0||ab(!1,"line in locationOffset is 1-indexed and must be positive."),this.locationOffset.column>0||ab(!1,"column in locationOffset is 1-indexed and must be positive.")}get[Symbol.toStringTag](){return"Source"}}class af{constructor(a,b={}){const{lexer:c,...d}=b;if(c)this._lexer=c;else{const b=ad(a,ae)?a:new ae(a);this._lexer=new T(b)}this._options=d,this._tokenCounter=0}get tokenCount(){return this._tokenCounter}parseName(){let a=this.expectToken(j.NAME);return this.node(a,{kind:g.NAME,value:a.value})}parseDocument(){return this.node(this._lexer.token,{kind:g.DOCUMENT,definitions:this.many(j.SOF,this.parseDefinition,j.EOF)})}parseDefinition(){if(this.peek(j.BRACE_L))return this.parseOperationDefinition();let a=this.peekDescription(),b=a?this._lexer.lookahead():this._lexer.token;if(a&&b.kind===j.BRACE_L)throw J(this._lexer.source,this._lexer.token.start,"Unexpected description, descriptions are not supported on shorthand queries.");if(b.kind===j.NAME){switch(b.value){case"schema":return this.parseSchemaDefinition();case"scalar":return this.parseScalarTypeDefinition();case"type":return this.parseObjectTypeDefinition();case"interface":return this.parseInterfaceTypeDefinition();case"union":return this.parseUnionTypeDefinition();case"enum":return this.parseEnumTypeDefinition();case"input":return this.parseInputObjectTypeDefinition();case"directive":return this.parseDirectiveDefinition()}switch(b.value){case"query":case"mutation":case"subscription":return this.parseOperationDefinition();case"fragment":return this.parseFragmentDefinition()}if(a)throw J(this._lexer.source,this._lexer.token.start,"Unexpected description, only GraphQL definitions support descriptions.");if("extend"===b.value)return this.parseTypeSystemExtension()}throw this.unexpected(b)}parseOperationDefinition(){let a,b=this._lexer.token;if(this.peek(j.BRACE_L))return this.node(b,{kind:g.OPERATION_DEFINITION,operation:h.QUERY,description:void 0,name:void 0,variableDefinitions:[],directives:[],selectionSet:this.parseSelectionSet()});let c=this.parseDescription(),d=this.parseOperationType();return this.peek(j.NAME)&&(a=this.parseName()),this.node(b,{kind:g.OPERATION_DEFINITION,operation:d,description:c,name:a,variableDefinitions:this.parseVariableDefinitions(),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseOperationType(){let a=this.expectToken(j.NAME);switch(a.value){case"query":return h.QUERY;case"mutation":return h.MUTATION;case"subscription":return h.SUBSCRIPTION}throw this.unexpected(a)}parseVariableDefinitions(){return this.optionalMany(j.PAREN_L,this.parseVariableDefinition,j.PAREN_R)}parseVariableDefinition(){return this.node(this._lexer.token,{kind:g.VARIABLE_DEFINITION,description:this.parseDescription(),variable:this.parseVariable(),type:(this.expectToken(j.COLON),this.parseTypeReference()),defaultValue:this.expectOptionalToken(j.EQUALS)?this.parseConstValueLiteral():void 0,directives:this.parseConstDirectives()})}parseVariable(){let a=this._lexer.token;return this.expectToken(j.DOLLAR),this.node(a,{kind:g.VARIABLE,name:this.parseName()})}parseSelectionSet(){return this.node(this._lexer.token,{kind:g.SELECTION_SET,selections:this.many(j.BRACE_L,this.parseSelection,j.BRACE_R)})}parseSelection(){return this.peek(j.SPREAD)?this.parseFragment():this.parseField()}parseField(){let a,b,c=this._lexer.token,d=this.parseName();return this.expectOptionalToken(j.COLON)?(a=d,b=this.parseName()):b=d,this.node(c,{kind:g.FIELD,alias:a,name:b,arguments:this.parseArguments(!1),directives:this.parseDirectives(!1),selectionSet:this.peek(j.BRACE_L)?this.parseSelectionSet():void 0})}parseArguments(a){let b=a?this.parseConstArgument:this.parseArgument;return this.optionalMany(j.PAREN_L,b,j.PAREN_R)}parseArgument(a=!1){let b=this._lexer.token,c=this.parseName();return this.expectToken(j.COLON),this.node(b,{kind:g.ARGUMENT,name:c,value:this.parseValueLiteral(a)})}parseConstArgument(){return this.parseArgument(!0)}parseFragment(){let a=this._lexer.token;this.expectToken(j.SPREAD);let b=this.expectOptionalKeyword("on");return!b&&this.peek(j.NAME)?this.node(a,{kind:g.FRAGMENT_SPREAD,name:this.parseFragmentName(),directives:this.parseDirectives(!1)}):this.node(a,{kind:g.INLINE_FRAGMENT,typeCondition:b?this.parseNamedType():void 0,directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseFragmentDefinition(){let a=this._lexer.token,b=this.parseDescription();return(this.expectKeyword("fragment"),!0===this._options.allowLegacyFragmentVariables)?this.node(a,{kind:g.FRAGMENT_DEFINITION,description:b,name:this.parseFragmentName(),variableDefinitions:this.parseVariableDefinitions(),typeCondition:(this.expectKeyword("on"),this.parseNamedType()),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()}):this.node(a,{kind:g.FRAGMENT_DEFINITION,description:b,name:this.parseFragmentName(),typeCondition:(this.expectKeyword("on"),this.parseNamedType()),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseFragmentName(){if("on"===this._lexer.token.value)throw this.unexpected();return this.parseName()}parseValueLiteral(a){let b=this._lexer.token;switch(b.kind){case j.BRACKET_L:return this.parseList(a);case j.BRACE_L:return this.parseObject(a);case j.INT:return this.advanceLexer(),this.node(b,{kind:g.INT,value:b.value});case j.FLOAT:return this.advanceLexer(),this.node(b,{kind:g.FLOAT,value:b.value});case j.STRING:case j.BLOCK_STRING:return this.parseStringLiteral();case j.NAME:switch(this.advanceLexer(),b.value){case"true":return this.node(b,{kind:g.BOOLEAN,value:!0});case"false":return this.node(b,{kind:g.BOOLEAN,value:!1});case"null":return this.node(b,{kind:g.NULL});default:return this.node(b,{kind:g.ENUM,value:b.value})}case j.DOLLAR:if(a){if(this.expectToken(j.DOLLAR),this._lexer.token.kind===j.NAME){let a=this._lexer.token.value;throw J(this._lexer.source,b.start,`Unexpected variable "$${a}" in constant value.`)}throw this.unexpected(b)}return this.parseVariable();default:throw this.unexpected()}}parseConstValueLiteral(){return this.parseValueLiteral(!0)}parseStringLiteral(){let a=this._lexer.token;return this.advanceLexer(),this.node(a,{kind:g.STRING,value:a.value,block:a.kind===j.BLOCK_STRING})}parseList(a){let b=()=>this.parseValueLiteral(a);return this.node(this._lexer.token,{kind:g.LIST,values:this.any(j.BRACKET_L,b,j.BRACKET_R)})}parseObject(a){let b=()=>this.parseObjectField(a);return this.node(this._lexer.token,{kind:g.OBJECT,fields:this.any(j.BRACE_L,b,j.BRACE_R)})}parseObjectField(a){let b=this._lexer.token,c=this.parseName();return this.expectToken(j.COLON),this.node(b,{kind:g.OBJECT_FIELD,name:c,value:this.parseValueLiteral(a)})}parseDirectives(a){let b=[];for(;this.peek(j.AT);)b.push(this.parseDirective(a));return b}parseConstDirectives(){return this.parseDirectives(!0)}parseDirective(a){let b=this._lexer.token;return this.expectToken(j.AT),this.node(b,{kind:g.DIRECTIVE,name:this.parseName(),arguments:this.parseArguments(a)})}parseTypeReference(){let a,b=this._lexer.token;if(this.expectOptionalToken(j.BRACKET_L)){let c=this.parseTypeReference();this.expectToken(j.BRACKET_R),a=this.node(b,{kind:g.LIST_TYPE,type:c})}else a=this.parseNamedType();return this.expectOptionalToken(j.BANG)?this.node(b,{kind:g.NON_NULL_TYPE,type:a}):a}parseNamedType(){return this.node(this._lexer.token,{kind:g.NAMED_TYPE,name:this.parseName()})}peekDescription(){return this.peek(j.STRING)||this.peek(j.BLOCK_STRING)}parseDescription(){if(this.peekDescription())return this.parseStringLiteral()}parseSchemaDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("schema");let c=this.parseConstDirectives(),d=this.many(j.BRACE_L,this.parseOperationTypeDefinition,j.BRACE_R);return this.node(a,{kind:g.SCHEMA_DEFINITION,description:b,directives:c,operationTypes:d})}parseOperationTypeDefinition(){let a=this._lexer.token,b=this.parseOperationType();this.expectToken(j.COLON);let c=this.parseNamedType();return this.node(a,{kind:g.OPERATION_TYPE_DEFINITION,operation:b,type:c})}parseScalarTypeDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("scalar");let c=this.parseName(),d=this.parseConstDirectives();return this.node(a,{kind:g.SCALAR_TYPE_DEFINITION,description:b,name:c,directives:d})}parseObjectTypeDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("type");let c=this.parseName(),d=this.parseImplementsInterfaces(),e=this.parseConstDirectives(),f=this.parseFieldsDefinition();return this.node(a,{kind:g.OBJECT_TYPE_DEFINITION,description:b,name:c,interfaces:d,directives:e,fields:f})}parseImplementsInterfaces(){return this.expectOptionalKeyword("implements")?this.delimitedMany(j.AMP,this.parseNamedType):[]}parseFieldsDefinition(){return this.optionalMany(j.BRACE_L,this.parseFieldDefinition,j.BRACE_R)}parseFieldDefinition(){let a=this._lexer.token,b=this.parseDescription(),c=this.parseName(),d=this.parseArgumentDefs();this.expectToken(j.COLON);let e=this.parseTypeReference(),f=this.parseConstDirectives();return this.node(a,{kind:g.FIELD_DEFINITION,description:b,name:c,arguments:d,type:e,directives:f})}parseArgumentDefs(){return this.optionalMany(j.PAREN_L,this.parseInputValueDef,j.PAREN_R)}parseInputValueDef(){let a,b=this._lexer.token,c=this.parseDescription(),d=this.parseName();this.expectToken(j.COLON);let e=this.parseTypeReference();this.expectOptionalToken(j.EQUALS)&&(a=this.parseConstValueLiteral());let f=this.parseConstDirectives();return this.node(b,{kind:g.INPUT_VALUE_DEFINITION,description:c,name:d,type:e,defaultValue:a,directives:f})}parseInterfaceTypeDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("interface");let c=this.parseName(),d=this.parseImplementsInterfaces(),e=this.parseConstDirectives(),f=this.parseFieldsDefinition();return this.node(a,{kind:g.INTERFACE_TYPE_DEFINITION,description:b,name:c,interfaces:d,directives:e,fields:f})}parseUnionTypeDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("union");let c=this.parseName(),d=this.parseConstDirectives(),e=this.parseUnionMemberTypes();return this.node(a,{kind:g.UNION_TYPE_DEFINITION,description:b,name:c,directives:d,types:e})}parseUnionMemberTypes(){return this.expectOptionalToken(j.EQUALS)?this.delimitedMany(j.PIPE,this.parseNamedType):[]}parseEnumTypeDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("enum");let c=this.parseName(),d=this.parseConstDirectives(),e=this.parseEnumValuesDefinition();return this.node(a,{kind:g.ENUM_TYPE_DEFINITION,description:b,name:c,directives:d,values:e})}parseEnumValuesDefinition(){return this.optionalMany(j.BRACE_L,this.parseEnumValueDefinition,j.BRACE_R)}parseEnumValueDefinition(){let a=this._lexer.token,b=this.parseDescription(),c=this.parseEnumValueName(),d=this.parseConstDirectives();return this.node(a,{kind:g.ENUM_VALUE_DEFINITION,description:b,name:c,directives:d})}parseEnumValueName(){if("true"===this._lexer.token.value||"false"===this._lexer.token.value||"null"===this._lexer.token.value)throw J(this._lexer.source,this._lexer.token.start,`${ag(this._lexer.token)} is reserved and cannot be used for an enum value.`);return this.parseName()}parseInputObjectTypeDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("input");let c=this.parseName(),d=this.parseConstDirectives(),e=this.parseInputFieldsDefinition();return this.node(a,{kind:g.INPUT_OBJECT_TYPE_DEFINITION,description:b,name:c,directives:d,fields:e})}parseInputFieldsDefinition(){return this.optionalMany(j.BRACE_L,this.parseInputValueDef,j.BRACE_R)}parseTypeSystemExtension(){let a=this._lexer.lookahead();if(a.kind===j.NAME)switch(a.value){case"schema":return this.parseSchemaExtension();case"scalar":return this.parseScalarTypeExtension();case"type":return this.parseObjectTypeExtension();case"interface":return this.parseInterfaceTypeExtension();case"union":return this.parseUnionTypeExtension();case"enum":return this.parseEnumTypeExtension();case"input":return this.parseInputObjectTypeExtension()}throw this.unexpected(a)}parseSchemaExtension(){let a=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("schema");let b=this.parseConstDirectives(),c=this.optionalMany(j.BRACE_L,this.parseOperationTypeDefinition,j.BRACE_R);if(0===b.length&&0===c.length)throw this.unexpected();return this.node(a,{kind:g.SCHEMA_EXTENSION,directives:b,operationTypes:c})}parseScalarTypeExtension(){let a=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("scalar");let b=this.parseName(),c=this.parseConstDirectives();if(0===c.length)throw this.unexpected();return this.node(a,{kind:g.SCALAR_TYPE_EXTENSION,name:b,directives:c})}parseObjectTypeExtension(){let a=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("type");let b=this.parseName(),c=this.parseImplementsInterfaces(),d=this.parseConstDirectives(),e=this.parseFieldsDefinition();if(0===c.length&&0===d.length&&0===e.length)throw this.unexpected();return this.node(a,{kind:g.OBJECT_TYPE_EXTENSION,name:b,interfaces:c,directives:d,fields:e})}parseInterfaceTypeExtension(){let a=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("interface");let b=this.parseName(),c=this.parseImplementsInterfaces(),d=this.parseConstDirectives(),e=this.parseFieldsDefinition();if(0===c.length&&0===d.length&&0===e.length)throw this.unexpected();return this.node(a,{kind:g.INTERFACE_TYPE_EXTENSION,name:b,interfaces:c,directives:d,fields:e})}parseUnionTypeExtension(){let a=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("union");let b=this.parseName(),c=this.parseConstDirectives(),d=this.parseUnionMemberTypes();if(0===c.length&&0===d.length)throw this.unexpected();return this.node(a,{kind:g.UNION_TYPE_EXTENSION,name:b,directives:c,types:d})}parseEnumTypeExtension(){let a=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("enum");let b=this.parseName(),c=this.parseConstDirectives(),d=this.parseEnumValuesDefinition();if(0===c.length&&0===d.length)throw this.unexpected();return this.node(a,{kind:g.ENUM_TYPE_EXTENSION,name:b,directives:c,values:d})}parseInputObjectTypeExtension(){let a=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("input");let b=this.parseName(),c=this.parseConstDirectives(),d=this.parseInputFieldsDefinition();if(0===c.length&&0===d.length)throw this.unexpected();return this.node(a,{kind:g.INPUT_OBJECT_TYPE_EXTENSION,name:b,directives:c,fields:d})}parseDirectiveDefinition(){let a=this._lexer.token,b=this.parseDescription();this.expectKeyword("directive"),this.expectToken(j.AT);let c=this.parseName(),d=this.parseArgumentDefs(),e=this.expectOptionalKeyword("repeatable");this.expectKeyword("on");let f=this.parseDirectiveLocations();return this.node(a,{kind:g.DIRECTIVE_DEFINITION,description:b,name:c,arguments:d,repeatable:e,locations:f})}parseDirectiveLocations(){return this.delimitedMany(j.PIPE,this.parseDirectiveLocation)}parseDirectiveLocation(){let a=this._lexer.token,b=this.parseName();if(Object.prototype.hasOwnProperty.call(i,b.value))return b;throw this.unexpected(a)}parseSchemaCoordinate(){let a,b,c=this._lexer.token,d=this.expectOptionalToken(j.AT),e=this.parseName();return(!d&&this.expectOptionalToken(j.DOT)&&(a=this.parseName()),(d||a)&&this.expectOptionalToken(j.PAREN_L)&&(b=this.parseName(),this.expectToken(j.COLON),this.expectToken(j.PAREN_R)),d)?b?this.node(c,{kind:g.DIRECTIVE_ARGUMENT_COORDINATE,name:e,argumentName:b}):this.node(c,{kind:g.DIRECTIVE_COORDINATE,name:e}):a?b?this.node(c,{kind:g.ARGUMENT_COORDINATE,name:e,fieldName:a,argumentName:b}):this.node(c,{kind:g.MEMBER_COORDINATE,name:e,memberName:a}):this.node(c,{kind:g.TYPE_COORDINATE,name:e})}node(a,b){return!0!==this._options.noLocation&&(b.loc=new K(a,this._lexer.lastToken,this._lexer.source)),b}peek(a){return this._lexer.token.kind===a}expectToken(a){let b=this._lexer.token;if(b.kind===a)return this.advanceLexer(),b;throw J(this._lexer.source,b.start,`Expected ${ah(a)}, found ${ag(b)}.`)}expectOptionalToken(a){return this._lexer.token.kind===a&&(this.advanceLexer(),!0)}expectKeyword(a){let b=this._lexer.token;if(b.kind===j.NAME&&b.value===a)this.advanceLexer();else throw J(this._lexer.source,b.start,`Expected "${a}", found ${ag(b)}.`)}expectOptionalKeyword(a){let b=this._lexer.token;return b.kind===j.NAME&&b.value===a&&(this.advanceLexer(),!0)}unexpected(a){let b=null!=a?a:this._lexer.token;return J(this._lexer.source,b.start,`Unexpected ${ag(b)}.`)}any(a,b,c){this.expectToken(a);let d=[];for(;!this.expectOptionalToken(c);)d.push(b.call(this));return d}optionalMany(a,b,c){if(this.expectOptionalToken(a)){let a=[];do a.push(b.call(this));while(!this.expectOptionalToken(c))return a}return[]}many(a,b,c){this.expectToken(a);let d=[];do d.push(b.call(this));while(!this.expectOptionalToken(c))return d}delimitedMany(a,b){this.expectOptionalToken(a);let c=[];do c.push(b.call(this));while(this.expectOptionalToken(a))return c}advanceLexer(){let{maxTokens:a}=this._options,b=this._lexer.advance();if(b.kind!==j.EOF&&(++this._tokenCounter,void 0!==a&&this._tokenCounter>a))throw J(this._lexer.source,b.start,`Document contains more that ${a} tokens. Parsing aborted.`)}}function ag(a){let b=a.value;return ah(a.kind)+(null!=b?` "${b}"`:"")}function ah(a){return a===j.BANG||a===j.DOLLAR||a===j.AMP||a===j.PAREN_L||a===j.PAREN_R||a===j.DOT||a===j.SPREAD||a===j.COLON||a===j.EQUALS||a===j.AT||a===j.BRACKET_L||a===j.BRACKET_R||a===j.BRACE_L||a===j.PIPE||a===j.BRACE_R?`"${a}"`:a}let ai=/[\x00-\x1f\x22\x5c\x7f-\x9f]/g;function aj(a){return ak[a.charCodeAt(0)]}let ak=["\\u0000","\\u0001","\\u0002","\\u0003","\\u0004","\\u0005","\\u0006","\\u0007","\\b","\\t","\\n","\\u000B","\\f","\\r","\\u000E","\\u000F","\\u0010","\\u0011","\\u0012","\\u0013","\\u0014","\\u0015","\\u0016","\\u0017","\\u0018","\\u0019","\\u001A","\\u001B","\\u001C","\\u001D","\\u001E","\\u001F","","",'\\"',"","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","\\\\","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","\\u007F","\\u0080","\\u0081","\\u0082","\\u0083","\\u0084","\\u0085","\\u0086","\\u0087","\\u0088","\\u0089","\\u008A","\\u008B","\\u008C","\\u008D","\\u008E","\\u008F","\\u0090","\\u0091","\\u0092","\\u0093","\\u0094","\\u0095","\\u0096","\\u0097","\\u0098","\\u0099","\\u009A","\\u009B","\\u009C","\\u009D","\\u009E","\\u009F"],al=Object.freeze({}),am={Name:{leave:a=>a.value},Variable:{leave:a=>"$"+a.name},Document:{leave:a=>an(a.definitions,"\n\n")},OperationDefinition:{leave(a){let b=ar(a.variableDefinitions)?ap("(\n",an(a.variableDefinitions,"\n"),"\n)"):ap("(",an(a.variableDefinitions,", "),")"),c=ap("",a.description,"\n")+an([a.operation,an([a.name,b]),an(a.directives," ")]," ");return("query"===c?"":c+" ")+a.selectionSet}},VariableDefinition:{leave:({variable:a,type:b,defaultValue:c,directives:d,description:e})=>ap("",e,"\n")+a+": "+b+ap(" = ",c)+ap(" ",an(d," "))},SelectionSet:{leave:({selections:a})=>ao(a)},Field:{leave({alias:a,name:b,arguments:c,directives:d,selectionSet:e}){let f=ap("",a,": ")+b,g=f+ap("(",an(c,", "),")");return g.length>80&&(g=f+ap("(\n",aq(an(c,"\n")),"\n)")),an([g,an(d," "),e]," ")}},Argument:{leave:({name:a,value:b})=>a+": "+b},FragmentSpread:{leave:({name:a,directives:b})=>"..."+a+ap(" ",an(b," "))},InlineFragment:{leave:({typeCondition:a,directives:b,selectionSet:c})=>an(["...",ap("on ",a),an(b," "),c]," ")},FragmentDefinition:{leave:({name:a,typeCondition:b,variableDefinitions:c,directives:d,selectionSet:e,description:f})=>ap("",f,"\n")+`fragment ${a}${ap("(",an(c,", "),")")} `+`on ${b} ${ap("",an(d," ")," ")}`+e},IntValue:{leave:({value:a})=>a},FloatValue:{leave:({value:a})=>a},StringValue:{leave:({value:a,block:b})=>{let c,d,e,f,g,h,i,j,k,l,m;return b?(e=1===(d=(c=a.replace(/"""/g,'\\"""')).split(/\r\n|[\n\r]/g)).length,f=d.length>1&&d.slice(1).every(a=>0===a.length||P(a.charCodeAt(0))),g=c.endsWith('\\"""'),h=a.endsWith('"')&&!g,i=a.endsWith("\\"),j=h||i,k=!e||a.length>70||j||f||g,l="",m=e&&P(a.charCodeAt(0)),(k&&!m||f)&&(l+="\n"),l+=c,(k||j)&&(l+="\n"),'"""'+l+'"""'):`"${a.replace(ai,aj)}"`}},BooleanValue:{leave:({value:a})=>a?"true":"false"},NullValue:{leave:()=>"null"},EnumValue:{leave:({value:a})=>a},ListValue:{leave:({values:a})=>"["+an(a,", ")+"]"},ObjectValue:{leave:({fields:a})=>"{"+an(a,", ")+"}"},ObjectField:{leave:({name:a,value:b})=>a+": "+b},Directive:{leave:({name:a,arguments:b})=>"@"+a+ap("(",an(b,", "),")")},NamedType:{leave:({name:a})=>a},ListType:{leave:({type:a})=>"["+a+"]"},NonNullType:{leave:({type:a})=>a+"!"},SchemaDefinition:{leave:({description:a,directives:b,operationTypes:c})=>ap("",a,"\n")+an(["schema",an(b," "),ao(c)]," ")},OperationTypeDefinition:{leave:({operation:a,type:b})=>a+": "+b},ScalarTypeDefinition:{leave:({description:a,name:b,directives:c})=>ap("",a,"\n")+an(["scalar",b,an(c," ")]," ")},ObjectTypeDefinition:{leave:({description:a,name:b,interfaces:c,directives:d,fields:e})=>ap("",a,"\n")+an(["type",b,ap("implements ",an(c," & ")),an(d," "),ao(e)]," ")},FieldDefinition:{leave:({description:a,name:b,arguments:c,type:d,directives:e})=>ap("",a,"\n")+b+(ar(c)?ap("(\n",aq(an(c,"\n")),"\n)"):ap("(",an(c,", "),")"))+": "+d+ap(" ",an(e," "))},InputValueDefinition:{leave:({description:a,name:b,type:c,defaultValue:d,directives:e})=>ap("",a,"\n")+an([b+": "+c,ap("= ",d),an(e," ")]," ")},InterfaceTypeDefinition:{leave:({description:a,name:b,interfaces:c,directives:d,fields:e})=>ap("",a,"\n")+an(["interface",b,ap("implements ",an(c," & ")),an(d," "),ao(e)]," ")},UnionTypeDefinition:{leave:({description:a,name:b,directives:c,types:d})=>ap("",a,"\n")+an(["union",b,an(c," "),ap("= ",an(d," | "))]," ")},EnumTypeDefinition:{leave:({description:a,name:b,directives:c,values:d})=>ap("",a,"\n")+an(["enum",b,an(c," "),ao(d)]," ")},EnumValueDefinition:{leave:({description:a,name:b,directives:c})=>ap("",a,"\n")+an([b,an(c," ")]," ")},InputObjectTypeDefinition:{leave:({description:a,name:b,directives:c,fields:d})=>ap("",a,"\n")+an(["input",b,an(c," "),ao(d)]," ")},DirectiveDefinition:{leave:({description:a,name:b,arguments:c,repeatable:d,locations:e})=>ap("",a,"\n")+"directive @"+b+(ar(c)?ap("(\n",aq(an(c,"\n")),"\n)"):ap("(",an(c,", "),")"))+(d?" repeatable":"")+" on "+an(e," | ")},SchemaExtension:{leave:({directives:a,operationTypes:b})=>an(["extend schema",an(a," "),ao(b)]," ")},ScalarTypeExtension:{leave:({name:a,directives:b})=>an(["extend scalar",a,an(b," ")]," ")},ObjectTypeExtension:{leave:({name:a,interfaces:b,directives:c,fields:d})=>an(["extend type",a,ap("implements ",an(b," & ")),an(c," "),ao(d)]," ")},InterfaceTypeExtension:{leave:({name:a,interfaces:b,directives:c,fields:d})=>an(["extend interface",a,ap("implements ",an(b," & ")),an(c," "),ao(d)]," ")},UnionTypeExtension:{leave:({name:a,directives:b,types:c})=>an(["extend union",a,an(b," "),ap("= ",an(c," | "))]," ")},EnumTypeExtension:{leave:({name:a,directives:b,values:c})=>an(["extend enum",a,an(b," "),ao(c)]," ")},InputObjectTypeExtension:{leave:({name:a,directives:b,fields:c})=>an(["extend input",a,an(b," "),ao(c)]," ")},TypeCoordinate:{leave:({name:a})=>a},MemberCoordinate:{leave:({name:a,memberName:b})=>an([a,ap(".",b)])},ArgumentCoordinate:{leave:({name:a,fieldName:b,argumentName:c})=>an([a,ap(".",b),ap("(",c,":)")])},DirectiveCoordinate:{leave:({name:a})=>an(["@",a])},DirectiveArgumentCoordinate:{leave:({name:a,argumentName:b})=>an(["@",a,ap("(",b,":)")])}};function an(a,b=""){var c;return null!=(c=null==a?void 0:a.filter(a=>a).join(b))?c:""}function ao(a){return ap("{\n",aq(an(a,"\n")),"\n}")}function ap(a,b,c=""){return null!=b&&""!==b?a+b+c:""}function aq(a){return ap("  ",a.replace(/\n/g,"\n  "))}function ar(a){var b;return null!=(b=null==a?void 0:a.some(a=>a.includes("\n")))&&b}let as=(a,b)=>{let c,d,e,f,h,i="string"==typeof a||"kind"in a?a:String(a),j="string"==typeof i?i:function(a,b,c=M){let d,e,f,h=new Map;for(let a of Object.values(g))h.set(a,function(a,b){let c=a[b];return"object"==typeof c?c:"function"==typeof c?{enter:c,leave:void 0}:{enter:a.enter,leave:a.leave}}(b,a));let i=Array.isArray(a),j=[a],k=-1,l=[],m=a,n=[],o=[];do{var p,q,r;let a,g=++k===j.length,s=g&&0!==l.length;if(g){if(e=0===o.length?void 0:n[n.length-1],m=f,f=o.pop(),s)if(i){m=m.slice();let a=0;for(let[b,c]of l){let d=b-a;null===c?(m.splice(d,1),a++):m[d]=c}}else for(let[a,b]of(m={...m},l))m[a]=b;k=d.index,j=d.keys,l=d.edits,i=d.inArray,d=d.prev}else if(f){if(null==(m=f[e=i?k:j[k]]))continue;n.push(e)}if(!Array.isArray(m)){O(m)||ab(!1,`Invalid AST Node: ${ac(m,[])}.`);let c=g?null==(p=h.get(m.kind))?void 0:p.leave:null==(q=h.get(m.kind))?void 0:q.enter;if((a=null==c?void 0:c.call(b,m,e,f,n,o))===al)break;if(!1===a){if(!g){n.pop();continue}}else if(void 0!==a&&(l.push([e,a]),!g))if(O(a))m=a;else{n.pop();continue}}void 0===a&&s&&l.push([e,m]),g?n.pop():(d={inArray:i,index:k,keys:j,edits:l,prev:d},j=(i=Array.isArray(m))?m:null!=(r=c[m.kind])?r:[],k=-1,l=[],f&&o.push(f),f=m)}while(void 0!==d)return 0!==l.length?l[l.length-1][1]:a}(i,am),k=!1;if(b)return{expression:j,isMutation:k,operationName:c};let l=(a=>{try{let b,c=a();if(b=c,"object"==typeof b&&null!==b&&"then"in b&&"function"==typeof b.then&&"catch"in b&&"function"==typeof b.catch&&"finally"in b&&"function"==typeof b.finally)return c.catch(a=>r(a));return c}catch(a){return r(a)}})(()=>{let a,b;return"string"==typeof i?(Object.defineProperty(b=(a=new af(i,void 0)).parseDocument(),"tokenCount",{enumerable:!1,value:a.tokenCount}),b):i});return l instanceof Error?{expression:j,isMutation:k,operationName:c}:(1===(e=l.definitions.filter(C)).length&&(d=e[0].name?.value),c=d,f=!1,1===(h=l.definitions.filter(C)).length&&(f="mutation"===h[0].operation),{expression:j,operationName:c,isMutation:k=f})},at=JSON,au=async a=>{let b={...a,method:"Single"===a.request._tag?a.request.document.isMutation?"POST":(a.method??"post").toUpperCase():a.request.hasMutations?"POST":(a.method??"post").toUpperCase(),fetchOptions:{...a.fetchOptions,errorPolicy:a.fetchOptions.errorPolicy??"none"}},c=ax(b.method),d=await c(b),e=await aw(d,a.fetchOptions.jsonSerializer??at);if(e instanceof Error)throw e;let f={status:d.status,headers:d.headers};if(!d.ok||("Batch"===e._tag?e.executionResults.some(B):B(e.executionResult))&&"none"===b.fetchOptions.errorPolicy)return new m("Batch"===e._tag?{...e.executionResults,...f}:{...e.executionResult,...f},{query:"Single"===a.request._tag?a.request.document.expression:a.request.query,variables:a.request.variables});switch(e._tag){case"Single":return{...f,...av(b)(e.executionResult)};case"Batch":return{...f,data:e.executionResults.map(av(b))};default:s(e)}},av=a=>b=>({extensions:b.extensions,data:b.data,errors:"all"===a.fetchOptions.errorPolicy?b.errors:void 0}),aw=async(a,b)=>{let c,d=a.headers.get(v),e=await a.text();if(d&&((c=d.toLowerCase()).includes(x)||c.includes(w)))return z(b.parse(e));try{let a=b.parse(e);return z(a)}catch{let a=e.length>500?`${e.slice(0,500)}...`:e;return Error(`Response has unsupported content-type: ${d||"none"}. Expected 'application/json' or 'application/graphql-response+json'. Response body preview: ${a}`)}},ax=a=>async b=>{let c,d=new Headers(b.headers),e=null;d.has(u)||d.set(u,[x,w].join(", ")),"POST"===a?"string"!=typeof(c=(b.fetchOptions.jsonSerializer??at).stringify(ay(b)))||d.has(v)||d.set(v,w):e=az(b);let f={method:a,headers:d,body:c,...b.fetchOptions},g=new URL(b.url),h=f;if(b.middleware){let{url:a,...c}=await Promise.resolve(b.middleware({...f,url:b.url,operationName:"Single"===b.request._tag?b.request.document.operationName:void 0,variables:b.request.variables}));g=new URL(a),h=c}e&&e.forEach((a,b)=>{g.searchParams.append(b,a)});let i=b.fetch??fetch;return await i(g,h)},ay=a=>{switch(a.request._tag){case"Single":return{query:a.request.document.expression,variables:a.request.variables,operationName:a.request.document.operationName};case"Batch":return o(a.request.query,a.request.variables??[]).map(([a,b])=>({query:a,variables:b}));default:throw s(a.request)}},az=a=>{let b=a.fetchOptions.jsonSerializer??at,c=new URLSearchParams;switch(a.request._tag){case"Single":return c.append("query",y(a.request.document.expression)),a.request.variables&&c.append("variables",b.stringify(a.request.variables)),a.request.document.operationName&&c.append("operationName",a.request.document.operationName),c;case"Batch":{let d=a.request.variables?.map(a=>b.stringify(a))??[],e=o(a.request.query.map(y),d).map(([a,b])=>({query:a,variables:b}));return c.append("query",b.stringify(e)),c}default:throw s(a.request)}};class aA{url;requestConfig;constructor(a,b={}){this.url=a,this.requestConfig=b}rawRequest=async(...a)=>{let[b,c,d]=a,e=b.query?b:{query:b,variables:c,requestHeaders:d,signal:void 0},{headers:f,fetch:g=globalThis.fetch,method:h="POST",requestMiddleware:i,responseMiddleware:j,excludeOperationName:k,...l}=this.requestConfig,{url:m}=this;void 0!==e.signal&&(l.signal=e.signal);let o=as(e.query,k),q=await au({url:m,request:{_tag:"Single",document:o,variables:e.variables},headers:{...p(n(f)),...p(e.requestHeaders)},fetch:g,method:h,fetchOptions:l,middleware:i});if(j&&await j(q,{operationName:o.operationName,variables:c,url:this.url}),q instanceof Error)throw q;return q};async request(a,...b){let[c,d]=b,e=aC(a,c,d),{headers:f,fetch:g=globalThis.fetch,method:h="POST",requestMiddleware:i,responseMiddleware:j,excludeOperationName:k,...l}=this.requestConfig,{url:m}=this;void 0!==e.signal&&(l.signal=e.signal);let o=as(e.document,k),q=await au({url:m,request:{_tag:"Single",document:o,variables:e.variables},headers:{...p(n(f)),...p(e.requestHeaders)},fetch:g,method:h,fetchOptions:l,middleware:i});if(j&&await j(q,{operationName:o.operationName,variables:e.variables,url:this.url}),q instanceof Error)throw q;return q.data}async batchRequests(a,b){let c=a.documents?a:{documents:a,requestHeaders:b,signal:void 0},{headers:d,excludeOperationName:e,...f}=this.requestConfig;void 0!==c.signal&&(f.signal=c.signal);let g=c.documents.map(({document:a})=>as(a,e)),h=g.map(({expression:a})=>a),i=g.some(({isMutation:a})=>a),j=c.documents.map(({variables:a})=>a),k=await au({url:this.url,request:{_tag:"Batch",operationName:void 0,query:h,hasMutations:i,variables:j},headers:{...p(n(d)),...p(c.requestHeaders)},fetch:this.requestConfig.fetch??globalThis.fetch,method:this.requestConfig.method||"POST",fetchOptions:f,middleware:this.requestConfig.requestMiddleware});if(this.requestConfig.responseMiddleware&&await this.requestConfig.responseMiddleware(k,{operationName:void 0,variables:j,url:this.url}),k instanceof Error)throw k;return k.data}setHeaders(a){return this.requestConfig.headers=a,this}setHeader(a,b){let{headers:c}=this.requestConfig;return c?c[a]=b:this.requestConfig.headers={[a]:b},this}setEndpoint(a){return this.url=a,this}}async function aB(a,b,...c){let d=aD(a,b,...c);return new aA(d.url).request({...d})}let aC=(a,b,c)=>a.document?a:{document:a,variables:b,requestHeaders:c,signal:void 0},aD=(a,b,...c)=>{let[d,e]=c;return"string"==typeof a?{url:a,document:b,variables:d,requestHeaders:e,signal:void 0}:a},aE=(a,...b)=>a.reduce((a,c,d)=>`${a}${c}${d in b?String(b[d]):""}`,""),aF={production:process.env.SUBGRAPH_URL||"https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1",development:process.env.SUBGRAPH_URL||"http://localhost:8000/subgraphs/name/atlas-protocol",storyTestnet:process.env.SUBGRAPH_URL||"https://api.goldsky.com/api/public/atlas-protocol/testnet/subgraphs/atlas-v1"};function aG(){return aF.production}new aA(aG(),{headers:{"Content-Type":"application/json"}}),aE`
  query GetIPAsset($id: ID!) {
    ipAsset(id: $id) {
      id
      ipId
      name
      description
      creator
      ipHash
      timestamp
      blockNumber
      
      # CVS Metrics
      totalUsageCount
      totalLicenseRevenue
      totalRemixes
      cvsScore
      
      # Licensing
      commercialUse
      derivatives
      royaltyPercent
      mintingFee
      
      # Recent Usage
      usageEvents(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        user
        usageType
        revenueGenerated
        cvsImpact
        timestamp
        transactionHash
      }
      
      # License Sales
      licenseSales(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        licensee
        salePrice
        licenseType
        cvsIncrement
        timestamp
      }
      
      # Associated Vault
      vault {
        id
        vaultAddress
        currentCVS
        maxLoanAmount
        interestRate
      }
    }
  }
`,aE`
  query GetIPAssets($first: Int = 10, $skip: Int = 0, $orderBy: String = "timestamp", $orderDirection: String = "desc") {
    ipAssets(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      ipId
      name
      creator
      cvsScore
      totalLicenseRevenue
      totalUsageCount
      totalRemixes
      timestamp
    }
  }
`,aE`
  query GetIPUsageEvents($ipAssetId: ID!, $first: Int = 50) {
    ipAssetUsages(
      where: { ipAsset: $ipAssetId }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      user
      usageType
      revenueGenerated
      cvsImpact
      timestamp
      blockNumber
      transactionHash
    }
  }
`;let aH=aE`
  query GetVault($id: ID!) {
    idoVault(id: $id) {
      id
      vaultAddress
      creator
      
      # CVS Metrics
      currentCVS
      initialCVS
      lastCVSUpdate
      
      # Vault Status
      totalLiquidity
      availableLiquidity
      totalLoansIssued
      activeLoansCount
      
      # Loan Terms
      maxLoanAmount
      interestRate
      collateralRatio
      
      # Financial
      totalLicenseRevenue
      totalLoanRepayments
      utilizationRate
      
      # Timestamps
      createdAt
      updatedAt
      
      # IP Asset
      ipAsset {
        id
        name
        creator
        cvsScore
        totalUsageCount
        totalLicenseRevenue
      }
      
      # Active Loans
      loans(where: { status: Active }, first: 20) {
        id
        loanId
        borrower
        loanAmount
        collateralAmount
        interestRate
        cvsAtIssuance
        requiredCVS
        outstandingAmount
        startTime
        endTime
      }
      
      # Recent License Sales
      licenseSales(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        licensee
        salePrice
        licenseType
        cvsIncrement
        creatorShare
        vaultShare
        timestamp
      }
      
      # Recent Deposits
      deposits(first: 5, orderBy: timestamp, orderDirection: desc) {
        id
        depositor
        amount
        shares
        timestamp
      }
    }
  }
`;aE`
  query GetVaults($first: Int = 10, $skip: Int = 0, $minCVS: BigInt) {
    idoVaults(
      first: $first
      skip: $skip
      where: { currentCVS_gte: $minCVS }
      orderBy: currentCVS
      orderDirection: desc
    ) {
      id
      vaultAddress
      creator
      currentCVS
      maxLoanAmount
      interestRate
      totalLiquidity
      activeLoansCount
      totalLicenseRevenue
      utilizationRate
      ipAsset {
        name
        totalUsageCount
      }
    }
  }
`,aE`
  query GetVaultByCreator($creator: Bytes!) {
    idoVaults(where: { creator: $creator }, orderBy: createdAt, orderDirection: desc) {
      id
      vaultAddress
      currentCVS
      maxLoanAmount
      interestRate
      totalLiquidity
      activeLoansCount
      ipAsset {
        name
        cvsScore
      }
    }
  }
`,aE`
  query GetLicenseSales($first: Int = 20, $skip: Int = 0) {
    dataLicenseSales(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      salePrice
      licenseType
      cvsIncrement
      creatorShare
      vaultShare
      protocolFee
      timestamp
      licensee
      ipAsset {
        id
        name
        creator
      }
      vault {
        id
        currentCVS
      }
    }
  }
`,aE`
  query GetHighImpactLicenseSales($minCVSIncrement: BigInt!) {
    dataLicenseSales(
      where: { cvsIncrement_gte: $minCVSIncrement }
      orderBy: cvsIncrement
      orderDirection: desc
      first: 20
    ) {
      id
      salePrice
      licenseType
      cvsIncrement
      ipAsset {
        name
        creator
        cvsScore
      }
      vault {
        currentCVS
        maxLoanAmount
      }
      timestamp
    }
  }
`,aE`
  query GetLoan($id: ID!) {
    loan(id: $id) {
      id
      loanId
      borrower
      loanAmount
      collateralAmount
      interestRate
      duration
      cvsAtIssuance
      requiredCVS
      status
      repaidAmount
      outstandingAmount
      startTime
      endTime
      issuedAt
      lastPaymentAt
      
      vault {
        id
        vaultAddress
        currentCVS
        ipAsset {
          name
        }
      }
      
      payments(orderBy: timestamp, orderDirection: desc) {
        id
        payer
        amount
        isPrincipal
        timestamp
      }
    }
  }
`,aE`
  query GetActiveLoans($first: Int = 50) {
    loans(where: { status: Active }, first: $first, orderBy: endTime) {
      id
      loanId
      borrower
      loanAmount
      outstandingAmount
      interestRate
      endTime
      cvsAtIssuance
      vault {
        vaultAddress
        currentCVS
        ipAsset {
          name
        }
      }
    }
  }
`,aE`
  query GetLoansByBorrower($borrower: Bytes!) {
    loans(where: { borrower: $borrower }, orderBy: issuedAt, orderDirection: desc) {
      id
      loanId
      loanAmount
      collateralAmount
      interestRate
      status
      outstandingAmount
      endTime
      vault {
        vaultAddress
        ipAsset {
          name
        }
      }
    }
  }
`;let aI=aE`
  query GetGlobalStats {
    globalStats(id: "global") {
      totalIPAssets
      totalLicenses
      totalLoans
      totalIDOPools
      totalBridgeTransactions
      totalVerifiedUsers
      lastUpdated
    }
  }
`,aJ=aE`
  query GetCVSLeaderboard($first: Int = 10) {
    ipAssets(first: $first, orderBy: cvsScore, orderDirection: desc) {
      id
      name
      creator
      cvsScore
      totalLicenseRevenue
      totalUsageCount
      totalRemixes
      vault {
        currentCVS
        maxLoanAmount
        interestRate
      }
    }
  }
`;aE`
  query GetVaultAnalytics($vaultId: ID!, $timeframe: Int = 2592000) {
    idoVault(id: $vaultId) {
      id
      currentCVS
      totalLicenseRevenue
      totalLoanRepayments
      utilizationRate
      
      # Recent license sales for revenue chart
      licenseSales(
        first: 100
        orderBy: timestamp
        orderDirection: desc
      ) {
        salePrice
        cvsIncrement
        timestamp
      }
      
      # Loans for risk analysis
      loans {
        status
        loanAmount
        repaidAmount
        outstandingAmount
      }
    }
  }
`;var aK=a.i(99745),aL=a.i(18544),aM=a.i(76644),aN=a.i(33791),aO=a.i(79715),aP=a.i(42871),aQ=a.i(8361),aR=class extends aN.Subscribable{constructor(a,b){super(),this.options=b,this.#a=a,this.#b=null,this.#c=(0,aO.pendingThenable)(),this.bindMethods(),this.setOptions(b)}#a;#d=void 0;#e=void 0;#f=void 0;#g;#h;#c;#b;#i;#j;#k;#l;#m;#n;#o=new Set;bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){1===this.listeners.size&&(this.#d.addObserver(this),aS(this.#d,this.options)?this.#p():this.updateResult(),this.#q())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return aT(this.#d,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return aT(this.#d,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#r(),this.#s(),this.#d.removeObserver(this)}setOptions(a){let b=this.options,c=this.#d;if(this.options=this.#a.defaultQueryOptions(a),void 0!==this.options.enabled&&"boolean"!=typeof this.options.enabled&&"function"!=typeof this.options.enabled&&"boolean"!=typeof(0,aP.resolveEnabled)(this.options.enabled,this.#d))throw Error("Expected enabled to be a boolean or a callback that returns a boolean");this.#t(),this.#d.setOptions(this.options),b._defaulted&&!(0,aP.shallowEqualObjects)(this.options,b)&&this.#a.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#d,observer:this});let d=this.hasListeners();d&&aU(this.#d,c,this.options,b)&&this.#p(),this.updateResult(),d&&(this.#d!==c||(0,aP.resolveEnabled)(this.options.enabled,this.#d)!==(0,aP.resolveEnabled)(b.enabled,this.#d)||(0,aP.resolveStaleTime)(this.options.staleTime,this.#d)!==(0,aP.resolveStaleTime)(b.staleTime,this.#d))&&this.#u();let e=this.#v();d&&(this.#d!==c||(0,aP.resolveEnabled)(this.options.enabled,this.#d)!==(0,aP.resolveEnabled)(b.enabled,this.#d)||e!==this.#n)&&this.#w(e)}getOptimisticResult(a){var b,c;let d=this.#a.getQueryCache().build(this.#a,a),e=this.createResult(d,a);return b=this,c=e,(0,aP.shallowEqualObjects)(b.getCurrentResult(),c)||(this.#f=e,this.#h=this.options,this.#g=this.#d.state),e}getCurrentResult(){return this.#f}trackResult(a,b){return new Proxy(a,{get:(a,c)=>(this.trackProp(c),b?.(c),"promise"===c&&(this.trackProp("data"),this.options.experimental_prefetchInRender||"pending"!==this.#c.status||this.#c.reject(Error("experimental_prefetchInRender feature flag is not enabled"))),Reflect.get(a,c))})}trackProp(a){this.#o.add(a)}getCurrentQuery(){return this.#d}refetch({...a}={}){return this.fetch({...a})}fetchOptimistic(a){let b=this.#a.defaultQueryOptions(a),c=this.#a.getQueryCache().build(this.#a,b);return c.fetch().then(()=>this.createResult(c,b))}fetch(a){return this.#p({...a,cancelRefetch:a.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#f))}#p(a){this.#t();let b=this.#d.fetch(this.options,a);return a?.throwOnError||(b=b.catch(aP.noop)),b}#u(){this.#r();let a=(0,aP.resolveStaleTime)(this.options.staleTime,this.#d);if(aP.isServer||this.#f.isStale||!(0,aP.isValidTimeout)(a))return;let b=(0,aP.timeUntilStale)(this.#f.dataUpdatedAt,a);this.#l=aQ.timeoutManager.setTimeout(()=>{this.#f.isStale||this.updateResult()},b+1)}#v(){return("function"==typeof this.options.refetchInterval?this.options.refetchInterval(this.#d):this.options.refetchInterval)??!1}#w(a){this.#s(),this.#n=a,!aP.isServer&&!1!==(0,aP.resolveEnabled)(this.options.enabled,this.#d)&&(0,aP.isValidTimeout)(this.#n)&&0!==this.#n&&(this.#m=aQ.timeoutManager.setInterval(()=>{(this.options.refetchIntervalInBackground||aK.focusManager.isFocused())&&this.#p()},this.#n))}#q(){this.#u(),this.#w(this.#v())}#r(){this.#l&&(aQ.timeoutManager.clearTimeout(this.#l),this.#l=void 0)}#s(){this.#m&&(aQ.timeoutManager.clearInterval(this.#m),this.#m=void 0)}createResult(a,b){let c,d=this.#d,e=this.options,f=this.#f,g=this.#g,h=this.#h,i=a!==d?a.state:this.#e,{state:j}=a,k={...j},l=!1;if(b._optimisticResults){let c=this.hasListeners(),f=!c&&aS(a,b),g=c&&aU(a,d,b,e);(f||g)&&(k={...k,...(0,aM.fetchState)(j.data,a.options)}),"isRestoring"===b._optimisticResults&&(k.fetchStatus="idle")}let{error:m,errorUpdatedAt:n,status:o}=k;c=k.data;let p=!1;if(void 0!==b.placeholderData&&void 0===c&&"pending"===o){let a;f?.isPlaceholderData&&b.placeholderData===h?.placeholderData?(a=f.data,p=!0):a="function"==typeof b.placeholderData?b.placeholderData(this.#k?.state.data,this.#k):b.placeholderData,void 0!==a&&(o="success",c=(0,aP.replaceData)(f?.data,a,b),l=!0)}if(b.select&&void 0!==c&&!p)if(f&&c===g?.data&&b.select===this.#i)c=this.#j;else try{this.#i=b.select,c=b.select(c),c=(0,aP.replaceData)(f?.data,c,b),this.#j=c,this.#b=null}catch(a){this.#b=a}this.#b&&(m=this.#b,c=this.#j,n=Date.now(),o="error");let q="fetching"===k.fetchStatus,r="pending"===o,s="error"===o,t=r&&q,u=void 0!==c,v={status:o,fetchStatus:k.fetchStatus,isPending:r,isSuccess:"success"===o,isError:s,isInitialLoading:t,isLoading:t,data:c,dataUpdatedAt:k.dataUpdatedAt,error:m,errorUpdatedAt:n,failureCount:k.fetchFailureCount,failureReason:k.fetchFailureReason,errorUpdateCount:k.errorUpdateCount,isFetched:k.dataUpdateCount>0||k.errorUpdateCount>0,isFetchedAfterMount:k.dataUpdateCount>i.dataUpdateCount||k.errorUpdateCount>i.errorUpdateCount,isFetching:q,isRefetching:q&&!r,isLoadingError:s&&!u,isPaused:"paused"===k.fetchStatus,isPlaceholderData:l,isRefetchError:s&&u,isStale:aV(a,b),refetch:this.refetch,promise:this.#c,isEnabled:!1!==(0,aP.resolveEnabled)(b.enabled,a)};if(this.options.experimental_prefetchInRender){let b=a=>{"error"===v.status?a.reject(v.error):void 0!==v.data&&a.resolve(v.data)},c=()=>{b(this.#c=v.promise=(0,aO.pendingThenable)())},e=this.#c;switch(e.status){case"pending":a.queryHash===d.queryHash&&b(e);break;case"fulfilled":("error"===v.status||v.data!==e.value)&&c();break;case"rejected":("error"!==v.status||v.error!==e.reason)&&c()}}return v}updateResult(){let a=this.#f,b=this.createResult(this.#d,this.options);if(this.#g=this.#d.state,this.#h=this.options,void 0!==this.#g.data&&(this.#k=this.#d),(0,aP.shallowEqualObjects)(b,a))return;this.#f=b;let c=()=>{if(!a)return!0;let{notifyOnChangeProps:b}=this.options,c="function"==typeof b?b():b;if("all"===c||!c&&!this.#o.size)return!0;let d=new Set(c??this.#o);return this.options.throwOnError&&d.add("error"),Object.keys(this.#f).some(b=>this.#f[b]!==a[b]&&d.has(b))};this.#x({listeners:c()})}#t(){let a=this.#a.getQueryCache().build(this.#a,this.options);if(a===this.#d)return;let b=this.#d;this.#d=a,this.#e=a.state,this.hasListeners()&&(b?.removeObserver(this),a.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#q()}#x(a){aL.notifyManager.batch(()=>{a.listeners&&this.listeners.forEach(a=>{a(this.#f)}),this.#a.getQueryCache().notify({query:this.#d,type:"observerResultsUpdated"})})}};function aS(a,b){return!1!==(0,aP.resolveEnabled)(b.enabled,a)&&void 0===a.state.data&&("error"!==a.state.status||!1!==b.retryOnMount)||void 0!==a.state.data&&aT(a,b,b.refetchOnMount)}function aT(a,b,c){if(!1!==(0,aP.resolveEnabled)(b.enabled,a)&&"static"!==(0,aP.resolveStaleTime)(b.staleTime,a)){let d="function"==typeof c?c(a):c;return"always"===d||!1!==d&&aV(a,b)}return!1}function aU(a,b,c,d){return(a!==b||!1===(0,aP.resolveEnabled)(d.enabled,a))&&(!c.suspense||"error"!==a.state.status)&&aV(a,c)}function aV(a,b){return!1!==(0,aP.resolveEnabled)(b.enabled,a)&&a.isStaleByTime((0,aP.resolveStaleTime)(b.staleTime,a))}var aW=a.i(37927),aX=l.createContext((b=!1,{clearReset:()=>{b=!1},reset:()=>{b=!0},isReset:()=>b})),aY=l.createContext(!1);aY.Provider;var aZ=(a,b,c)=>b.fetchOptimistic(a).catch(()=>{c.clearReset()});function a$(a,b){return function(a,b,c){let d=l.useContext(aY),e=l.useContext(aX),f=(0,aW.useQueryClient)(c),g=f.defaultQueryOptions(a);if(f.getDefaultOptions().queries?._experimental_beforeQuery?.(g),g._optimisticResults=d?"isRestoring":"optimistic",g.suspense){let a=a=>"static"===a?a:Math.max(a??1e3,1e3),b=g.staleTime;g.staleTime="function"==typeof b?(...c)=>a(b(...c)):a(b),"number"==typeof g.gcTime&&(g.gcTime=Math.max(g.gcTime,1e3))}(g.suspense||g.throwOnError||g.experimental_prefetchInRender)&&!e.isReset()&&(g.retryOnMount=!1),l.useEffect(()=>{e.clearReset()},[e]);let h=!f.getQueryCache().get(g.queryHash),[i]=l.useState(()=>new b(f,g)),j=i.getOptimisticResult(g),k=!d&&!1!==a.subscribed;if(l.useSyncExternalStore(l.useCallback(a=>{let b=k?i.subscribe(aL.notifyManager.batchCalls(a)):aP.noop;return i.updateResult(),b},[i,k]),()=>i.getCurrentResult(),()=>i.getCurrentResult()),l.useEffect(()=>{i.setOptions(g)},[g,i]),g?.suspense&&j.isPending)throw aZ(g,i,e);if((({result:a,errorResetBoundary:b,throwOnError:c,query:d,suspense:e})=>a.isError&&!b.isReset()&&!a.isFetching&&d&&(e&&void 0===a.data||(0,aP.shouldThrowError)(c,[a.error,d])))({result:j,errorResetBoundary:e,throwOnError:g.throwOnError,query:f.getQueryCache().get(g.queryHash),suspense:g.suspense}))throw j.error;if(f.getDefaultOptions().queries?._experimental_afterQuery?.(g,j),g.experimental_prefetchInRender&&!aP.isServer&&j.isLoading&&j.isFetching&&!d){let a=h?aZ(g,i,e):f.getQueryCache().get(g.queryHash)?.promise;a?.catch(aP.noop).finally(()=>{i.updateResult()})}return g.notifyOnChangeProps?j:i.trackResult(j)}(a,aR,b)}function a_(a){return a$({queryKey:["vault",a],queryFn:async()=>(await aB(aG(),aH,{id:a})).idoVault,enabled:!!a,staleTime:15e3,refetchInterval:3e4})}function a0(){let[a,b]=(0,l.useState)(""),[c,d]=(0,l.useState)(""),{data:e}=a$({queryKey:["globalStats"],queryFn:async()=>(await aB(aG(),aI)).globalStats,staleTime:12e4,refetchInterval:3e5}),{data:f}=function(a=10){return a$({queryKey:["cvsLeaderboard",a],queryFn:async()=>(await aB(aG(),aJ,{first:a})).ipAssets,staleTime:12e4})}(5),{data:g,isLoading:h}=a_(a),{healthScore:i,metrics:j}=function(a){let{data:b,...c}=a_(a);if(!b)return{...c,healthScore:0,metrics:null};let d=parseFloat(b.utilizationRate||"0"),e=b.currentCVS>b.initialCVS?(b.currentCVS-b.initialCVS)/b.initialCVS*100:0,f=b.totalLiquidity>0?b.availableLiquidity/b.totalLiquidity*100:0,g=Math.min(100,(d<80?30:10)+(e>0?30:10)+(f>20?20:f)+(b.activeLoansCount<10?20:10));return{...c,vault:b,healthScore:g,metrics:{utilizationRate:d,cvsGrowth:e,liquidityRatio:f,activeLoans:b.activeLoansCount}}}(a),m=function(a,b){let{data:c,...d}=a_(a),e=!!c&&BigInt(c.maxLoanAmount)>=BigInt(b)&&BigInt(c.availableLiquidity)>=BigInt(b);return{...d,vault:c,isEligible:e,maxLoanAmount:c?.maxLoanAmount,interestRate:c?.interestRate,collateralRatio:c?.collateralRatio}}(a,c||"0");return(0,k.jsx)("div",{className:"min-h-screen p-8 bg-gray-50 dark:bg-gray-900",children:(0,k.jsxs)("div",{className:"max-w-7xl mx-auto",children:[(0,k.jsx)("h1",{className:"text-4xl font-bold mb-8",children:"Atlas Protocol Dashboard"}),(0,k.jsxs)("div",{className:"grid md:grid-cols-4 gap-6 mb-8",children:[(0,k.jsx)(a1,{title:"Total IP Assets",value:e?.totalIPAssets||"0",icon:"🎨"}),(0,k.jsx)(a1,{title:"Total Licenses",value:e?.totalLicenses||"0",icon:"📄"}),(0,k.jsx)(a1,{title:"Total Loans",value:e?.totalLoans||"0",icon:"💰"}),(0,k.jsx)(a1,{title:"Verified Users",value:e?.totalVerifiedUsers||"0",icon:"✅"})]}),(0,k.jsxs)("div",{className:"mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6",children:[(0,k.jsx)("h2",{className:"text-2xl font-semibold mb-4",children:"🏆 Top IP Assets by CVS"}),f&&f.length>0?(0,k.jsx)("div",{className:"space-y-3",children:f.map((a,b)=>(0,k.jsxs)("div",{className:"flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,k.jsxs)("div",{className:"flex items-center gap-4",children:[(0,k.jsxs)("span",{className:"text-2xl font-bold text-gray-400",children:["#",b+1]}),(0,k.jsxs)("div",{children:[(0,k.jsx)("h3",{className:"font-semibold",children:a.name}),(0,k.jsxs)("p",{className:"text-sm text-gray-500",children:["Creator: ",a.creator.slice(0,6),"...",a.creator.slice(-4)]})]})]}),(0,k.jsxs)("div",{className:"text-right",children:[(0,k.jsxs)("p",{className:"font-bold text-blue-600",children:["CVS: ",a.cvsScore]}),(0,k.jsxs)("p",{className:"text-sm text-gray-500",children:["Revenue: ",a.totalLicenseRevenue]})]})]},a.id))}):(0,k.jsx)("p",{className:"text-gray-500",children:"No data available"})]}),(0,k.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8",children:[(0,k.jsx)("h2",{className:"text-2xl font-semibold mb-4",children:"🏦 Vault Lookup"}),(0,k.jsx)("input",{type:"text",placeholder:"Enter vault address (0x...)",value:a,onChange:a=>b(a.target.value),className:"w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-4"}),h&&(0,k.jsx)("p",{children:"Loading vault data..."}),g&&(0,k.jsxs)("div",{className:"space-y-6",children:[(0,k.jsxs)("div",{className:"grid md:grid-cols-3 gap-4",children:[(0,k.jsxs)("div",{className:"p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg",children:[(0,k.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Current CVS"}),(0,k.jsx)("p",{className:"text-2xl font-bold text-blue-600",children:g.currentCVS})]}),(0,k.jsxs)("div",{className:"p-4 bg-green-50 dark:bg-green-900/20 rounded-lg",children:[(0,k.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Max Loan Amount"}),(0,k.jsx)("p",{className:"text-2xl font-bold text-green-600",children:g.maxLoanAmount})]}),(0,k.jsxs)("div",{className:"p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg",children:[(0,k.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Interest Rate"}),(0,k.jsxs)("p",{className:"text-2xl font-bold text-purple-600",children:[g.interestRate,"%"]})]})]}),i>0&&(0,k.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,k.jsx)("h3",{className:"font-semibold mb-2",children:"Vault Health Score"}),(0,k.jsxs)("div",{className:"flex items-center gap-4",children:[(0,k.jsx)("div",{className:"flex-1",children:(0,k.jsx)("div",{className:"h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden",children:(0,k.jsx)("div",{className:`h-full ${i>=80?"bg-green-500":i>=50?"bg-yellow-500":"bg-red-500"}`,style:{width:`${i}%`}})})}),(0,k.jsxs)("span",{className:"font-bold",children:[i.toFixed(0),"/100"]})]}),j&&(0,k.jsxs)("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-sm",children:[(0,k.jsxs)("div",{children:[(0,k.jsx)("span",{className:"text-gray-500",children:"Utilization:"}),(0,k.jsxs)("span",{className:"ml-2 font-semibold",children:[j.utilizationRate.toFixed(1),"%"]})]}),(0,k.jsxs)("div",{children:[(0,k.jsx)("span",{className:"text-gray-500",children:"CVS Growth:"}),(0,k.jsxs)("span",{className:"ml-2 font-semibold",children:[j.cvsGrowth.toFixed(1),"%"]})]}),(0,k.jsxs)("div",{children:[(0,k.jsx)("span",{className:"text-gray-500",children:"Liquidity:"}),(0,k.jsxs)("span",{className:"ml-2 font-semibold",children:[j.liquidityRatio.toFixed(1),"%"]})]}),(0,k.jsxs)("div",{children:[(0,k.jsx)("span",{className:"text-gray-500",children:"Active Loans:"}),(0,k.jsx)("span",{className:"ml-2 font-semibold",children:j.activeLoans})]})]})]}),(0,k.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,k.jsx)("h3",{className:"font-semibold mb-3",children:"Check Loan Eligibility"}),(0,k.jsx)("input",{type:"number",placeholder:"Loan amount",value:c,onChange:a=>d(a.target.value),className:"w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mb-3"}),void 0!==m.isEligible&&c&&(0,k.jsx)("div",{className:`p-3 rounded ${m.isEligible?"bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400":"bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`,children:m.isEligible?(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)("p",{className:"font-semibold",children:"✅ Eligible for loan"}),(0,k.jsxs)("p",{className:"text-sm mt-1",children:["Interest Rate: ",m.interestRate,"%"]}),(0,k.jsxs)("p",{className:"text-sm",children:["Collateral Required: ",m.collateralRatio,"%"]})]}):(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)("p",{className:"font-semibold",children:"❌ Not eligible"}),(0,k.jsxs)("p",{className:"text-sm mt-1",children:["Max loan amount: ",m.maxLoanAmount]})]})})]}),g.ipAsset&&(0,k.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,k.jsx)("h3",{className:"font-semibold mb-2",children:"IP Asset"}),(0,k.jsx)("p",{className:"font-medium",children:g.ipAsset.name}),(0,k.jsxs)("p",{className:"text-sm text-gray-500",children:["Creator: ",g.ipAsset.creator]}),(0,k.jsxs)("div",{className:"grid grid-cols-3 gap-2 mt-3 text-sm",children:[(0,k.jsxs)("div",{children:[(0,k.jsx)("span",{className:"text-gray-500",children:"Usage Count:"}),(0,k.jsx)("span",{className:"ml-2 font-semibold",children:g.ipAsset.totalUsageCount})]}),(0,k.jsxs)("div",{children:[(0,k.jsx)("span",{className:"text-gray-500",children:"Revenue:"}),(0,k.jsx)("span",{className:"ml-2 font-semibold",children:g.ipAsset.totalLicenseRevenue})]}),(0,k.jsxs)("div",{children:[(0,k.jsx)("span",{className:"text-gray-500",children:"CVS Score:"}),(0,k.jsx)("span",{className:"ml-2 font-semibold",children:g.ipAsset.cvsScore})]})]})]}),g.loans&&g.loans.length>0&&(0,k.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,k.jsxs)("h3",{className:"font-semibold mb-3",children:["Active Loans (",g.loans.length,")"]}),(0,k.jsx)("div",{className:"space-y-2",children:g.loans.slice(0,5).map(a=>(0,k.jsxs)("div",{className:"p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600",children:[(0,k.jsxs)("div",{className:"flex justify-between",children:[(0,k.jsxs)("span",{className:"text-sm text-gray-500",children:["Borrower: ",a.borrower.slice(0,6),"...",a.borrower.slice(-4)]}),(0,k.jsx)("span",{className:"font-semibold",children:a.loanAmount})]}),(0,k.jsxs)("div",{className:"text-xs text-gray-500 mt-1",children:["Interest: ",a.interestRate,"% | CVS at Issuance: ",a.cvsAtIssuance]})]},a.id))})]})]})]})]})})}function a1({title:a,value:b,icon:c}){return(0,k.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow p-6",children:[(0,k.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,k.jsx)("span",{className:"text-sm text-gray-500",children:a}),(0,k.jsx)("span",{className:"text-2xl",children:c})]}),(0,k.jsx)("p",{className:"text-3xl font-bold",children:b})]})}a.s(["default",()=>a0],41704)}];

//# sourceMappingURL=apps_web_src_app_dashboard_page_tsx_80878b48._.js.map