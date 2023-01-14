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
        this.#reset_head();
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
    #reset_head() { this.#head = 0; }

    /**
     * Truncate the data to the current head position.
     *
     * @private
     * @returns {string}
     */
    #consume_read_data() {
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
    async #peak(sneaky=false) {
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
                    res(this.#peak());
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
    async #read() {
        const c = await this.#peak();
        this.#head++;
        return c;
    }

    /**
     * Read data until we hit something which isn't whitespace
     *
     * @private
     */
    async #skip_whitespace() {
        while ( (await this.#peak(true))?.match(/\s/) ) this.#head++;
    }

    /**
     * Start parsing a new stream
     *
     * @private
     */
    async #parse_init() {
        await this.#skip_whitespace();
        switch ( await this.#peak() ) {
            case "{":
                await this.#parse_object(false);
                await this.#eat_EOF();
                break;
            case "[":
                await this.#parse_array(false);
                await this.#eat_EOF();
                break;
            default:
                this.emit("error", new Error("Unexpected character "+(await this.#peak())));
                return;
        }

        this.emit("end");
    }

    /**
     * Expect, consume, then emit the EOF
     *
     * @private
     */
    async #eat_EOF() {
        if ( !this.#corked ) await new Promise(res => this.once("corked",res));
        await this.#skip_whitespace();
        switch ( await this.#peak(true) ) {
            case undefined:
                break;
            default:
                this.emit("error", new Error("Unexpected trailing character "+(await this.#read())));
                return;
        }
        this.emit("token", { type: "EOF", path: [...this.#tree], value: "EOF", string: this.#consume_read_data() });
    }

    /**
     * Expect and (maybe) consume a terminator for a value
     *
     * The terminator is only consumed if it is a "," or ":"
     *
     * @private
     * @param {string} terminators - A string of characters which are valid terminators for this value
     */
    async #finish_value(terminators) {
        await this.#skip_whitespace();
        if ( terminators.includes(await this.#peak()) ) {
            // eat commas and colons, but leave bracket/braces for higher level object
            if ( ",:".includes(await this.#peak()) ) await this.#read();
        } else {
            this.emit("error", new Error("Unexpected character "+(await this.#peak())));
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
    async #parse_array(terminators=",") {
        await this.#skip_whitespace();
        if ( await this.#peak() != "[" ) return;

        // eat the openning bracket
        await this.#read();
        this.emit("token", { type: "array", path: [...this.#tree], value: "[", string: this.#consume_read_data() });

        let key = 0;
        await this.#skip_whitespace();
        while ( await this.#peak() != "]" ) {

            this.#tree.push(key++);
            let value = await this.#parse_value(",]");
            this.#tree.pop();

            // Make sure we actually got something
            if ( value == undefined ) {
                this.emit("error", new Error("Unexpected character "+(await this.#peak())));
                return;
            }

            await this.#skip_whitespace();
        }

        // eat the closing bracket
        await this.#read();

        if ( terminators && !(await this.#finish_value(terminators)) ) return;

        this.emit("token", { type: "array_closing", path: [...this.#tree], value: "]", string: this.#consume_read_data() });

        return "array";
    }

    /**
     * Parse a JSON object
     *
     * @private
     * @param {string} [terminators=,] - The character which terminates this object
     * @returns {string?} A string if succesfully parsed, otherwise `undefined`
     */
    async #parse_object(terminators=",") {
        await this.#skip_whitespace();
        if ( await this.#peak() != "{" ) return;

        // eat the openning brace
        await this.#read();
        this.emit("token", { type: "object", path: [...this.#tree], value: "{", string: this.#consume_read_data() });

        await this.#skip_whitespace();
        while ( await this.#peak() != "}" ) {

            const key = await this.#parse_key();

            // Make sure we actually got something
            if ( key == undefined ) {
                this.emit("error", new Error("Unexpected character "+(await this.#peak())));
                return;
            }

            this.#tree.push(key);
            let value = await this.#parse_value(",}");
            this.#tree.pop();

            // Make sure we actually got something
            if ( value == undefined ) {
                this.emit("error", new Error("Unexpected character "+(await this.#peak())));
                return;
            }

            await this.#skip_whitespace();
        }

        // eat the closing brace
        await this.#read();

        if ( terminators && !(await this.#finish_value(terminators)) ) return;

        this.emit("token", { type: "object_closing", path: [...this.#tree], value: "}", string: this.#consume_read_data() });

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
    async #parse_keyword(keyword, terminators=",") {
        await this.#skip_whitespace();
        if ( await this.#peak() != keyword[0] ) return;

        for ( let i = 0; i < keyword.length; i++ ) {
            if ( await this.#peak() != keyword[i] ) {
                this.emit("error", new Error("Unexpected character "+(await this.#peak())));
                return;
            }
            await this.#read();
        }

        if ( !(await this.#finish_value(terminators)) ) return;

        this.emit("token", { type: keyword, path: [...this.#tree], value: keyword, string: this.#consume_read_data() });

        return keyword;
    }

    /**
     * Parse a JSON number
     *
     * @private
     * @param {string} [terminators=,] - The character which terminates this object
     * @returns {string?} The number (as a string) if succesfully parsed, otherwise `undefined`
     */
    async #parse_number(terminators=",") {
        await this.#skip_whitespace();
        if ( !(await this.#peak())?.match(/[-\d.]/) ) return;

        let number = "";
        // Pull the negative, if it exists
        if ( await this.#peak() === "-" ) {
            number += await this.#read();
        }

        // We either have a single zero, or at least 1 non-zero digit followed by any number of digits, or a decimal place
        if ( await this.#peak() === "0" ) {
            number += await this.#read();
        } else if ( (await this.#peak())?.match(/[1-9]/) ) {
            while ( (await this.#peak())?.match(/[0-9]/) ) number += await this.#read();
        } else if ( (await this.#peak()) === "." ) {
            // pass, we'll get this one in a sec
        } else {
            this.emit("error", new Error("Failed to read number at character "+(await this.#peak())));
            return;
        }

        // Pull the decimal place and any trailing digits
        if ( await this.#peak() === "." ) {
            number += await this.#read();
            while ( (await this.#peak())?.match(/[0-9]/) ) number += await this.#read();
        }

        // Pull the exponent
        if ( (await this.#peak())?.match(/[eE]/) ) {
            number += await this.#read();
            if ( (await this.#peak())?.match(/[-+]/) ) number += await this.#read();
            while ( (await this.#peak())?.match(/[0-9]/) ) number += await this.#read();
        }

        // Double check that the number is actually valid ....
        const check = parseFloat(number);
        if ( isNaN(check) ) {
            this.emit("error", new Error("Failed to read number "+number));
            return;
        }

        if ( !(await this.#finish_value(terminators)) ) return;

        this.emit("token", { type: "number", path: [...this.#tree], value: number, string: this.#consume_read_data() });

        return number;
    }

    /**
     * Extract a JSON "string" value from the data stream
     *
     * @private
     * @param {string} terminators - The character which terminates this object. Can be ",]" or ",}" for values or ":" for keys
     * @returns {string?} The number (as a string) if succesfully parsed, otherwise `undefined`
     */
    async #_extract_string(terminators) { // either ",]" ",}" or ":"
        await this.#skip_whitespace();
        if ( await this.#peak() != '"' ) return;

        // Eat the leading quote
        await this.#read();

        // Extract the string value
        let string = "";
        while ( await this.#peak() !== '"' ) {
            // Read off the character
            let c = await this.#read();

            // Handle escaped characters
            if ( c == "\\" ) {
                // Get the next character
                c = await this.#read();
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
                        c = await this.#read();
                        c += await this.#read();
                        c += await this.#read();
                        c += await this.#read();
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
        await this.#read();

        // Require the terminator ( either a ":" for keys or ",]}" for values )
        if ( !(await this.#finish_value(terminators)) ) return;

        return string;
    }

    /**
     * Parse a JSON key
     *
     * @private
     * @returns {string?} The key if succesfully parsed, otherwise `undefined`
     */
    async #parse_key() {
        const string = await this.#_extract_string(":");
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
    async #parse_string(terminators=",") { // either ",]" ",}" or ":"
        const string = await this.#_extract_string(terminators);
        if ( string == undefined ) return;

        this.emit("token", { type: "string", path: [...this.#tree], value: string, string: this.#consume_read_data() });

        return string;
    }

    /**
     * Parse a JSON value from the data stream
     *
     * @private
     * @param {string} terminators - The character which terminates this object
     * @returns {string?} The value if succesfully parsed, otherwise `undefined`
     */
    async #parse_value(terminators) {
        return await this.#parse_array(terminators) ??
            await this.#parse_object(terminators) ??
            await this.#parse_string(terminators) ??
            await this.#parse_number(terminators) ??
            await this.#parse_keyword("null", terminators) ??
            await this.#parse_keyword("true", terminators) ??
            await this.#parse_keyword("false", terminators);
    }

    /**
     * Append a chunk to the data stream (optionally starting the parser)
     *
     * @private
     * @param {string} chunk - The chunk to append
     */
    #write(chunk) {
        this.#data += chunk;
        this.emit("data", chunk);
        if ( this.#start ) {
            this.#parse_init();
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
        this.#write(chunk);
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
        this.#write(chunk);
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
