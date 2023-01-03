const { EventEmitter } = require("events");

const Parser = require("./lib/Parser.js");
const Renderer = require("./lib/Renderer.js");


/**
 * TODO
 *
 * @event JSONStream#data
 */

/**
 * TODO
 *
 * @event JSONStream#drain
 */

/**
 * TODO
 *
 * @event JSONStream#end
 */


/**
 * Class representing a JSONStream.
 *
 * @augments EventEmitter
 */
class JSONStream extends EventEmitter {
    /**
     * Constructor
     *
     * @param {object} [opts={}] - Options, @see {@link Renderer#constructor}
     */
    constructor(opts={}) {
        super();
        this.parser = new Parser();
        this.renderer = new Renderer(opts);

        this.parser.on("end", () => this.emit("end"));
        this.parser.on("drain", () => this.emit("drain"));

        this.parser.on("token", (token) => this.renderer.render_token(token));
        this.renderer.on("data", (string) => this.emit("data",string));
    }

    /**
     * Write a chunk of data to the stream.
     *
     * @param {string} string - The chunk of data to write.
     * @returns {Promise} Resolves when the chunk has been written.
     */
    async write(string) { return this.parser.write(string); }

    /**
     * Write a chunk of data to the stream, then close it
     *
     * @param {string} string - The chunk of data to write.
     * @returns {Promise} Resolves when the stream has been closed
     */
    async end(string="") { return this.parser.end(string); }

    /**
     * Statically parse a JSON string.
     *
     * @param {string} string - The JSON string to parse.
     * @param {object} [opts={}] - Options, @see {@link Renderer#constructor}
     * @returns {string} The parsed JSON string.
     */
    static parse(string, opts={}) {
        const sp = new JSONStream(opts);
        let out = "";
        sp.on("data", (chunk) => out += chunk);
        return sp.end(string).then(() => out);
    }

    /**
     * Statically parse a javascript object into a JSON string.
     *
     * @param {object|Array} object - The javascript object to parse
     * @param {object} [opts={}] - Options, @see {@link Renderer#constructor}
     * @returns {string} The parsed JSON string.
     */
    static stringify(object, opts={}) {
        const sp = new JSONStream(opts);
        let out = "";
        sp.on("data", (chunk) => out += chunk);
        return sp.end(JSON.stringify(object)).then(() => out);
    }
}

module.exports = exports = {
    JSONStream,
    Parser,
    Renderer
};
