(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,93456,e=>{"use strict";let t;var i,r,s,n,a,o,l,c,u=e.i(43476),d=e.i(71645),h=e.i(47167);class p extends Error{response;request;constructor(e,t){super(`${p.extractMessage(e)}: ${JSON.stringify({response:e,request:t})}`),Object.setPrototypeOf(this,p.prototype),this.response=e,this.request=t,"function"==typeof Error.captureStackTrace&&Error.captureStackTrace(this,p)}static extractMessage(e){return e.errors?.[0]?.message??`GraphQL Error (Code: ${String(e.status)})`}}let m=e=>"function"==typeof e?e():e,f=(e,t)=>e.map((e,i)=>[e,t[i]]),y=e=>{let t={};return e instanceof Headers?t=v(e):Array.isArray(e)?e.forEach(([e,i])=>{e&&void 0!==i&&(t[e]=i)}):e&&(t=e),t},v=e=>{let t={};return e.forEach((e,i)=>{t[i]=e}),t},E=e=>e instanceof Error?e:Error(String(e)),g=e=>{throw Error(`Unhandled case: ${String(e)}`)},x=e=>"object"==typeof e&&null!==e&&!Array.isArray(e);(i=a||(a={})).NAME="Name",i.DOCUMENT="Document",i.OPERATION_DEFINITION="OperationDefinition",i.VARIABLE_DEFINITION="VariableDefinition",i.SELECTION_SET="SelectionSet",i.FIELD="Field",i.ARGUMENT="Argument",i.FRAGMENT_SPREAD="FragmentSpread",i.INLINE_FRAGMENT="InlineFragment",i.FRAGMENT_DEFINITION="FragmentDefinition",i.VARIABLE="Variable",i.INT="IntValue",i.FLOAT="FloatValue",i.STRING="StringValue",i.BOOLEAN="BooleanValue",i.NULL="NullValue",i.ENUM="EnumValue",i.LIST="ListValue",i.OBJECT="ObjectValue",i.OBJECT_FIELD="ObjectField",i.DIRECTIVE="Directive",i.NAMED_TYPE="NamedType",i.LIST_TYPE="ListType",i.NON_NULL_TYPE="NonNullType",i.SCHEMA_DEFINITION="SchemaDefinition",i.OPERATION_TYPE_DEFINITION="OperationTypeDefinition",i.SCALAR_TYPE_DEFINITION="ScalarTypeDefinition",i.OBJECT_TYPE_DEFINITION="ObjectTypeDefinition",i.FIELD_DEFINITION="FieldDefinition",i.INPUT_VALUE_DEFINITION="InputValueDefinition",i.INTERFACE_TYPE_DEFINITION="InterfaceTypeDefinition",i.UNION_TYPE_DEFINITION="UnionTypeDefinition",i.ENUM_TYPE_DEFINITION="EnumTypeDefinition",i.ENUM_VALUE_DEFINITION="EnumValueDefinition",i.INPUT_OBJECT_TYPE_DEFINITION="InputObjectTypeDefinition",i.DIRECTIVE_DEFINITION="DirectiveDefinition",i.SCHEMA_EXTENSION="SchemaExtension",i.SCALAR_TYPE_EXTENSION="ScalarTypeExtension",i.OBJECT_TYPE_EXTENSION="ObjectTypeExtension",i.INTERFACE_TYPE_EXTENSION="InterfaceTypeExtension",i.UNION_TYPE_EXTENSION="UnionTypeExtension",i.ENUM_TYPE_EXTENSION="EnumTypeExtension",i.INPUT_OBJECT_TYPE_EXTENSION="InputObjectTypeExtension",i.TYPE_COORDINATE="TypeCoordinate",i.MEMBER_COORDINATE="MemberCoordinate",i.ARGUMENT_COORDINATE="ArgumentCoordinate",i.DIRECTIVE_COORDINATE="DirectiveCoordinate",i.DIRECTIVE_ARGUMENT_COORDINATE="DirectiveArgumentCoordinate";let T="Accept",N="Content-Type",I="application/json",b="application/graphql-response+json",A=e=>e.replace(/([\s,]|#[^\n\r]+)+/g," ").trim(),O=e=>{try{if(Array.isArray(e))return{_tag:"Batch",executionResults:e.map(R)};if(x(e))return{_tag:"Single",executionResult:R(e)};throw Error(`Invalid execution result: result is not object or array. 
Got:
${String(e)}`)}catch(e){return e}},R=e=>{let t,i,r;if("object"!=typeof e||null===e)throw Error("Invalid execution result: result is not object");if("errors"in e){if(!x(e.errors)&&!Array.isArray(e.errors))throw Error("Invalid execution result: errors is not plain object OR array");t=e.errors}if("data"in e){if(!x(e.data)&&null!==e.data)throw Error("Invalid execution result: data is not plain object");i=e.data}if("extensions"in e){if(!x(e.extensions))throw Error("Invalid execution result: extensions is not plain object");r=e.extensions}return{data:i,errors:t,extensions:r}},S=e=>Array.isArray(e.errors)?e.errors.length>0:!!e.errors,C=e=>"object"==typeof e&&null!==e&&"kind"in e&&e.kind===a.OPERATION_DEFINITION,D=/\r\n|[\n\r]/g;function _(e,t){let i=0,r=1;for(let s of e.body.matchAll(D)){if("number"==typeof s.index||function(e,t){if(!e)throw Error("Unexpected invariant triggered.")}(!1),s.index>=t)break;i=s.index+s[0].length,r+=1}return{line:r,column:t+1-i}}function k(e,t){let i=e.locationOffset.column-1,r="".padStart(i)+e.body,s=t.line-1,n=e.locationOffset.line-1,a=t.line+n,o=1===t.line?i:0,l=t.column+o,c=`${e.name}:${a}:${l}
`,u=r.split(/\r\n|[\n\r]/g),d=u[s];if(d.length>120){let e=Math.floor(l/80),t=[];for(let e=0;e<d.length;e+=80)t.push(d.slice(e,e+80));return c+L([[`${a} |`,t[0]],...t.slice(1,e+1).map(e=>["|",e]),["|","^".padStart(l%80)],["|",t[e+1]]])}return c+L([[`${a-1} |`,u[s-1]],[`${a} |`,d],["|","^".padStart(l)],[`${a+1} |`,u[s+1]]])}function L(e){let t=e.filter(([e,t])=>void 0!==t),i=Math.max(...t.map(([e])=>e.length));return t.map(([e,t])=>e.padStart(i)+(t?" "+t:"")).join("\n")}class w extends Error{constructor(e,...t){var i,r,s;const{nodes:n,source:a,positions:o,path:l,originalError:c,extensions:u}=function(e){let t=e[0];return null==t||"kind"in t||"length"in t?{nodes:t,source:e[1],positions:e[2],path:e[3],originalError:e[4],extensions:e[5]}:t}(t);super(e),this.name="GraphQLError",this.path=null!=l?l:void 0,this.originalError=null!=c?c:void 0,this.nodes=j(Array.isArray(n)?n:n?[n]:void 0);const d=j(null==(i=this.nodes)?void 0:i.map(e=>e.loc).filter(e=>null!=e));this.source=null!=a?a:null==d||null==(r=d[0])?void 0:r.source,this.positions=null!=o?o:null==d?void 0:d.map(e=>e.start),this.locations=o&&a?o.map(e=>_(a,e)):null==d?void 0:d.map(e=>_(e.source,e.start));const h=!function(e){return"object"==typeof e&&null!==e}(null==c?void 0:c.extensions)||null==c?void 0:c.extensions;this.extensions=null!=(s=null!=u?u:h)?s:Object.create(null),Object.defineProperties(this,{message:{writable:!0,enumerable:!0},name:{enumerable:!1},nodes:{enumerable:!1},source:{enumerable:!1},positions:{enumerable:!1},originalError:{enumerable:!1}}),null!=c&&c.stack?Object.defineProperty(this,"stack",{value:c.stack,writable:!0,configurable:!0}):Error.captureStackTrace?Error.captureStackTrace(this,w):Object.defineProperty(this,"stack",{value:Error().stack,writable:!0,configurable:!0})}get[Symbol.toStringTag](){return"GraphQLError"}toString(){let e=this.message;if(this.nodes)for(let i of this.nodes){var t;i.loc&&(e+="\n\n"+k((t=i.loc).source,_(t.source,t.start)))}else if(this.source&&this.locations)for(let t of this.locations)e+="\n\n"+k(this.source,t);return e}toJSON(){let e={message:this.message};return null!=this.locations&&(e.locations=this.locations),null!=this.path&&(e.path=this.path),null!=this.extensions&&Object.keys(this.extensions).length>0&&(e.extensions=this.extensions),e}}function j(e){return void 0===e||0===e.length?void 0:e}function F(e,t,i){return new w(`Syntax Error: ${i}`,{source:e,positions:[t]})}class P{constructor(e,t,i){this.start=e.start,this.end=t.end,this.startToken=e,this.endToken=t,this.source=i}get[Symbol.toStringTag](){return"Location"}toJSON(){return{start:this.start,end:this.end}}}class U{constructor(e,t,i,r,s,n){this.kind=e,this.start=t,this.end=i,this.line=r,this.column=s,this.value=n,this.prev=null,this.next=null}get[Symbol.toStringTag](){return"Token"}toJSON(){return{kind:this.kind,value:this.value,line:this.line,column:this.column}}}let V={Name:[],Document:["definitions"],OperationDefinition:["description","name","variableDefinitions","directives","selectionSet"],VariableDefinition:["description","variable","type","defaultValue","directives"],Variable:["name"],SelectionSet:["selections"],Field:["alias","name","arguments","directives","selectionSet"],Argument:["name","value"],FragmentSpread:["name","directives"],InlineFragment:["typeCondition","directives","selectionSet"],FragmentDefinition:["description","name","variableDefinitions","typeCondition","directives","selectionSet"],IntValue:[],FloatValue:[],StringValue:[],BooleanValue:[],NullValue:[],EnumValue:[],ListValue:["values"],ObjectValue:["fields"],ObjectField:["name","value"],Directive:["name","arguments"],NamedType:["name"],ListType:["type"],NonNullType:["type"],SchemaDefinition:["description","directives","operationTypes"],OperationTypeDefinition:["type"],ScalarTypeDefinition:["description","name","directives"],ObjectTypeDefinition:["description","name","interfaces","directives","fields"],FieldDefinition:["description","name","arguments","type","directives"],InputValueDefinition:["description","name","type","defaultValue","directives"],InterfaceTypeDefinition:["description","name","interfaces","directives","fields"],UnionTypeDefinition:["description","name","directives","types"],EnumTypeDefinition:["description","name","directives","values"],EnumValueDefinition:["description","name","directives"],InputObjectTypeDefinition:["description","name","directives","fields"],DirectiveDefinition:["description","name","arguments","locations"],SchemaExtension:["directives","operationTypes"],ScalarTypeExtension:["name","directives"],ObjectTypeExtension:["name","interfaces","directives","fields"],InterfaceTypeExtension:["name","interfaces","directives","fields"],UnionTypeExtension:["name","directives","types"],EnumTypeExtension:["name","directives","values"],InputObjectTypeExtension:["name","directives","fields"],TypeCoordinate:["name"],MemberCoordinate:["name","memberName"],ArgumentCoordinate:["name","fieldName","argumentName"],DirectiveCoordinate:["name"],DirectiveArgumentCoordinate:["name","argumentName"]},B=new Set(Object.keys(V));function q(e){let t=null==e?void 0:e.kind;return"string"==typeof t&&B.has(t)}function M(e){return 9===e||32===e}function $(e){return e>=48&&e<=57}function Q(e){return e>=97&&e<=122||e>=65&&e<=90}function G(e){return Q(e)||95===e}(r=o||(o={})).QUERY="query",r.MUTATION="mutation",r.SUBSCRIPTION="subscription",(s=l||(l={})).QUERY="QUERY",s.MUTATION="MUTATION",s.SUBSCRIPTION="SUBSCRIPTION",s.FIELD="FIELD",s.FRAGMENT_DEFINITION="FRAGMENT_DEFINITION",s.FRAGMENT_SPREAD="FRAGMENT_SPREAD",s.INLINE_FRAGMENT="INLINE_FRAGMENT",s.VARIABLE_DEFINITION="VARIABLE_DEFINITION",s.SCHEMA="SCHEMA",s.SCALAR="SCALAR",s.OBJECT="OBJECT",s.FIELD_DEFINITION="FIELD_DEFINITION",s.ARGUMENT_DEFINITION="ARGUMENT_DEFINITION",s.INTERFACE="INTERFACE",s.UNION="UNION",s.ENUM="ENUM",s.ENUM_VALUE="ENUM_VALUE",s.INPUT_OBJECT="INPUT_OBJECT",s.INPUT_FIELD_DEFINITION="INPUT_FIELD_DEFINITION",(n=c||(c={})).SOF="<SOF>",n.EOF="<EOF>",n.BANG="!",n.DOLLAR="$",n.AMP="&",n.PAREN_L="(",n.PAREN_R=")",n.DOT=".",n.SPREAD="...",n.COLON=":",n.EQUALS="=",n.AT="@",n.BRACKET_L="[",n.BRACKET_R="]",n.BRACE_L="{",n.PIPE="|",n.BRACE_R="}",n.NAME="Name",n.INT="Int",n.FLOAT="Float",n.STRING="String",n.BLOCK_STRING="BlockString",n.COMMENT="Comment";class K{constructor(e){const t=new U(c.SOF,0,0,0,0);this.source=e,this.lastToken=t,this.token=t,this.line=1,this.lineStart=0}get[Symbol.toStringTag](){return"Lexer"}advance(){return this.lastToken=this.token,this.token=this.lookahead()}lookahead(){let e=this.token;if(e.kind!==c.EOF)do if(e.next)e=e.next;else{let t=function(e,t){let i=e.source.body,r=i.length,s=t;for(;s<r;){let t=i.charCodeAt(s);switch(t){case 65279:case 9:case 32:case 44:++s;continue;case 10:++s,++e.line,e.lineStart=s;continue;case 13:10===i.charCodeAt(s+1)?s+=2:++s,++e.line,e.lineStart=s;continue;case 35:return function(e,t){let i=e.source.body,r=i.length,s=t+1;for(;s<r;){let e=i.charCodeAt(s);if(10===e||13===e)break;if(Y(e))++s;else if(H(i,s))s+=2;else break}return W(e,c.COMMENT,t,s,i.slice(t+1,s))}(e,s);case 33:return W(e,c.BANG,s,s+1);case 36:return W(e,c.DOLLAR,s,s+1);case 38:return W(e,c.AMP,s,s+1);case 40:return W(e,c.PAREN_L,s,s+1);case 41:return W(e,c.PAREN_R,s,s+1);case 46:if(46===i.charCodeAt(s+1)&&46===i.charCodeAt(s+2))return W(e,c.SPREAD,s,s+3);break;case 58:return W(e,c.COLON,s,s+1);case 61:return W(e,c.EQUALS,s,s+1);case 64:return W(e,c.AT,s,s+1);case 91:return W(e,c.BRACKET_L,s,s+1);case 93:return W(e,c.BRACKET_R,s,s+1);case 123:return W(e,c.BRACE_L,s,s+1);case 124:return W(e,c.PIPE,s,s+1);case 125:return W(e,c.BRACE_R,s,s+1);case 34:if(34===i.charCodeAt(s+1)&&34===i.charCodeAt(s+2))return function(e,t){let i=e.source.body,r=i.length,s=e.lineStart,n=t+3,a=n,o="",l=[];for(;n<r;){let r=i.charCodeAt(n);if(34===r&&34===i.charCodeAt(n+1)&&34===i.charCodeAt(n+2)){o+=i.slice(a,n),l.push(o);let r=W(e,c.BLOCK_STRING,t,n+3,(function(e){var t,i;let r=Number.MAX_SAFE_INTEGER,s=null,n=-1;for(let t=0;t<e.length;++t){let a=e[t],o=function(e){let t=0;for(;t<e.length&&M(e.charCodeAt(t));)++t;return t}(a);o!==a.length&&(s=null!=(i=s)?i:t,n=t,0!==t&&o<r&&(r=o))}return e.map((e,t)=>0===t?e:e.slice(r)).slice(null!=(t=s)?t:0,n+1)})(l).join("\n"));return e.line+=l.length-1,e.lineStart=s,r}if(92===r&&34===i.charCodeAt(n+1)&&34===i.charCodeAt(n+2)&&34===i.charCodeAt(n+3)){o+=i.slice(a,n),a=n+1,n+=4;continue}if(10===r||13===r){o+=i.slice(a,n),l.push(o),13===r&&10===i.charCodeAt(n+1)?n+=2:++n,o="",a=n,s=n;continue}if(Y(r))++n;else if(H(i,n))n+=2;else throw F(e.source,n,`Invalid character within String: ${X(e,n)}.`)}throw F(e.source,n,"Unterminated string.")}(e,s);return function(e,t){let i=e.source.body,r=i.length,s=t+1,n=s,a="";for(;s<r;){let r=i.charCodeAt(s);if(34===r)return a+=i.slice(n,s),W(e,c.STRING,t,s+1,a);if(92===r){a+=i.slice(n,s);let t=117===i.charCodeAt(s+1)?123===i.charCodeAt(s+2)?function(e,t){let i=e.source.body,r=0,s=3;for(;s<12;){let e=i.charCodeAt(t+s++);if(125===e){if(s<5||!Y(r))break;return{value:String.fromCodePoint(r),size:s}}if((r=r<<4|et(e))<0)break}throw F(e.source,t,`Invalid Unicode escape sequence: "${i.slice(t,t+s)}".`)}(e,s):function(e,t){let i=e.source.body,r=ee(i,t+2);if(Y(r))return{value:String.fromCodePoint(r),size:6};if(J(r)&&92===i.charCodeAt(t+6)&&117===i.charCodeAt(t+7)){let e=ee(i,t+8);if(z(e))return{value:String.fromCodePoint(r,e),size:12}}throw F(e.source,t,`Invalid Unicode escape sequence: "${i.slice(t,t+6)}".`)}(e,s):function(e,t){let i=e.source.body;switch(i.charCodeAt(t+1)){case 34:return{value:'"',size:2};case 92:return{value:"\\",size:2};case 47:return{value:"/",size:2};case 98:return{value:"\b",size:2};case 102:return{value:"\f",size:2};case 110:return{value:"\n",size:2};case 114:return{value:"\r",size:2};case 116:return{value:"	",size:2}}throw F(e.source,t,`Invalid character escape sequence: "${i.slice(t,t+2)}".`)}(e,s);a+=t.value,s+=t.size,n=s;continue}if(10===r||13===r)break;if(Y(r))++s;else if(H(i,s))s+=2;else throw F(e.source,s,`Invalid character within String: ${X(e,s)}.`)}throw F(e.source,s,"Unterminated string.")}(e,s)}if($(t)||45===t)return function(e,t,i){let r=e.source.body,s=t,n=i,a=!1;if(45===n&&(n=r.charCodeAt(++s)),48===n){if($(n=r.charCodeAt(++s)))throw F(e.source,s,`Invalid number, unexpected digit after 0: ${X(e,s)}.`)}else s=Z(e,s,n),n=r.charCodeAt(s);if(46===n&&(a=!0,n=r.charCodeAt(++s),s=Z(e,s,n),n=r.charCodeAt(s)),(69===n||101===n)&&(a=!0,(43===(n=r.charCodeAt(++s))||45===n)&&(n=r.charCodeAt(++s)),s=Z(e,s,n),n=r.charCodeAt(s)),46===n||G(n))throw F(e.source,s,`Invalid number, expected digit but got: ${X(e,s)}.`);return W(e,a?c.FLOAT:c.INT,t,s,r.slice(t,s))}(e,s,t);if(G(t))return function(e,t){let i=e.source.body,r=i.length,s=t+1;for(;s<r;){var n;if(Q(n=i.charCodeAt(s))||$(n)||95===n)++s;else break}return W(e,c.NAME,t,s,i.slice(t,s))}(e,s);throw F(e.source,s,39===t?"Unexpected single quote character ('), did you mean to use a double quote (\")?":Y(t)||H(i,s)?`Unexpected character: ${X(e,s)}.`:`Invalid character: ${X(e,s)}.`)}return W(e,c.EOF,r,r)}(this,e.end);e.next=t,t.prev=e,e=t}while(e.kind===c.COMMENT)return e}}function Y(e){return e>=0&&e<=55295||e>=57344&&e<=1114111}function H(e,t){return J(e.charCodeAt(t))&&z(e.charCodeAt(t+1))}function J(e){return e>=55296&&e<=56319}function z(e){return e>=56320&&e<=57343}function X(e,t){let i=e.source.body.codePointAt(t);if(void 0===i)return c.EOF;if(i>=32&&i<=126){let e=String.fromCodePoint(i);return'"'===e?"'\"'":`"${e}"`}return"U+"+i.toString(16).toUpperCase().padStart(4,"0")}function W(e,t,i,r,s){let n=e.line,a=1+i-e.lineStart;return new U(t,i,r,n,a,s)}function Z(e,t,i){if(!$(i))throw F(e.source,t,`Invalid number, expected digit but got: ${X(e,t)}.`);let r=e.source.body,s=t+1;for(;$(r.charCodeAt(s));)++s;return s}function ee(e,t){return et(e.charCodeAt(t))<<12|et(e.charCodeAt(t+1))<<8|et(e.charCodeAt(t+2))<<4|et(e.charCodeAt(t+3))}function et(e){return e>=48&&e<=57?e-48:e>=65&&e<=70?e-55:e>=97&&e<=102?e-87:-1}function ei(e,t){if(!e)throw Error(t)}function er(e,t){switch(typeof e){case"string":return JSON.stringify(e);case"function":return e.name?`[function ${e.name}]`:"[function]";case"object":return function(e,t){let i;if(null===e)return"null";if(t.includes(e))return"[Circular]";let r=[...t,e];if("function"==typeof e.toJSON){let t=e.toJSON();if(t!==e)return"string"==typeof t?t:er(t,r)}else if(Array.isArray(e)){var s,n,a=e,o=r;if(0===a.length)return"[]";if(o.length>2)return"[Array]";let t=Math.min(10,a.length),i=a.length-t,l=[];for(let e=0;e<t;++e)l.push(er(a[e],o));return 1===i?l.push("... 1 more item"):i>1&&l.push(`... ${i} more items`),"["+l.join(", ")+"]"}return s=e,n=r,0===(i=Object.entries(s)).length?"{}":n.length>2?"["+function(e){let t=Object.prototype.toString.call(e).replace(/^\[object /,"").replace(/]$/,"");if("Object"===t&&"function"==typeof e.constructor){let t=e.constructor.name;if("string"==typeof t&&""!==t)return t}return t}(s)+"]":"{ "+i.map(([e,t])=>e+": "+er(t,n)).join(", ")+" }"}(e,t);default:return String(e)}}let es=globalThis.process&&1?function(e,t){return e instanceof t}:function(e,t){if(e instanceof t)return!0;if("object"==typeof e&&null!==e){var i;let r=t.prototype[Symbol.toStringTag];if(r===(Symbol.toStringTag in e?e[Symbol.toStringTag]:null==(i=e.constructor)?void 0:i.name)){let t=er(e,[]);throw Error(`Cannot use ${r} "${t}" from another module or realm.

Ensure that there is only one instance of "graphql" in the node_modules
directory. If different versions of "graphql" are the dependencies of other
relied on modules, use "resolutions" to ensure only one version is installed.

https://yarnpkg.com/en/docs/selective-version-resolutions

Duplicate "graphql" modules cannot be used at the same time since different
versions may have different capabilities and behavior. The data from one
version used in the function from another could produce confusing and
spurious results.`)}}return!1};class en{constructor(e,t="GraphQL request",i={line:1,column:1}){"string"==typeof e||ei(!1,`Body must be a string. Received: ${er(e,[])}.`),this.body=e,this.name=t,this.locationOffset=i,this.locationOffset.line>0||ei(!1,"line in locationOffset is 1-indexed and must be positive."),this.locationOffset.column>0||ei(!1,"column in locationOffset is 1-indexed and must be positive.")}get[Symbol.toStringTag](){return"Source"}}class ea{constructor(e,t={}){const{lexer:i,...r}=t;if(i)this._lexer=i;else{const t=es(e,en)?e:new en(e);this._lexer=new K(t)}this._options=r,this._tokenCounter=0}get tokenCount(){return this._tokenCounter}parseName(){let e=this.expectToken(c.NAME);return this.node(e,{kind:a.NAME,value:e.value})}parseDocument(){return this.node(this._lexer.token,{kind:a.DOCUMENT,definitions:this.many(c.SOF,this.parseDefinition,c.EOF)})}parseDefinition(){if(this.peek(c.BRACE_L))return this.parseOperationDefinition();let e=this.peekDescription(),t=e?this._lexer.lookahead():this._lexer.token;if(e&&t.kind===c.BRACE_L)throw F(this._lexer.source,this._lexer.token.start,"Unexpected description, descriptions are not supported on shorthand queries.");if(t.kind===c.NAME){switch(t.value){case"schema":return this.parseSchemaDefinition();case"scalar":return this.parseScalarTypeDefinition();case"type":return this.parseObjectTypeDefinition();case"interface":return this.parseInterfaceTypeDefinition();case"union":return this.parseUnionTypeDefinition();case"enum":return this.parseEnumTypeDefinition();case"input":return this.parseInputObjectTypeDefinition();case"directive":return this.parseDirectiveDefinition()}switch(t.value){case"query":case"mutation":case"subscription":return this.parseOperationDefinition();case"fragment":return this.parseFragmentDefinition()}if(e)throw F(this._lexer.source,this._lexer.token.start,"Unexpected description, only GraphQL definitions support descriptions.");if("extend"===t.value)return this.parseTypeSystemExtension()}throw this.unexpected(t)}parseOperationDefinition(){let e,t=this._lexer.token;if(this.peek(c.BRACE_L))return this.node(t,{kind:a.OPERATION_DEFINITION,operation:o.QUERY,description:void 0,name:void 0,variableDefinitions:[],directives:[],selectionSet:this.parseSelectionSet()});let i=this.parseDescription(),r=this.parseOperationType();return this.peek(c.NAME)&&(e=this.parseName()),this.node(t,{kind:a.OPERATION_DEFINITION,operation:r,description:i,name:e,variableDefinitions:this.parseVariableDefinitions(),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseOperationType(){let e=this.expectToken(c.NAME);switch(e.value){case"query":return o.QUERY;case"mutation":return o.MUTATION;case"subscription":return o.SUBSCRIPTION}throw this.unexpected(e)}parseVariableDefinitions(){return this.optionalMany(c.PAREN_L,this.parseVariableDefinition,c.PAREN_R)}parseVariableDefinition(){return this.node(this._lexer.token,{kind:a.VARIABLE_DEFINITION,description:this.parseDescription(),variable:this.parseVariable(),type:(this.expectToken(c.COLON),this.parseTypeReference()),defaultValue:this.expectOptionalToken(c.EQUALS)?this.parseConstValueLiteral():void 0,directives:this.parseConstDirectives()})}parseVariable(){let e=this._lexer.token;return this.expectToken(c.DOLLAR),this.node(e,{kind:a.VARIABLE,name:this.parseName()})}parseSelectionSet(){return this.node(this._lexer.token,{kind:a.SELECTION_SET,selections:this.many(c.BRACE_L,this.parseSelection,c.BRACE_R)})}parseSelection(){return this.peek(c.SPREAD)?this.parseFragment():this.parseField()}parseField(){let e,t,i=this._lexer.token,r=this.parseName();return this.expectOptionalToken(c.COLON)?(e=r,t=this.parseName()):t=r,this.node(i,{kind:a.FIELD,alias:e,name:t,arguments:this.parseArguments(!1),directives:this.parseDirectives(!1),selectionSet:this.peek(c.BRACE_L)?this.parseSelectionSet():void 0})}parseArguments(e){let t=e?this.parseConstArgument:this.parseArgument;return this.optionalMany(c.PAREN_L,t,c.PAREN_R)}parseArgument(e=!1){let t=this._lexer.token,i=this.parseName();return this.expectToken(c.COLON),this.node(t,{kind:a.ARGUMENT,name:i,value:this.parseValueLiteral(e)})}parseConstArgument(){return this.parseArgument(!0)}parseFragment(){let e=this._lexer.token;this.expectToken(c.SPREAD);let t=this.expectOptionalKeyword("on");return!t&&this.peek(c.NAME)?this.node(e,{kind:a.FRAGMENT_SPREAD,name:this.parseFragmentName(),directives:this.parseDirectives(!1)}):this.node(e,{kind:a.INLINE_FRAGMENT,typeCondition:t?this.parseNamedType():void 0,directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseFragmentDefinition(){let e=this._lexer.token,t=this.parseDescription();return(this.expectKeyword("fragment"),!0===this._options.allowLegacyFragmentVariables)?this.node(e,{kind:a.FRAGMENT_DEFINITION,description:t,name:this.parseFragmentName(),variableDefinitions:this.parseVariableDefinitions(),typeCondition:(this.expectKeyword("on"),this.parseNamedType()),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()}):this.node(e,{kind:a.FRAGMENT_DEFINITION,description:t,name:this.parseFragmentName(),typeCondition:(this.expectKeyword("on"),this.parseNamedType()),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseFragmentName(){if("on"===this._lexer.token.value)throw this.unexpected();return this.parseName()}parseValueLiteral(e){let t=this._lexer.token;switch(t.kind){case c.BRACKET_L:return this.parseList(e);case c.BRACE_L:return this.parseObject(e);case c.INT:return this.advanceLexer(),this.node(t,{kind:a.INT,value:t.value});case c.FLOAT:return this.advanceLexer(),this.node(t,{kind:a.FLOAT,value:t.value});case c.STRING:case c.BLOCK_STRING:return this.parseStringLiteral();case c.NAME:switch(this.advanceLexer(),t.value){case"true":return this.node(t,{kind:a.BOOLEAN,value:!0});case"false":return this.node(t,{kind:a.BOOLEAN,value:!1});case"null":return this.node(t,{kind:a.NULL});default:return this.node(t,{kind:a.ENUM,value:t.value})}case c.DOLLAR:if(e){if(this.expectToken(c.DOLLAR),this._lexer.token.kind===c.NAME){let e=this._lexer.token.value;throw F(this._lexer.source,t.start,`Unexpected variable "$${e}" in constant value.`)}throw this.unexpected(t)}return this.parseVariable();default:throw this.unexpected()}}parseConstValueLiteral(){return this.parseValueLiteral(!0)}parseStringLiteral(){let e=this._lexer.token;return this.advanceLexer(),this.node(e,{kind:a.STRING,value:e.value,block:e.kind===c.BLOCK_STRING})}parseList(e){let t=()=>this.parseValueLiteral(e);return this.node(this._lexer.token,{kind:a.LIST,values:this.any(c.BRACKET_L,t,c.BRACKET_R)})}parseObject(e){let t=()=>this.parseObjectField(e);return this.node(this._lexer.token,{kind:a.OBJECT,fields:this.any(c.BRACE_L,t,c.BRACE_R)})}parseObjectField(e){let t=this._lexer.token,i=this.parseName();return this.expectToken(c.COLON),this.node(t,{kind:a.OBJECT_FIELD,name:i,value:this.parseValueLiteral(e)})}parseDirectives(e){let t=[];for(;this.peek(c.AT);)t.push(this.parseDirective(e));return t}parseConstDirectives(){return this.parseDirectives(!0)}parseDirective(e){let t=this._lexer.token;return this.expectToken(c.AT),this.node(t,{kind:a.DIRECTIVE,name:this.parseName(),arguments:this.parseArguments(e)})}parseTypeReference(){let e,t=this._lexer.token;if(this.expectOptionalToken(c.BRACKET_L)){let i=this.parseTypeReference();this.expectToken(c.BRACKET_R),e=this.node(t,{kind:a.LIST_TYPE,type:i})}else e=this.parseNamedType();return this.expectOptionalToken(c.BANG)?this.node(t,{kind:a.NON_NULL_TYPE,type:e}):e}parseNamedType(){return this.node(this._lexer.token,{kind:a.NAMED_TYPE,name:this.parseName()})}peekDescription(){return this.peek(c.STRING)||this.peek(c.BLOCK_STRING)}parseDescription(){if(this.peekDescription())return this.parseStringLiteral()}parseSchemaDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("schema");let i=this.parseConstDirectives(),r=this.many(c.BRACE_L,this.parseOperationTypeDefinition,c.BRACE_R);return this.node(e,{kind:a.SCHEMA_DEFINITION,description:t,directives:i,operationTypes:r})}parseOperationTypeDefinition(){let e=this._lexer.token,t=this.parseOperationType();this.expectToken(c.COLON);let i=this.parseNamedType();return this.node(e,{kind:a.OPERATION_TYPE_DEFINITION,operation:t,type:i})}parseScalarTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("scalar");let i=this.parseName(),r=this.parseConstDirectives();return this.node(e,{kind:a.SCALAR_TYPE_DEFINITION,description:t,name:i,directives:r})}parseObjectTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("type");let i=this.parseName(),r=this.parseImplementsInterfaces(),s=this.parseConstDirectives(),n=this.parseFieldsDefinition();return this.node(e,{kind:a.OBJECT_TYPE_DEFINITION,description:t,name:i,interfaces:r,directives:s,fields:n})}parseImplementsInterfaces(){return this.expectOptionalKeyword("implements")?this.delimitedMany(c.AMP,this.parseNamedType):[]}parseFieldsDefinition(){return this.optionalMany(c.BRACE_L,this.parseFieldDefinition,c.BRACE_R)}parseFieldDefinition(){let e=this._lexer.token,t=this.parseDescription(),i=this.parseName(),r=this.parseArgumentDefs();this.expectToken(c.COLON);let s=this.parseTypeReference(),n=this.parseConstDirectives();return this.node(e,{kind:a.FIELD_DEFINITION,description:t,name:i,arguments:r,type:s,directives:n})}parseArgumentDefs(){return this.optionalMany(c.PAREN_L,this.parseInputValueDef,c.PAREN_R)}parseInputValueDef(){let e,t=this._lexer.token,i=this.parseDescription(),r=this.parseName();this.expectToken(c.COLON);let s=this.parseTypeReference();this.expectOptionalToken(c.EQUALS)&&(e=this.parseConstValueLiteral());let n=this.parseConstDirectives();return this.node(t,{kind:a.INPUT_VALUE_DEFINITION,description:i,name:r,type:s,defaultValue:e,directives:n})}parseInterfaceTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("interface");let i=this.parseName(),r=this.parseImplementsInterfaces(),s=this.parseConstDirectives(),n=this.parseFieldsDefinition();return this.node(e,{kind:a.INTERFACE_TYPE_DEFINITION,description:t,name:i,interfaces:r,directives:s,fields:n})}parseUnionTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("union");let i=this.parseName(),r=this.parseConstDirectives(),s=this.parseUnionMemberTypes();return this.node(e,{kind:a.UNION_TYPE_DEFINITION,description:t,name:i,directives:r,types:s})}parseUnionMemberTypes(){return this.expectOptionalToken(c.EQUALS)?this.delimitedMany(c.PIPE,this.parseNamedType):[]}parseEnumTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("enum");let i=this.parseName(),r=this.parseConstDirectives(),s=this.parseEnumValuesDefinition();return this.node(e,{kind:a.ENUM_TYPE_DEFINITION,description:t,name:i,directives:r,values:s})}parseEnumValuesDefinition(){return this.optionalMany(c.BRACE_L,this.parseEnumValueDefinition,c.BRACE_R)}parseEnumValueDefinition(){let e=this._lexer.token,t=this.parseDescription(),i=this.parseEnumValueName(),r=this.parseConstDirectives();return this.node(e,{kind:a.ENUM_VALUE_DEFINITION,description:t,name:i,directives:r})}parseEnumValueName(){if("true"===this._lexer.token.value||"false"===this._lexer.token.value||"null"===this._lexer.token.value)throw F(this._lexer.source,this._lexer.token.start,`${eo(this._lexer.token)} is reserved and cannot be used for an enum value.`);return this.parseName()}parseInputObjectTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("input");let i=this.parseName(),r=this.parseConstDirectives(),s=this.parseInputFieldsDefinition();return this.node(e,{kind:a.INPUT_OBJECT_TYPE_DEFINITION,description:t,name:i,directives:r,fields:s})}parseInputFieldsDefinition(){return this.optionalMany(c.BRACE_L,this.parseInputValueDef,c.BRACE_R)}parseTypeSystemExtension(){let e=this._lexer.lookahead();if(e.kind===c.NAME)switch(e.value){case"schema":return this.parseSchemaExtension();case"scalar":return this.parseScalarTypeExtension();case"type":return this.parseObjectTypeExtension();case"interface":return this.parseInterfaceTypeExtension();case"union":return this.parseUnionTypeExtension();case"enum":return this.parseEnumTypeExtension();case"input":return this.parseInputObjectTypeExtension()}throw this.unexpected(e)}parseSchemaExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("schema");let t=this.parseConstDirectives(),i=this.optionalMany(c.BRACE_L,this.parseOperationTypeDefinition,c.BRACE_R);if(0===t.length&&0===i.length)throw this.unexpected();return this.node(e,{kind:a.SCHEMA_EXTENSION,directives:t,operationTypes:i})}parseScalarTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("scalar");let t=this.parseName(),i=this.parseConstDirectives();if(0===i.length)throw this.unexpected();return this.node(e,{kind:a.SCALAR_TYPE_EXTENSION,name:t,directives:i})}parseObjectTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("type");let t=this.parseName(),i=this.parseImplementsInterfaces(),r=this.parseConstDirectives(),s=this.parseFieldsDefinition();if(0===i.length&&0===r.length&&0===s.length)throw this.unexpected();return this.node(e,{kind:a.OBJECT_TYPE_EXTENSION,name:t,interfaces:i,directives:r,fields:s})}parseInterfaceTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("interface");let t=this.parseName(),i=this.parseImplementsInterfaces(),r=this.parseConstDirectives(),s=this.parseFieldsDefinition();if(0===i.length&&0===r.length&&0===s.length)throw this.unexpected();return this.node(e,{kind:a.INTERFACE_TYPE_EXTENSION,name:t,interfaces:i,directives:r,fields:s})}parseUnionTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("union");let t=this.parseName(),i=this.parseConstDirectives(),r=this.parseUnionMemberTypes();if(0===i.length&&0===r.length)throw this.unexpected();return this.node(e,{kind:a.UNION_TYPE_EXTENSION,name:t,directives:i,types:r})}parseEnumTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("enum");let t=this.parseName(),i=this.parseConstDirectives(),r=this.parseEnumValuesDefinition();if(0===i.length&&0===r.length)throw this.unexpected();return this.node(e,{kind:a.ENUM_TYPE_EXTENSION,name:t,directives:i,values:r})}parseInputObjectTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("input");let t=this.parseName(),i=this.parseConstDirectives(),r=this.parseInputFieldsDefinition();if(0===i.length&&0===r.length)throw this.unexpected();return this.node(e,{kind:a.INPUT_OBJECT_TYPE_EXTENSION,name:t,directives:i,fields:r})}parseDirectiveDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("directive"),this.expectToken(c.AT);let i=this.parseName(),r=this.parseArgumentDefs(),s=this.expectOptionalKeyword("repeatable");this.expectKeyword("on");let n=this.parseDirectiveLocations();return this.node(e,{kind:a.DIRECTIVE_DEFINITION,description:t,name:i,arguments:r,repeatable:s,locations:n})}parseDirectiveLocations(){return this.delimitedMany(c.PIPE,this.parseDirectiveLocation)}parseDirectiveLocation(){let e=this._lexer.token,t=this.parseName();if(Object.prototype.hasOwnProperty.call(l,t.value))return t;throw this.unexpected(e)}parseSchemaCoordinate(){let e,t,i=this._lexer.token,r=this.expectOptionalToken(c.AT),s=this.parseName();return(!r&&this.expectOptionalToken(c.DOT)&&(e=this.parseName()),(r||e)&&this.expectOptionalToken(c.PAREN_L)&&(t=this.parseName(),this.expectToken(c.COLON),this.expectToken(c.PAREN_R)),r)?t?this.node(i,{kind:a.DIRECTIVE_ARGUMENT_COORDINATE,name:s,argumentName:t}):this.node(i,{kind:a.DIRECTIVE_COORDINATE,name:s}):e?t?this.node(i,{kind:a.ARGUMENT_COORDINATE,name:s,fieldName:e,argumentName:t}):this.node(i,{kind:a.MEMBER_COORDINATE,name:s,memberName:e}):this.node(i,{kind:a.TYPE_COORDINATE,name:s})}node(e,t){return!0!==this._options.noLocation&&(t.loc=new P(e,this._lexer.lastToken,this._lexer.source)),t}peek(e){return this._lexer.token.kind===e}expectToken(e){let t=this._lexer.token;if(t.kind===e)return this.advanceLexer(),t;throw F(this._lexer.source,t.start,`Expected ${el(e)}, found ${eo(t)}.`)}expectOptionalToken(e){return this._lexer.token.kind===e&&(this.advanceLexer(),!0)}expectKeyword(e){let t=this._lexer.token;if(t.kind===c.NAME&&t.value===e)this.advanceLexer();else throw F(this._lexer.source,t.start,`Expected "${e}", found ${eo(t)}.`)}expectOptionalKeyword(e){let t=this._lexer.token;return t.kind===c.NAME&&t.value===e&&(this.advanceLexer(),!0)}unexpected(e){let t=null!=e?e:this._lexer.token;return F(this._lexer.source,t.start,`Unexpected ${eo(t)}.`)}any(e,t,i){this.expectToken(e);let r=[];for(;!this.expectOptionalToken(i);)r.push(t.call(this));return r}optionalMany(e,t,i){if(this.expectOptionalToken(e)){let e=[];do e.push(t.call(this));while(!this.expectOptionalToken(i))return e}return[]}many(e,t,i){this.expectToken(e);let r=[];do r.push(t.call(this));while(!this.expectOptionalToken(i))return r}delimitedMany(e,t){this.expectOptionalToken(e);let i=[];do i.push(t.call(this));while(this.expectOptionalToken(e))return i}advanceLexer(){let{maxTokens:e}=this._options,t=this._lexer.advance();if(t.kind!==c.EOF&&(++this._tokenCounter,void 0!==e&&this._tokenCounter>e))throw F(this._lexer.source,t.start,`Document contains more that ${e} tokens. Parsing aborted.`)}}function eo(e){let t=e.value;return el(e.kind)+(null!=t?` "${t}"`:"")}function el(e){return e===c.BANG||e===c.DOLLAR||e===c.AMP||e===c.PAREN_L||e===c.PAREN_R||e===c.DOT||e===c.SPREAD||e===c.COLON||e===c.EQUALS||e===c.AT||e===c.BRACKET_L||e===c.BRACKET_R||e===c.BRACE_L||e===c.PIPE||e===c.BRACE_R?`"${e}"`:e}let ec=/[\x00-\x1f\x22\x5c\x7f-\x9f]/g;function eu(e){return ed[e.charCodeAt(0)]}let ed=["\\u0000","\\u0001","\\u0002","\\u0003","\\u0004","\\u0005","\\u0006","\\u0007","\\b","\\t","\\n","\\u000B","\\f","\\r","\\u000E","\\u000F","\\u0010","\\u0011","\\u0012","\\u0013","\\u0014","\\u0015","\\u0016","\\u0017","\\u0018","\\u0019","\\u001A","\\u001B","\\u001C","\\u001D","\\u001E","\\u001F","","",'\\"',"","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","\\\\","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","\\u007F","\\u0080","\\u0081","\\u0082","\\u0083","\\u0084","\\u0085","\\u0086","\\u0087","\\u0088","\\u0089","\\u008A","\\u008B","\\u008C","\\u008D","\\u008E","\\u008F","\\u0090","\\u0091","\\u0092","\\u0093","\\u0094","\\u0095","\\u0096","\\u0097","\\u0098","\\u0099","\\u009A","\\u009B","\\u009C","\\u009D","\\u009E","\\u009F"],eh=Object.freeze({}),ep={Name:{leave:e=>e.value},Variable:{leave:e=>"$"+e.name},Document:{leave:e=>em(e.definitions,"\n\n")},OperationDefinition:{leave(e){let t=eE(e.variableDefinitions)?ey("(\n",em(e.variableDefinitions,"\n"),"\n)"):ey("(",em(e.variableDefinitions,", "),")"),i=ey("",e.description,"\n")+em([e.operation,em([e.name,t]),em(e.directives," ")]," ");return("query"===i?"":i+" ")+e.selectionSet}},VariableDefinition:{leave:({variable:e,type:t,defaultValue:i,directives:r,description:s})=>ey("",s,"\n")+e+": "+t+ey(" = ",i)+ey(" ",em(r," "))},SelectionSet:{leave:({selections:e})=>ef(e)},Field:{leave({alias:e,name:t,arguments:i,directives:r,selectionSet:s}){let n=ey("",e,": ")+t,a=n+ey("(",em(i,", "),")");return a.length>80&&(a=n+ey("(\n",ev(em(i,"\n")),"\n)")),em([a,em(r," "),s]," ")}},Argument:{leave:({name:e,value:t})=>e+": "+t},FragmentSpread:{leave:({name:e,directives:t})=>"..."+e+ey(" ",em(t," "))},InlineFragment:{leave:({typeCondition:e,directives:t,selectionSet:i})=>em(["...",ey("on ",e),em(t," "),i]," ")},FragmentDefinition:{leave:({name:e,typeCondition:t,variableDefinitions:i,directives:r,selectionSet:s,description:n})=>ey("",n,"\n")+`fragment ${e}${ey("(",em(i,", "),")")} `+`on ${t} ${ey("",em(r," ")," ")}`+s},IntValue:{leave:({value:e})=>e},FloatValue:{leave:({value:e})=>e},StringValue:{leave:({value:e,block:t})=>{let i,r,s,n,a,o,l,c,u,d,h;return t?(s=1===(r=(i=e.replace(/"""/g,'\\"""')).split(/\r\n|[\n\r]/g)).length,n=r.length>1&&r.slice(1).every(e=>0===e.length||M(e.charCodeAt(0))),a=i.endsWith('\\"""'),o=e.endsWith('"')&&!a,l=e.endsWith("\\"),c=o||l,u=!s||e.length>70||c||n||a,d="",h=s&&M(e.charCodeAt(0)),(u&&!h||n)&&(d+="\n"),d+=i,(u||c)&&(d+="\n"),'"""'+d+'"""'):`"${e.replace(ec,eu)}"`}},BooleanValue:{leave:({value:e})=>e?"true":"false"},NullValue:{leave:()=>"null"},EnumValue:{leave:({value:e})=>e},ListValue:{leave:({values:e})=>"["+em(e,", ")+"]"},ObjectValue:{leave:({fields:e})=>"{"+em(e,", ")+"}"},ObjectField:{leave:({name:e,value:t})=>e+": "+t},Directive:{leave:({name:e,arguments:t})=>"@"+e+ey("(",em(t,", "),")")},NamedType:{leave:({name:e})=>e},ListType:{leave:({type:e})=>"["+e+"]"},NonNullType:{leave:({type:e})=>e+"!"},SchemaDefinition:{leave:({description:e,directives:t,operationTypes:i})=>ey("",e,"\n")+em(["schema",em(t," "),ef(i)]," ")},OperationTypeDefinition:{leave:({operation:e,type:t})=>e+": "+t},ScalarTypeDefinition:{leave:({description:e,name:t,directives:i})=>ey("",e,"\n")+em(["scalar",t,em(i," ")]," ")},ObjectTypeDefinition:{leave:({description:e,name:t,interfaces:i,directives:r,fields:s})=>ey("",e,"\n")+em(["type",t,ey("implements ",em(i," & ")),em(r," "),ef(s)]," ")},FieldDefinition:{leave:({description:e,name:t,arguments:i,type:r,directives:s})=>ey("",e,"\n")+t+(eE(i)?ey("(\n",ev(em(i,"\n")),"\n)"):ey("(",em(i,", "),")"))+": "+r+ey(" ",em(s," "))},InputValueDefinition:{leave:({description:e,name:t,type:i,defaultValue:r,directives:s})=>ey("",e,"\n")+em([t+": "+i,ey("= ",r),em(s," ")]," ")},InterfaceTypeDefinition:{leave:({description:e,name:t,interfaces:i,directives:r,fields:s})=>ey("",e,"\n")+em(["interface",t,ey("implements ",em(i," & ")),em(r," "),ef(s)]," ")},UnionTypeDefinition:{leave:({description:e,name:t,directives:i,types:r})=>ey("",e,"\n")+em(["union",t,em(i," "),ey("= ",em(r," | "))]," ")},EnumTypeDefinition:{leave:({description:e,name:t,directives:i,values:r})=>ey("",e,"\n")+em(["enum",t,em(i," "),ef(r)]," ")},EnumValueDefinition:{leave:({description:e,name:t,directives:i})=>ey("",e,"\n")+em([t,em(i," ")]," ")},InputObjectTypeDefinition:{leave:({description:e,name:t,directives:i,fields:r})=>ey("",e,"\n")+em(["input",t,em(i," "),ef(r)]," ")},DirectiveDefinition:{leave:({description:e,name:t,arguments:i,repeatable:r,locations:s})=>ey("",e,"\n")+"directive @"+t+(eE(i)?ey("(\n",ev(em(i,"\n")),"\n)"):ey("(",em(i,", "),")"))+(r?" repeatable":"")+" on "+em(s," | ")},SchemaExtension:{leave:({directives:e,operationTypes:t})=>em(["extend schema",em(e," "),ef(t)]," ")},ScalarTypeExtension:{leave:({name:e,directives:t})=>em(["extend scalar",e,em(t," ")]," ")},ObjectTypeExtension:{leave:({name:e,interfaces:t,directives:i,fields:r})=>em(["extend type",e,ey("implements ",em(t," & ")),em(i," "),ef(r)]," ")},InterfaceTypeExtension:{leave:({name:e,interfaces:t,directives:i,fields:r})=>em(["extend interface",e,ey("implements ",em(t," & ")),em(i," "),ef(r)]," ")},UnionTypeExtension:{leave:({name:e,directives:t,types:i})=>em(["extend union",e,em(t," "),ey("= ",em(i," | "))]," ")},EnumTypeExtension:{leave:({name:e,directives:t,values:i})=>em(["extend enum",e,em(t," "),ef(i)]," ")},InputObjectTypeExtension:{leave:({name:e,directives:t,fields:i})=>em(["extend input",e,em(t," "),ef(i)]," ")},TypeCoordinate:{leave:({name:e})=>e},MemberCoordinate:{leave:({name:e,memberName:t})=>em([e,ey(".",t)])},ArgumentCoordinate:{leave:({name:e,fieldName:t,argumentName:i})=>em([e,ey(".",t),ey("(",i,":)")])},DirectiveCoordinate:{leave:({name:e})=>em(["@",e])},DirectiveArgumentCoordinate:{leave:({name:e,argumentName:t})=>em(["@",e,ey("(",t,":)")])}};function em(e,t=""){var i;return null!=(i=null==e?void 0:e.filter(e=>e).join(t))?i:""}function ef(e){return ey("{\n",ev(em(e,"\n")),"\n}")}function ey(e,t,i=""){return null!=t&&""!==t?e+t+i:""}function ev(e){return ey("  ",e.replace(/\n/g,"\n  "))}function eE(e){var t;return null!=(t=null==e?void 0:e.some(e=>e.includes("\n")))&&t}let eg=(e,t)=>{let i,r,s,n,o,l="string"==typeof e||"kind"in e?e:String(e),c="string"==typeof l?l:function(e,t,i=V){let r,s,n,o=new Map;for(let e of Object.values(a))o.set(e,function(e,t){let i=e[t];return"object"==typeof i?i:"function"==typeof i?{enter:i,leave:void 0}:{enter:e.enter,leave:e.leave}}(t,e));let l=Array.isArray(e),c=[e],u=-1,d=[],h=e,p=[],m=[];do{var f,y,v;let e,a=++u===c.length,E=a&&0!==d.length;if(a){if(s=0===m.length?void 0:p[p.length-1],h=n,n=m.pop(),E)if(l){h=h.slice();let e=0;for(let[t,i]of d){let r=t-e;null===i?(h.splice(r,1),e++):h[r]=i}}else for(let[e,t]of(h={...h},d))h[e]=t;u=r.index,c=r.keys,d=r.edits,l=r.inArray,r=r.prev}else if(n){if(null==(h=n[s=l?u:c[u]]))continue;p.push(s)}if(!Array.isArray(h)){q(h)||ei(!1,`Invalid AST Node: ${er(h,[])}.`);let i=a?null==(f=o.get(h.kind))?void 0:f.leave:null==(y=o.get(h.kind))?void 0:y.enter;if((e=null==i?void 0:i.call(t,h,s,n,p,m))===eh)break;if(!1===e){if(!a){p.pop();continue}}else if(void 0!==e&&(d.push([s,e]),!a))if(q(e))h=e;else{p.pop();continue}}void 0===e&&E&&d.push([s,h]),a?p.pop():(r={inArray:l,index:u,keys:c,edits:d,prev:r},c=(l=Array.isArray(h))?h:null!=(v=i[h.kind])?v:[],u=-1,d=[],n&&m.push(n),n=h)}while(void 0!==r)return 0!==d.length?d[d.length-1][1]:e}(l,ep),u=!1;if(t)return{expression:c,isMutation:u,operationName:i};let d=(e=>{try{let t,i=e();if(t=i,"object"==typeof t&&null!==t&&"then"in t&&"function"==typeof t.then&&"catch"in t&&"function"==typeof t.catch&&"finally"in t&&"function"==typeof t.finally)return i.catch(e=>E(e));return i}catch(e){return E(e)}})(()=>{let e,t;return"string"==typeof l?(Object.defineProperty(t=(e=new ea(l,void 0)).parseDocument(),"tokenCount",{enumerable:!1,value:e.tokenCount}),t):l});return d instanceof Error?{expression:c,isMutation:u,operationName:i}:(1===(s=d.definitions.filter(C)).length&&(r=s[0].name?.value),i=r,n=!1,1===(o=d.definitions.filter(C)).length&&(n="mutation"===o[0].operation),{expression:c,operationName:i,isMutation:u=n})},ex=JSON,eT=async e=>{let t={...e,method:"Single"===e.request._tag?e.request.document.isMutation?"POST":(e.method??"post").toUpperCase():e.request.hasMutations?"POST":(e.method??"post").toUpperCase(),fetchOptions:{...e.fetchOptions,errorPolicy:e.fetchOptions.errorPolicy??"none"}},i=eb(t.method),r=await i(t),s=await eI(r,e.fetchOptions.jsonSerializer??ex);if(s instanceof Error)throw s;let n={status:r.status,headers:r.headers};if(!r.ok||("Batch"===s._tag?s.executionResults.some(S):S(s.executionResult))&&"none"===t.fetchOptions.errorPolicy)return new p("Batch"===s._tag?{...s.executionResults,...n}:{...s.executionResult,...n},{query:"Single"===e.request._tag?e.request.document.expression:e.request.query,variables:e.request.variables});switch(s._tag){case"Single":return{...n,...eN(t)(s.executionResult)};case"Batch":return{...n,data:s.executionResults.map(eN(t))};default:g(s)}},eN=e=>t=>({extensions:t.extensions,data:t.data,errors:"all"===e.fetchOptions.errorPolicy?t.errors:void 0}),eI=async(e,t)=>{let i,r=e.headers.get(N),s=await e.text();if(r&&((i=r.toLowerCase()).includes(b)||i.includes(I)))return O(t.parse(s));try{let e=t.parse(s);return O(e)}catch{let e=s.length>500?`${s.slice(0,500)}...`:s;return Error(`Response has unsupported content-type: ${r||"none"}. Expected 'application/json' or 'application/graphql-response+json'. Response body preview: ${e}`)}},eb=e=>async t=>{let i,r=new Headers(t.headers),s=null;r.has(T)||r.set(T,[b,I].join(", ")),"POST"===e?"string"!=typeof(i=(t.fetchOptions.jsonSerializer??ex).stringify(eA(t)))||r.has(N)||r.set(N,I):s=eO(t);let n={method:e,headers:r,body:i,...t.fetchOptions},a=new URL(t.url),o=n;if(t.middleware){let{url:e,...i}=await Promise.resolve(t.middleware({...n,url:t.url,operationName:"Single"===t.request._tag?t.request.document.operationName:void 0,variables:t.request.variables}));a=new URL(e),o=i}s&&s.forEach((e,t)=>{a.searchParams.append(t,e)});let l=t.fetch??fetch;return await l(a,o)},eA=e=>{switch(e.request._tag){case"Single":return{query:e.request.document.expression,variables:e.request.variables,operationName:e.request.document.operationName};case"Batch":return f(e.request.query,e.request.variables??[]).map(([e,t])=>({query:e,variables:t}));default:throw g(e.request)}},eO=e=>{let t=e.fetchOptions.jsonSerializer??ex,i=new URLSearchParams;switch(e.request._tag){case"Single":return i.append("query",A(e.request.document.expression)),e.request.variables&&i.append("variables",t.stringify(e.request.variables)),e.request.document.operationName&&i.append("operationName",e.request.document.operationName),i;case"Batch":{let r=e.request.variables?.map(e=>t.stringify(e))??[],s=f(e.request.query.map(A),r).map(([e,t])=>({query:e,variables:t}));return i.append("query",t.stringify(s)),i}default:throw g(e.request)}};class eR{url;requestConfig;constructor(e,t={}){this.url=e,this.requestConfig=t}rawRequest=async(...e)=>{let[t,i,r]=e,s=t.query?t:{query:t,variables:i,requestHeaders:r,signal:void 0},{headers:n,fetch:a=globalThis.fetch,method:o="POST",requestMiddleware:l,responseMiddleware:c,excludeOperationName:u,...d}=this.requestConfig,{url:h}=this;void 0!==s.signal&&(d.signal=s.signal);let p=eg(s.query,u),f=await eT({url:h,request:{_tag:"Single",document:p,variables:s.variables},headers:{...y(m(n)),...y(s.requestHeaders)},fetch:a,method:o,fetchOptions:d,middleware:l});if(c&&await c(f,{operationName:p.operationName,variables:i,url:this.url}),f instanceof Error)throw f;return f};async request(e,...t){let[i,r]=t,s=eC(e,i,r),{headers:n,fetch:a=globalThis.fetch,method:o="POST",requestMiddleware:l,responseMiddleware:c,excludeOperationName:u,...d}=this.requestConfig,{url:h}=this;void 0!==s.signal&&(d.signal=s.signal);let p=eg(s.document,u),f=await eT({url:h,request:{_tag:"Single",document:p,variables:s.variables},headers:{...y(m(n)),...y(s.requestHeaders)},fetch:a,method:o,fetchOptions:d,middleware:l});if(c&&await c(f,{operationName:p.operationName,variables:s.variables,url:this.url}),f instanceof Error)throw f;return f.data}async batchRequests(e,t){let i=e.documents?e:{documents:e,requestHeaders:t,signal:void 0},{headers:r,excludeOperationName:s,...n}=this.requestConfig;void 0!==i.signal&&(n.signal=i.signal);let a=i.documents.map(({document:e})=>eg(e,s)),o=a.map(({expression:e})=>e),l=a.some(({isMutation:e})=>e),c=i.documents.map(({variables:e})=>e),u=await eT({url:this.url,request:{_tag:"Batch",operationName:void 0,query:o,hasMutations:l,variables:c},headers:{...y(m(r)),...y(i.requestHeaders)},fetch:this.requestConfig.fetch??globalThis.fetch,method:this.requestConfig.method||"POST",fetchOptions:n,middleware:this.requestConfig.requestMiddleware});if(this.requestConfig.responseMiddleware&&await this.requestConfig.responseMiddleware(u,{operationName:void 0,variables:c,url:this.url}),u instanceof Error)throw u;return u.data}setHeaders(e){return this.requestConfig.headers=e,this}setHeader(e,t){let{headers:i}=this.requestConfig;return i?i[e]=t:this.requestConfig.headers={[e]:t},this}setEndpoint(e){return this.url=e,this}}async function eS(e,t,...i){let r=eD(e,t,...i);return new eR(r.url).request({...r})}let eC=(e,t,i)=>e.document?e:{document:e,variables:t,requestHeaders:i,signal:void 0},eD=(e,t,...i)=>{let[r,s]=i;return"string"==typeof e?{url:e,document:t,variables:r,requestHeaders:s,signal:void 0}:e},e_=(e,...t)=>e.reduce((e,i,r)=>`${e}${i}${r in t?String(t[r]):""}`,""),ek={production:h.default.env.SUBGRAPH_URL||"https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1",development:h.default.env.SUBGRAPH_URL||"http://localhost:8000/subgraphs/name/atlas-protocol",storyTestnet:h.default.env.SUBGRAPH_URL||"https://api.goldsky.com/api/public/atlas-protocol/testnet/subgraphs/atlas-v1"};function eL(){return ek.production}new eR(eL(),{headers:{"Content-Type":"application/json"}}),e_`
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
`,e_`
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
`,e_`
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
`;let ew=e_`
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
`;e_`
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
`,e_`
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
`,e_`
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
`,e_`
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
`,e_`
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
`,e_`
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
`,e_`
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
`;let ej=e_`
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
`,eF=e_`
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
`;e_`
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
`;var eP=e.i(75555),eU=e.i(40143),eV=e.i(86491),eB=e.i(15823),eq=e.i(93803),eM=e.i(19273),e$=e.i(80166),eQ=class extends eB.Subscribable{constructor(e,t){super(),this.options=t,this.#e=e,this.#t=null,this.#i=(0,eq.pendingThenable)(),this.bindMethods(),this.setOptions(t)}#e;#r=void 0;#s=void 0;#n=void 0;#a;#o;#i;#t;#l;#c;#u;#d;#h;#p;#m=new Set;bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){1===this.listeners.size&&(this.#r.addObserver(this),eG(this.#r,this.options)?this.#f():this.updateResult(),this.#y())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return eK(this.#r,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return eK(this.#r,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#v(),this.#E(),this.#r.removeObserver(this)}setOptions(e){let t=this.options,i=this.#r;if(this.options=this.#e.defaultQueryOptions(e),void 0!==this.options.enabled&&"boolean"!=typeof this.options.enabled&&"function"!=typeof this.options.enabled&&"boolean"!=typeof(0,eM.resolveEnabled)(this.options.enabled,this.#r))throw Error("Expected enabled to be a boolean or a callback that returns a boolean");this.#g(),this.#r.setOptions(this.options),t._defaulted&&!(0,eM.shallowEqualObjects)(this.options,t)&&this.#e.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#r,observer:this});let r=this.hasListeners();r&&eY(this.#r,i,this.options,t)&&this.#f(),this.updateResult(),r&&(this.#r!==i||(0,eM.resolveEnabled)(this.options.enabled,this.#r)!==(0,eM.resolveEnabled)(t.enabled,this.#r)||(0,eM.resolveStaleTime)(this.options.staleTime,this.#r)!==(0,eM.resolveStaleTime)(t.staleTime,this.#r))&&this.#x();let s=this.#T();r&&(this.#r!==i||(0,eM.resolveEnabled)(this.options.enabled,this.#r)!==(0,eM.resolveEnabled)(t.enabled,this.#r)||s!==this.#p)&&this.#N(s)}getOptimisticResult(e){var t,i;let r=this.#e.getQueryCache().build(this.#e,e),s=this.createResult(r,e);return t=this,i=s,(0,eM.shallowEqualObjects)(t.getCurrentResult(),i)||(this.#n=s,this.#o=this.options,this.#a=this.#r.state),s}getCurrentResult(){return this.#n}trackResult(e,t){return new Proxy(e,{get:(e,i)=>(this.trackProp(i),t?.(i),"promise"===i&&(this.trackProp("data"),this.options.experimental_prefetchInRender||"pending"!==this.#i.status||this.#i.reject(Error("experimental_prefetchInRender feature flag is not enabled"))),Reflect.get(e,i))})}trackProp(e){this.#m.add(e)}getCurrentQuery(){return this.#r}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){let t=this.#e.defaultQueryOptions(e),i=this.#e.getQueryCache().build(this.#e,t);return i.fetch().then(()=>this.createResult(i,t))}fetch(e){return this.#f({...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#n))}#f(e){this.#g();let t=this.#r.fetch(this.options,e);return e?.throwOnError||(t=t.catch(eM.noop)),t}#x(){this.#v();let e=(0,eM.resolveStaleTime)(this.options.staleTime,this.#r);if(eM.isServer||this.#n.isStale||!(0,eM.isValidTimeout)(e))return;let t=(0,eM.timeUntilStale)(this.#n.dataUpdatedAt,e);this.#d=e$.timeoutManager.setTimeout(()=>{this.#n.isStale||this.updateResult()},t+1)}#T(){return("function"==typeof this.options.refetchInterval?this.options.refetchInterval(this.#r):this.options.refetchInterval)??!1}#N(e){this.#E(),this.#p=e,!eM.isServer&&!1!==(0,eM.resolveEnabled)(this.options.enabled,this.#r)&&(0,eM.isValidTimeout)(this.#p)&&0!==this.#p&&(this.#h=e$.timeoutManager.setInterval(()=>{(this.options.refetchIntervalInBackground||eP.focusManager.isFocused())&&this.#f()},this.#p))}#y(){this.#x(),this.#N(this.#T())}#v(){this.#d&&(e$.timeoutManager.clearTimeout(this.#d),this.#d=void 0)}#E(){this.#h&&(e$.timeoutManager.clearInterval(this.#h),this.#h=void 0)}createResult(e,t){let i,r=this.#r,s=this.options,n=this.#n,a=this.#a,o=this.#o,l=e!==r?e.state:this.#s,{state:c}=e,u={...c},d=!1;if(t._optimisticResults){let i=this.hasListeners(),n=!i&&eG(e,t),a=i&&eY(e,r,t,s);(n||a)&&(u={...u,...(0,eV.fetchState)(c.data,e.options)}),"isRestoring"===t._optimisticResults&&(u.fetchStatus="idle")}let{error:h,errorUpdatedAt:p,status:m}=u;i=u.data;let f=!1;if(void 0!==t.placeholderData&&void 0===i&&"pending"===m){let e;n?.isPlaceholderData&&t.placeholderData===o?.placeholderData?(e=n.data,f=!0):e="function"==typeof t.placeholderData?t.placeholderData(this.#u?.state.data,this.#u):t.placeholderData,void 0!==e&&(m="success",i=(0,eM.replaceData)(n?.data,e,t),d=!0)}if(t.select&&void 0!==i&&!f)if(n&&i===a?.data&&t.select===this.#l)i=this.#c;else try{this.#l=t.select,i=t.select(i),i=(0,eM.replaceData)(n?.data,i,t),this.#c=i,this.#t=null}catch(e){this.#t=e}this.#t&&(h=this.#t,i=this.#c,p=Date.now(),m="error");let y="fetching"===u.fetchStatus,v="pending"===m,E="error"===m,g=v&&y,x=void 0!==i,T={status:m,fetchStatus:u.fetchStatus,isPending:v,isSuccess:"success"===m,isError:E,isInitialLoading:g,isLoading:g,data:i,dataUpdatedAt:u.dataUpdatedAt,error:h,errorUpdatedAt:p,failureCount:u.fetchFailureCount,failureReason:u.fetchFailureReason,errorUpdateCount:u.errorUpdateCount,isFetched:u.dataUpdateCount>0||u.errorUpdateCount>0,isFetchedAfterMount:u.dataUpdateCount>l.dataUpdateCount||u.errorUpdateCount>l.errorUpdateCount,isFetching:y,isRefetching:y&&!v,isLoadingError:E&&!x,isPaused:"paused"===u.fetchStatus,isPlaceholderData:d,isRefetchError:E&&x,isStale:eH(e,t),refetch:this.refetch,promise:this.#i,isEnabled:!1!==(0,eM.resolveEnabled)(t.enabled,e)};if(this.options.experimental_prefetchInRender){let t=e=>{"error"===T.status?e.reject(T.error):void 0!==T.data&&e.resolve(T.data)},i=()=>{t(this.#i=T.promise=(0,eq.pendingThenable)())},s=this.#i;switch(s.status){case"pending":e.queryHash===r.queryHash&&t(s);break;case"fulfilled":("error"===T.status||T.data!==s.value)&&i();break;case"rejected":("error"!==T.status||T.error!==s.reason)&&i()}}return T}updateResult(){let e=this.#n,t=this.createResult(this.#r,this.options);if(this.#a=this.#r.state,this.#o=this.options,void 0!==this.#a.data&&(this.#u=this.#r),(0,eM.shallowEqualObjects)(t,e))return;this.#n=t;let i=()=>{if(!e)return!0;let{notifyOnChangeProps:t}=this.options,i="function"==typeof t?t():t;if("all"===i||!i&&!this.#m.size)return!0;let r=new Set(i??this.#m);return this.options.throwOnError&&r.add("error"),Object.keys(this.#n).some(t=>this.#n[t]!==e[t]&&r.has(t))};this.#I({listeners:i()})}#g(){let e=this.#e.getQueryCache().build(this.#e,this.options);if(e===this.#r)return;let t=this.#r;this.#r=e,this.#s=e.state,this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#y()}#I(e){eU.notifyManager.batch(()=>{e.listeners&&this.listeners.forEach(e=>{e(this.#n)}),this.#e.getQueryCache().notify({query:this.#r,type:"observerResultsUpdated"})})}};function eG(e,t){return!1!==(0,eM.resolveEnabled)(t.enabled,e)&&void 0===e.state.data&&("error"!==e.state.status||!1!==t.retryOnMount)||void 0!==e.state.data&&eK(e,t,t.refetchOnMount)}function eK(e,t,i){if(!1!==(0,eM.resolveEnabled)(t.enabled,e)&&"static"!==(0,eM.resolveStaleTime)(t.staleTime,e)){let r="function"==typeof i?i(e):i;return"always"===r||!1!==r&&eH(e,t)}return!1}function eY(e,t,i,r){return(e!==t||!1===(0,eM.resolveEnabled)(r.enabled,e))&&(!i.suspense||"error"!==e.state.status)&&eH(e,i)}function eH(e,t){return!1!==(0,eM.resolveEnabled)(t.enabled,e)&&e.isStaleByTime((0,eM.resolveStaleTime)(t.staleTime,e))}var eJ=e.i(12598),ez=d.createContext((t=!1,{clearReset:()=>{t=!1},reset:()=>{t=!0},isReset:()=>t})),eX=d.createContext(!1);eX.Provider;var eW=(e,t,i)=>t.fetchOptimistic(e).catch(()=>{i.clearReset()});function eZ(e,t){return function(e,t,i){let r=d.useContext(eX),s=d.useContext(ez),n=(0,eJ.useQueryClient)(i),a=n.defaultQueryOptions(e);if(n.getDefaultOptions().queries?._experimental_beforeQuery?.(a),a._optimisticResults=r?"isRestoring":"optimistic",a.suspense){let e=e=>"static"===e?e:Math.max(e??1e3,1e3),t=a.staleTime;a.staleTime="function"==typeof t?(...i)=>e(t(...i)):e(t),"number"==typeof a.gcTime&&(a.gcTime=Math.max(a.gcTime,1e3))}(a.suspense||a.throwOnError||a.experimental_prefetchInRender)&&!s.isReset()&&(a.retryOnMount=!1),d.useEffect(()=>{s.clearReset()},[s]);let o=!n.getQueryCache().get(a.queryHash),[l]=d.useState(()=>new t(n,a)),c=l.getOptimisticResult(a),u=!r&&!1!==e.subscribed;if(d.useSyncExternalStore(d.useCallback(e=>{let t=u?l.subscribe(eU.notifyManager.batchCalls(e)):eM.noop;return l.updateResult(),t},[l,u]),()=>l.getCurrentResult(),()=>l.getCurrentResult()),d.useEffect(()=>{l.setOptions(a)},[a,l]),a?.suspense&&c.isPending)throw eW(a,l,s);if((({result:e,errorResetBoundary:t,throwOnError:i,query:r,suspense:s})=>e.isError&&!t.isReset()&&!e.isFetching&&r&&(s&&void 0===e.data||(0,eM.shouldThrowError)(i,[e.error,r])))({result:c,errorResetBoundary:s,throwOnError:a.throwOnError,query:n.getQueryCache().get(a.queryHash),suspense:a.suspense}))throw c.error;if(n.getDefaultOptions().queries?._experimental_afterQuery?.(a,c),a.experimental_prefetchInRender&&!eM.isServer&&c.isLoading&&c.isFetching&&!r){let e=o?eW(a,l,s):n.getQueryCache().get(a.queryHash)?.promise;e?.catch(eM.noop).finally(()=>{l.updateResult()})}return a.notifyOnChangeProps?c:l.trackResult(c)}(e,eQ,t)}function e0(e){return eZ({queryKey:["vault",e],queryFn:async()=>(await eS(eL(),ew,{id:e})).idoVault,enabled:!!e,staleTime:15e3,refetchInterval:3e4})}function e1(){let[e,t]=(0,d.useState)(""),[i,r]=(0,d.useState)(""),{data:s}=eZ({queryKey:["globalStats"],queryFn:async()=>(await eS(eL(),ej)).globalStats,staleTime:12e4,refetchInterval:3e5}),{data:n}=function(e=10){return eZ({queryKey:["cvsLeaderboard",e],queryFn:async()=>(await eS(eL(),eF,{first:e})).ipAssets,staleTime:12e4})}(5),{data:a,isLoading:o}=e0(e),{healthScore:l,metrics:c}=function(e){let{data:t,...i}=e0(e);if(!t)return{...i,healthScore:0,metrics:null};let r=parseFloat(t.utilizationRate||"0"),s=t.currentCVS>t.initialCVS?(t.currentCVS-t.initialCVS)/t.initialCVS*100:0,n=t.totalLiquidity>0?t.availableLiquidity/t.totalLiquidity*100:0,a=Math.min(100,(r<80?30:10)+(s>0?30:10)+(n>20?20:n)+(t.activeLoansCount<10?20:10));return{...i,vault:t,healthScore:a,metrics:{utilizationRate:r,cvsGrowth:s,liquidityRatio:n,activeLoans:t.activeLoansCount}}}(e),h=function(e,t){let{data:i,...r}=e0(e),s=!!i&&BigInt(i.maxLoanAmount)>=BigInt(t)&&BigInt(i.availableLiquidity)>=BigInt(t);return{...r,vault:i,isEligible:s,maxLoanAmount:i?.maxLoanAmount,interestRate:i?.interestRate,collateralRatio:i?.collateralRatio}}(e,i||"0");return(0,u.jsx)("div",{className:"min-h-screen p-8 bg-gray-50 dark:bg-gray-900",children:(0,u.jsxs)("div",{className:"max-w-7xl mx-auto",children:[(0,u.jsx)("h1",{className:"text-4xl font-bold mb-8",children:"Atlas Protocol Dashboard"}),(0,u.jsxs)("div",{className:"grid md:grid-cols-4 gap-6 mb-8",children:[(0,u.jsx)(e2,{title:"Total IP Assets",value:s?.totalIPAssets||"0",icon:"🎨"}),(0,u.jsx)(e2,{title:"Total Licenses",value:s?.totalLicenses||"0",icon:"📄"}),(0,u.jsx)(e2,{title:"Total Loans",value:s?.totalLoans||"0",icon:"💰"}),(0,u.jsx)(e2,{title:"Verified Users",value:s?.totalVerifiedUsers||"0",icon:"✅"})]}),(0,u.jsxs)("div",{className:"mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6",children:[(0,u.jsx)("h2",{className:"text-2xl font-semibold mb-4",children:"🏆 Top IP Assets by CVS"}),n&&n.length>0?(0,u.jsx)("div",{className:"space-y-3",children:n.map((e,t)=>(0,u.jsxs)("div",{className:"flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,u.jsxs)("div",{className:"flex items-center gap-4",children:[(0,u.jsxs)("span",{className:"text-2xl font-bold text-gray-400",children:["#",t+1]}),(0,u.jsxs)("div",{children:[(0,u.jsx)("h3",{className:"font-semibold",children:e.name}),(0,u.jsxs)("p",{className:"text-sm text-gray-500",children:["Creator: ",e.creator.slice(0,6),"...",e.creator.slice(-4)]})]})]}),(0,u.jsxs)("div",{className:"text-right",children:[(0,u.jsxs)("p",{className:"font-bold text-blue-600",children:["CVS: ",e.cvsScore]}),(0,u.jsxs)("p",{className:"text-sm text-gray-500",children:["Revenue: ",e.totalLicenseRevenue]})]})]},e.id))}):(0,u.jsx)("p",{className:"text-gray-500",children:"No data available"})]}),(0,u.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8",children:[(0,u.jsx)("h2",{className:"text-2xl font-semibold mb-4",children:"🏦 Vault Lookup"}),(0,u.jsx)("input",{type:"text",placeholder:"Enter vault address (0x...)",value:e,onChange:e=>t(e.target.value),className:"w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-4"}),o&&(0,u.jsx)("p",{children:"Loading vault data..."}),a&&(0,u.jsxs)("div",{className:"space-y-6",children:[(0,u.jsxs)("div",{className:"grid md:grid-cols-3 gap-4",children:[(0,u.jsxs)("div",{className:"p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg",children:[(0,u.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Current CVS"}),(0,u.jsx)("p",{className:"text-2xl font-bold text-blue-600",children:a.currentCVS})]}),(0,u.jsxs)("div",{className:"p-4 bg-green-50 dark:bg-green-900/20 rounded-lg",children:[(0,u.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Max Loan Amount"}),(0,u.jsx)("p",{className:"text-2xl font-bold text-green-600",children:a.maxLoanAmount})]}),(0,u.jsxs)("div",{className:"p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg",children:[(0,u.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Interest Rate"}),(0,u.jsxs)("p",{className:"text-2xl font-bold text-purple-600",children:[a.interestRate,"%"]})]})]}),l>0&&(0,u.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,u.jsx)("h3",{className:"font-semibold mb-2",children:"Vault Health Score"}),(0,u.jsxs)("div",{className:"flex items-center gap-4",children:[(0,u.jsx)("div",{className:"flex-1",children:(0,u.jsx)("div",{className:"h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden",children:(0,u.jsx)("div",{className:`h-full ${l>=80?"bg-green-500":l>=50?"bg-yellow-500":"bg-red-500"}`,style:{width:`${l}%`}})})}),(0,u.jsxs)("span",{className:"font-bold",children:[l.toFixed(0),"/100"]})]}),c&&(0,u.jsxs)("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-sm",children:[(0,u.jsxs)("div",{children:[(0,u.jsx)("span",{className:"text-gray-500",children:"Utilization:"}),(0,u.jsxs)("span",{className:"ml-2 font-semibold",children:[c.utilizationRate.toFixed(1),"%"]})]}),(0,u.jsxs)("div",{children:[(0,u.jsx)("span",{className:"text-gray-500",children:"CVS Growth:"}),(0,u.jsxs)("span",{className:"ml-2 font-semibold",children:[c.cvsGrowth.toFixed(1),"%"]})]}),(0,u.jsxs)("div",{children:[(0,u.jsx)("span",{className:"text-gray-500",children:"Liquidity:"}),(0,u.jsxs)("span",{className:"ml-2 font-semibold",children:[c.liquidityRatio.toFixed(1),"%"]})]}),(0,u.jsxs)("div",{children:[(0,u.jsx)("span",{className:"text-gray-500",children:"Active Loans:"}),(0,u.jsx)("span",{className:"ml-2 font-semibold",children:c.activeLoans})]})]})]}),(0,u.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,u.jsx)("h3",{className:"font-semibold mb-3",children:"Check Loan Eligibility"}),(0,u.jsx)("input",{type:"number",placeholder:"Loan amount",value:i,onChange:e=>r(e.target.value),className:"w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mb-3"}),void 0!==h.isEligible&&i&&(0,u.jsx)("div",{className:`p-3 rounded ${h.isEligible?"bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400":"bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`,children:h.isEligible?(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)("p",{className:"font-semibold",children:"✅ Eligible for loan"}),(0,u.jsxs)("p",{className:"text-sm mt-1",children:["Interest Rate: ",h.interestRate,"%"]}),(0,u.jsxs)("p",{className:"text-sm",children:["Collateral Required: ",h.collateralRatio,"%"]})]}):(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)("p",{className:"font-semibold",children:"❌ Not eligible"}),(0,u.jsxs)("p",{className:"text-sm mt-1",children:["Max loan amount: ",h.maxLoanAmount]})]})})]}),a.ipAsset&&(0,u.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,u.jsx)("h3",{className:"font-semibold mb-2",children:"IP Asset"}),(0,u.jsx)("p",{className:"font-medium",children:a.ipAsset.name}),(0,u.jsxs)("p",{className:"text-sm text-gray-500",children:["Creator: ",a.ipAsset.creator]}),(0,u.jsxs)("div",{className:"grid grid-cols-3 gap-2 mt-3 text-sm",children:[(0,u.jsxs)("div",{children:[(0,u.jsx)("span",{className:"text-gray-500",children:"Usage Count:"}),(0,u.jsx)("span",{className:"ml-2 font-semibold",children:a.ipAsset.totalUsageCount})]}),(0,u.jsxs)("div",{children:[(0,u.jsx)("span",{className:"text-gray-500",children:"Revenue:"}),(0,u.jsx)("span",{className:"ml-2 font-semibold",children:a.ipAsset.totalLicenseRevenue})]}),(0,u.jsxs)("div",{children:[(0,u.jsx)("span",{className:"text-gray-500",children:"CVS Score:"}),(0,u.jsx)("span",{className:"ml-2 font-semibold",children:a.ipAsset.cvsScore})]})]})]}),a.loans&&a.loans.length>0&&(0,u.jsxs)("div",{className:"p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",children:[(0,u.jsxs)("h3",{className:"font-semibold mb-3",children:["Active Loans (",a.loans.length,")"]}),(0,u.jsx)("div",{className:"space-y-2",children:a.loans.slice(0,5).map(e=>(0,u.jsxs)("div",{className:"p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600",children:[(0,u.jsxs)("div",{className:"flex justify-between",children:[(0,u.jsxs)("span",{className:"text-sm text-gray-500",children:["Borrower: ",e.borrower.slice(0,6),"...",e.borrower.slice(-4)]}),(0,u.jsx)("span",{className:"font-semibold",children:e.loanAmount})]}),(0,u.jsxs)("div",{className:"text-xs text-gray-500 mt-1",children:["Interest: ",e.interestRate,"% | CVS at Issuance: ",e.cvsAtIssuance]})]},e.id))})]})]})]})]})})}function e2({title:e,value:t,icon:i}){return(0,u.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow p-6",children:[(0,u.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,u.jsx)("span",{className:"text-sm text-gray-500",children:e}),(0,u.jsx)("span",{className:"text-2xl",children:i})]}),(0,u.jsx)("p",{className:"text-3xl font-bold",children:t})]})}e.s(["default",()=>e1],93456)}]);