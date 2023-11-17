// Many thanks to: https://lihautan.com/json-parser-with-javascript
// for the details on implementing a JSON parser in JavaScript

const { EventEmitter } = require('events');

/**
 * TODO
 *
 * @event Parser#close
 */

/**
 * TODO
 *
 * @event Parser#drain
 */

/**
 * TODO
 *
 * @event Parser#error
 */

/**
 * TODO
 *
 * @event Parser#token
 */

/**
 * Class to parse JSON strings into tokens
 *
 * @augments EventEmitter
 */
class Parser extends EventEmitter {
    #tree;
    #data;
    #head;
    #corked;
    #start;

    /**
     * Constructor
     */
    constructor() {
        super();
        this.#tree = [];
        this.#data = "";
        this._reset_head();
        this.#corked = false;
        this.#start = true;
    }

    /**
     * Has the stream been closed?
     *
     * @type {boolean}
     */
    get closed() {
        return this.#corked;
    }

    /**
     * Reset the reading head to the beginning of the data.
     *
     * @private
     */
    _reset_head() { this.#head = 0; }

    /**
     * Truncate the data to the current head position.
     *
     * @private
     * @returns {string}
     */
    _consume_read_data() {
        const string = this.#data.slice(0,this.#head);
        this.#data = this.#data.slice(this.#head);
        this.#head = 0;
        return string;
    }


    /**
     * Examine the next character in the data stream
     *
     * @param {boolean} [sneaky=false] - If true, don't throw any errors if you hit the end of the stream
     * @fires Parser#error If the data stream is empty, and we are at the end of the stream
     * @returns {Promise<string?>} The next character in the data stream, or undefined if we are at the end of the stream
     */
    async _peak(sneaky=false) {
        const c = this.#data[this.#head];
        // If there is no data currently, try and wait for more
        if ( c == undefined ) {
            this.emit("drain");
            // We will never get more data
            if ( this.#corked ) {
                // Either return undefined if it is a sneaky peaky, or throw an error
                if ( sneaky ) {
                    return c;
                } else {
                    return this.emit("error", new Error("Unexpected EOF"));
                }
            }
            // Resursively wait for more data
            return new Promise(res => {
                this.once("data",() => {
                    res(this._peak());
                });
            });
        }
        return c;
    }

    /**
     * Read the next character in the data stream, moving the head position over
     *
     * @fires Parser#error If the data stream is empty, and we are at the end of the stream
     * @returns {Promise<string?>} The next character in the data stream, or undefined if we are at the end of the stream
     */
    async _read() {
        const c = await this._peak();
        this.#head++;
        return c;
    }

    /**
     * Read data until we hit something which isn't whitespace
     *
     * @private
     */
    async _skip_whitespace() {
        while ( await this._peak_match(/\s/, true) ) this.#head++;
    }

    /**
     * Try to match the next character
     *
     * @private
     */
    async _peak_match(regex, sneaky=false) {
        const chr = await this._peak(sneaky);
        if ( chr == undefined ) return undefined;
        return chr.match(regex);
    }

    /**
     * Start parsing a new stream
     *
     * @private
     */
    async _parse_init() {
        await this._skip_whitespace();
        switch ( await this._peak() ) {
            case "{":
                await this._parse_object(false);
                await this._eat_EOF();
                break;
            case "[":
                await this._parse_array(false);
                await this._eat_EOF();
                break;
            default:
                this.emit("error", new Error("Unexpected character "+(await this._peak())));
                return;
        }

        this.emit("end");
    }

    /**
     * Expect, consume, then emit the EOF
     *
     * @private
     */
    async _eat_EOF() {
        if ( !this.#corked ) await new Promise(res => this.once("corked",res));
        await this._skip_whitespace();
        switch ( await this._peak(true) ) {
            case undefined:
                break;
            default:
                this.emit("error", new Error("Unexpected trailing character "+(await this._read())));
                return;
        }
        this.emit("token", { type: "EOF", path: [...this.#tree], value: "EOF", string: this._consume_read_data() });
    }

    /**
     * Expect and (maybe) consume a terminator for a value
     *
     * The terminator is only consumed if it is a "," or ":"
     *
     * @private
     * @param {string} terminators - A string of characters which are valid terminators for this value
     */
    async _finish_value(terminators) {
        await this._skip_whitespace();
        if ( terminators.includes(await this._peak()) ) {
            // eat commas and colons, but leave bracket/braces for higher level object
            if ( ",:".includes(await this._peak()) ) await this._read();
        } else {
            this.emit("error", new Error("Unexpected character "+(await this._peak())));
            return;
        }
        return true;
    }

    /**
     * Parse a JSON array object
     *
     * @private
     * @param {string} [terminators=,] - The character which terminates this object
     * @returns {string?} A string if succesfully parsed, otherwise `undefined`
     */
    async _parse_array(terminators=",") {
        await this._skip_whitespace();
        if ( await this._peak() != "[" ) return;

        // eat the openning bracket
        await this._read();
        this.emit("token", { type: "array", path: [...this.#tree], value: "[", string: this._consume_read_data() });

        let key = 0;
        await this._skip_whitespace();
        while ( await this._peak() != "]" ) {

            this.#tree.push(key++);
            let value = await this._parse_value(",]");
            this.#tree.pop();

            // Make sure we actually got something
            if ( value == undefined ) {
                this.emit("error", new Error("Unexpected character "+(await this._peak())));
                return;
            }

            await this._skip_whitespace();
        }

        // eat the closing bracket
        await this._read();

        if ( terminators && !(await this._finish_value(terminators)) ) return;

        this.emit("token", { type: "array_closing", path: [...this.#tree], value: "]", string: this._consume_read_data() });

        return "array";
    }

    /**
     * Parse a JSON object
     *
     * @private
     * @param {string} [terminators=,] - The character which terminates this object
     * @returns {string?} A string if succesfully parsed, otherwise `undefined`
     */
    async _parse_object(terminators=",") {
        await this._skip_whitespace();
        if ( await this._peak() != "{" ) return;

        // eat the openning brace
        await this._read();
        this.emit("token", { type: "object", path: [...this.#tree], value: "{", string: this._consume_read_data() });

        await this._skip_whitespace();
        while ( await this._peak() != "}" ) {

            const key = await this._parse_key();

            // Make sure we actually got something
            if ( key == undefined ) {
                this.emit("error", new Error("Unexpected character "+(await this._peak())));
                return;
            }

            this.#tree.push(key);
            let value = await this._parse_value(",}");
            this.#tree.pop();

            // Make sure we actually got something
            if ( value == undefined ) {
                this.emit("error", new Error("Unexpected character "+(await this._peak())));
                return;
            }

            await this._skip_whitespace();
        }

        // eat the closing brace
        await this._read();

        if ( terminators && !(await this._finish_value(terminators)) ) return;

        this.emit("token", { type: "object_closing", path: [...this.#tree], value: "}", string: this._consume_read_data() });

        return "object";
    }

    /**
     * Parse a JSON keyword
     *
     * @private
     * @param {string} keyword - the keyword to look for
     * @param {string} [terminators=,] - The character which terminates this object
     * @returns {string?} The keyword if succesfully parsed, otherwise `undefined`
     */
    async _parse_keyword(keyword, terminators=",") {
        await this._skip_whitespace();
        if ( await this._peak() != keyword[0] ) return;

        for ( let i = 0; i < keyword.length; i++ ) {
            if ( await this._peak() != keyword[i] ) {
                this.emit("error", new Error("Unexpected character "+(await this._peak())));
                return;
            }
            await this._read();
        }

        if ( !(await this._finish_value(terminators)) ) return;

        this.emit("token", { type: keyword, path: [...this.#tree], value: keyword, string: this._consume_read_data() });

        return keyword;
    }

    /**
     * Parse a JSON number
     *
     * @private
     * @param {string} [terminators=,] - The character which terminates this object
     * @returns {string?} The number (as a string) if succesfully parsed, otherwise `undefined`
     */
    async _parse_number(terminators=",") {
        await this._skip_whitespace();
        if ( !(await this._peak_match(/[-\d.]/)) ) return;

        let number = "";
        // Pull the negative, if it exists
        if ( await this._peak() === "-" ) {
            number += await this._read();
        }

        // We either have a single zero, or at least 1 non-zero digit followed by any number of digits, or a decimal place
        if ( await this._peak() === "0" ) {
            number += await this._read();
        } else if ( await this._peak_match(/[1-9]/) ) {
            while ( await this._peak_match(/[0-9]/) ) number += await this._read();
        } else if ( (await this._peak()) === "." ) {
            // pass, we'll get this one in a sec
        } else {
            this.emit("error", new Error("Failed to read number at character "+(await this._peak())));
            return;
        }

        // Pull the decimal place and any trailing digits
        if ( await this._peak() === "." ) {
            number += await this._read();
            while ( await this._peak_match(/[0-9]/) ) number += await this._read();
        }

        // Pull the exponent
        if ( await this._peak_match(/[eE]/) ) {
            number += await this._read();
            if ( await this._peak_match(/[-+]/) ) number += await this._read();
            while ( await this._peak_match(/[0-9]/) ) number += await this._read();
        }

        // Double check that the number is actually valid ....
        const check = parseFloat(number);
        if ( isNaN(check) ) {
            this.emit("error", new Error("Failed to read number "+number));
            return;
        }

        if ( !(await this._finish_value(terminators)) ) return;

        this.emit("token", { type: "number", path: [...this.#tree], value: number, string: this._consume_read_data() });

        return number;
    }

    /**
     * Extract a JSON "string" value from the data stream
     *
     * @private
     * @param {string} terminators - The character which terminates this object. Can be ",]" or ",}" for values or ":" for keys
     * @returns {string?} The number (as a string) if succesfully parsed, otherwise `undefined`
     */
    async _extract_string(terminators) { // either ",]" ",}" or ":"
        await this._skip_whitespace();
        if ( await this._peak() != '"' ) return;

        // Eat the leading quote
        await this._read();

        // Extract the string value
        let string = "";
        while ( await this._peak() !== '"' ) {
            // Read off the character
            let c = await this._read();

            // Handle escaped characters
            if ( c == "\\" ) {
                // Get the next character
                c = await this._read();
                switch (c) {
                    case "\"":
                        string += "\"";
                        break;
                    case "\\":
                        string += "\\";
                        break;
                    case "/":
                        string += "/";
                        break;
                    case "b":
                        string += "\b";
                        break;
                    case "f":
                        string += "\f";
                        break;
                    case "n":
                        string += "\n";
                        break;
                    case "r":
                        string += "\r";
                        break;
                    case "t":
                        string += "\t";
                        break;
                    case "u":
                        // eat the 'u', read the next 4, require them to be hex, then format the string:
                        c = await this._read();
                        c += await this._read();
                        c += await this._read();
                        c += await this._read();
                        if ( !c.match(/[A-Fa-f0-9]{4}/) ) return this.emit("error", new Error("Unexpected escaped character \\u"+c));
                        string += String.fromCharCode(parseInt(c, 16));
                        break;
                    default:
                        return this.emit("error", new Error("Unexpected escaped character "+c));
                }
            } else {
                string += c;
            }
        }

        // Eat the trailing quote
        await this._read();

        // Require the terminator ( either a ":" for keys or ",]}" for values )
        if ( !(await this._finish_value(terminators)) ) return;

        return string;
    }

    /**
     * Parse a JSON key
     *
     * @private
     * @returns {string?} The key if succesfully parsed, otherwise `undefined`
     */
    async _parse_key() {
        const string = await this._extract_string(":");
        if ( string == undefined ) return;
        return string;
    }

    /**
     * Parse a JSON "string" value
     *
     * @private
     * @param {string} [terminators=,] - The character which terminates this object
     * @returns {string?} The string if succesfully parsed, otherwise `undefined`
     */
    async _parse_string(terminators=",") { // either ",]" ",}" or ":"
        const string = await this._extract_string(terminators);
        if ( string == undefined ) return;

        this.emit("token", { type: "string", path: [...this.#tree], value: string, string: this._consume_read_data() });

        return string;
    }

    /**
     * Parse a JSON value from the data stream
     *
     * @private
     * @param {string} terminators - The character which terminates this object
     * @returns {string?} The value if succesfully parsed, otherwise `undefined`
     */
    async _parse_value(terminators) {
        let result;
        result = await this._parse_array(terminators);
        if ( result != undefined ) return result;
        result = await this._parse_object(terminators);
        if ( result != undefined ) return result;
        result = await this._parse_string(terminators);
        if ( result != undefined ) return result;
        result = await this._parse_number(terminators);
        if ( result != undefined ) return result;
        result = await this._parse_keyword("null",terminators);
        if ( result != undefined ) return result;
        result = await this._parse_keyword("true",terminators);
        if ( result != undefined ) return result;
        result = await this._parse_keyword("false",terminators);
        if ( result != undefined ) return result;

        return undefined;
    }

    /**
     * Append a chunk to the data stream (optionally starting the parser)
     *
     * @private
     * @param {string} chunk - The chunk to append
     */
    _write(chunk) {
        this.#data += chunk;
        this.emit("data", chunk);
        if ( this.#start ) {
            this._parse_init();
            this.#start = false;
        }
    }

    /**
     * Add the following chunk to the parser's data stack
     *
     * @param {string} chunk
     * @returns {Promise} Resolves when the chunk has been parsed
     */
    write(chunk) {
        if ( this.#corked ) return Promise.reject(new Error("Cannot write to a closed stream"));
        let promise = new Promise((res,rej) => {
            // TODO Remove other even listeners?
            this.once("drain", res);
            this.once("end", res);
            this.once("error", rej);
        });
        this._write(chunk);
        return promise;
    }

    /**
     * Add the following chunk to the parser's data stack, and declare this the end
     *
     * @param {string} chunk
     * @returns {Promise} Resolves when the parser has finished
     */
    end(chunk="") {
        this.#corked = true;
        let promise = new Promise((res,rej) => {
            this.once("end", res);
            this.once("error", rej);
        });
        this._write(chunk);
        this.emit("corked");
        return promise;
    }

    /**
     * Parse the provided text into tokens
     *
     * @param {string} text
     * @returns {Promise<Array<object>>} Array of tokens
     */
    static async parse(text) {
        let parser = new this();
        let output = [];
        parser.on("token", (token) => output.push(token));
        return parser.end(text).then(() => output);
    }
}

module.exports = exports = Parser;
