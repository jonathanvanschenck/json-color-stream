
const expect = require("chai").expect; // eslint-disable-line node/no-unpublished-require

const Parser = require("../lib/Parser.js");

/* eslint-disable no-unused-vars */
describe("Parser", function() {
    describe(".parse", function() {
        it("Empty object", async function() {
            const tokens = await Parser.parse("{}");
            // [
            //   { type: 'object', path: [], value: '{', string: '{' },
            //   { type: 'object_closing', path: [], value: '}', string: '}' },
            //   { type: 'EOF', path: [], value: 'EOF', string: '' }
            // ]
            expect(tokens).to.have.lengthOf(3);
            expect(tokens[0].type).to.equal("object");
            expect(tokens[0].path).to.have.lengthOf(0);
            expect(tokens[1].type).to.equal("object_closing");
            expect(tokens[1].path).to.have.lengthOf(0);
            expect(tokens[2].value).to.equal("EOF");
        });
        it("Empty array", async function() {
            const tokens = await Parser.parse("[]");
            // [
            //   { type: 'array', path: [], value: '[', string: '[' },
            //   { type: 'array_closing', path: [], value: ']', string: ']' },
            //   { type: 'EOF', path: [], value: 'EOF', string: '' }
            // ]
            expect(tokens).to.have.lengthOf(3);
            expect(tokens[0].type).to.equal("array");
            expect(tokens[0].path).to.have.lengthOf(0);
            expect(tokens[1].type).to.equal("array_closing");
            expect(tokens[1].path).to.have.lengthOf(0);
            expect(tokens[2].value).to.equal("EOF");
        });

        it("Object with primative keys", async function() {
            const tokens = await Parser.parse('{ "a": 1, "b": "2", "c": true, "d": false, "e": null, "f":[], "g":{} }');

            expect(tokens).to.have.lengthOf(12);

            expect(tokens[0].type).to.equal("object");
            expect(tokens[0].path).to.have.lengthOf(0);

            expect(tokens[1].path[0]).to.equal("a");
            expect(tokens[1].type).to.equal("number");
            expect(tokens[1].value).to.equal("1");

            expect(tokens[2].path[0]).to.equal("b");
            expect(tokens[2].type).to.equal("string");
            expect(tokens[2].value).to.equal("2");

            expect(tokens[3].path[0]).to.equal("c");
            expect(tokens[3].type).to.equal("true");

            expect(tokens[4].path[0]).to.equal("d");
            expect(tokens[4].type).to.equal("false");

            expect(tokens[5].path[0]).to.equal("e");
            expect(tokens[5].type).to.equal("null");

            expect(tokens[6].path[0]).to.equal("f");
            expect(tokens[6].type).to.equal("array");

            expect(tokens[8].path[0]).to.equal("g");
            expect(tokens[8].type).to.equal("object");
        });

        it("Array with primatives", async function() {
            const tokens = await Parser.parse('[1,"2",true,false,null,[],{}]');

            expect(tokens).to.have.lengthOf(12);

            expect(tokens[0].type).to.equal("array");
            expect(tokens[0].path).to.have.lengthOf(0);

            expect(tokens[1].path[0]).to.equal(0);
            expect(tokens[1].type).to.equal("number");
            expect(tokens[1].value).to.equal("1");

            expect(tokens[2].path[0]).to.equal(1);
            expect(tokens[2].type).to.equal("string");
            expect(tokens[2].value).to.equal("2");

            expect(tokens[3].path[0]).to.equal(2);
            expect(tokens[3].type).to.equal("true");

            expect(tokens[4].path[0]).to.equal(3);
            expect(tokens[4].type).to.equal("false");

            expect(tokens[5].path[0]).to.equal(4);
            expect(tokens[5].type).to.equal("null");

            expect(tokens[6].path[0]).to.equal(5);
            expect(tokens[6].type).to.equal("array");

            expect(tokens[8].path[0]).to.equal(6);
            expect(tokens[8].type).to.equal("object");
        });

        it("Object recursion", async function() {
            const tokens = await Parser.parse('{ "a": { "b": { "c": {} } } }');

            expect(tokens).to.have.lengthOf(9);

            expect(tokens[0].type).to.equal("object");
            expect(tokens[0].path).to.have.lengthOf(0);

            expect(tokens[1].path).to.have.lengthOf(1);
            expect(tokens[1].path[0]).to.equal("a");
            expect(tokens[1].type).to.equal("object");

            expect(tokens[2].path).to.have.lengthOf(2);
            expect(tokens[2].path[0]).to.equal("a");
            expect(tokens[2].path[1]).to.equal("b");
            expect(tokens[2].type).to.equal("object");

            expect(tokens[3].path).to.have.lengthOf(3);
            expect(tokens[3].path[0]).to.equal("a");
            expect(tokens[3].path[1]).to.equal("b");
            expect(tokens[3].path[2]).to.equal("c");
            expect(tokens[3].type).to.equal("object");

            expect(tokens[4].path).to.have.lengthOf(3);
            expect(tokens[4].path[0]).to.equal("a");
            expect(tokens[4].path[1]).to.equal("b");
            expect(tokens[4].path[2]).to.equal("c");
            expect(tokens[4].type).to.equal("object_closing");

            expect(tokens[5].path).to.have.lengthOf(2);
            expect(tokens[5].path[0]).to.equal("a");
            expect(tokens[5].path[1]).to.equal("b");
            expect(tokens[5].type).to.equal("object_closing");

            expect(tokens[6].path).to.have.lengthOf(1);
            expect(tokens[6].path[0]).to.equal("a");
            expect(tokens[6].type).to.equal("object_closing");

            expect(tokens[7].path).to.have.lengthOf(0);
            expect(tokens[7].type).to.equal("object_closing");
        });

        it("Array recursion", async function() {
            const tokens = await Parser.parse('[[[[]]]]');

            expect(tokens).to.have.lengthOf(9);

            expect(tokens[0].type).to.equal("array");
            expect(tokens[0].path).to.have.lengthOf(0);

            expect(tokens[1].path).to.have.lengthOf(1);
            expect(tokens[1].path[0]).to.equal(0);
            expect(tokens[1].type).to.equal("array");

            expect(tokens[2].path).to.have.lengthOf(2);
            expect(tokens[2].path[0]).to.equal(0);
            expect(tokens[2].path[1]).to.equal(0);
            expect(tokens[2].type).to.equal("array");

            expect(tokens[3].path).to.have.lengthOf(3);
            expect(tokens[3].path[0]).to.equal(0);
            expect(tokens[3].path[1]).to.equal(0);
            expect(tokens[3].path[2]).to.equal(0);
            expect(tokens[3].type).to.equal("array");

            expect(tokens[4].path).to.have.lengthOf(3);
            expect(tokens[4].path[0]).to.equal(0);
            expect(tokens[4].path[1]).to.equal(0);
            expect(tokens[4].path[2]).to.equal(0);
            expect(tokens[4].type).to.equal("array_closing");

            expect(tokens[5].path).to.have.lengthOf(2);
            expect(tokens[5].path[0]).to.equal(0);
            expect(tokens[5].path[1]).to.equal(0);
            expect(tokens[5].type).to.equal("array_closing");

            expect(tokens[6].path).to.have.lengthOf(1);
            expect(tokens[6].path[0]).to.equal(0);
            expect(tokens[6].type).to.equal("array_closing");

            expect(tokens[7].path).to.have.lengthOf(0);
            expect(tokens[7].type).to.equal("array_closing");
        });

        it("Can parse empty string values", async function() {
            const tokens = await Parser.parse('{ "a": "" }');
            expect(tokens[1].path[0]).to.equal("a");
            expect(tokens[1].type).to.equal("string");
            expect(tokens[1].value).to.equal("");
        });

        it("Can parse empty string key", async function() {
            const tokens = await Parser.parse('{ "": 1 }');
            expect(tokens[1].path[0]).to.equal("");
            expect(tokens[1].type).to.equal("number");
            expect(tokens[1].value).to.equal("1");
        });

        it("Can parse escaped string characters", async function() {
            const tokens = await Parser.parse('[ "\\"","\\\\","\\/","\\b","\\f","\\n","\\r","\\t" ]');
            expect(tokens[1].type).to.equal("string");
            expect(tokens[1].value).to.equal('"');

            expect(tokens[2].type).to.equal("string");
            expect(tokens[2].value).to.equal('\\');

            expect(tokens[3].type).to.equal("string");
            expect(tokens[3].value).to.equal("/");

            expect(tokens[4].type).to.equal("string");
            expect(tokens[4].value).to.equal("\b");

            expect(tokens[5].type).to.equal("string");
            expect(tokens[5].value).to.equal("\f");

            expect(tokens[6].type).to.equal("string");
            expect(tokens[6].value).to.equal("\n");

            expect(tokens[7].type).to.equal("string");
            expect(tokens[7].value).to.equal("\r");

            expect(tokens[8].type).to.equal("string");
            expect(tokens[8].value).to.equal("\t");
        });

        it("Can parse escaped unicode characters", async function() {
            const tokens = await Parser.parse('[ "\\u00f6" ]'); // o with umlat
            expect(tokens[1].type).to.equal("string");
            expect(tokens[1].value).to.equal("\u00f6");
        });

        it("Fail for bad escapes", async function() {
            const tokens = await Parser.parse('[ "\\ubadu" ]').catch(e => {
                if ( e.message.includes(`Unexpected escaped character \\ubadu`)) {
                    return null;
                }
                throw e;
            });
            expect(tokens).to.equal(null);
        });
    });
});
/* eslint-enable no-unused-vars */
