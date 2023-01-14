
const { EventEmitter } = require("events");
const { f } = require("yaclc");


/**
 * Convert non-space whitespace into escaped strings
 *
 * @private
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 */
function _escape_whitespace(string) {
    return string.replace(/[\b]/g, "\\b")
        .replace(/[\f]/g, "\\f")
        .replace(/[\n]/g, "\\n")
        .replace(/[\r]/g, "\\r")
        .replace(/[\t]/g, "\\t");
}

/**
 * Convert non-ascii unicode into escaped unicode
 *
 * @private
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 */
function _escape_unicode(string) {
    return string.replace(/[^\x00-\x7F]/g, (match) => {
        let string = match.charCodeAt(0).toString(16);
        while (string.length < 4) string = "0" + string;
        return "\\u" + string;
    });
}

/**
 * TODO
 *
 * @event Renderer#data
 */

/**
 * Class representing a JSON renderer
 *
 * @augments EventEmitter
 */
class Renderer extends EventEmitter {
    #f;
    #formats;
    #q;
    #EOL;
    #indent;
    #colon;
    #comma;
    #last_token;
    #escape;

    /**
     * Constructor
     *
     * @param {object} [options] - Options
     * @param {string} [options.indent='    '] - The string to use for indentation
     * @param {string} [options.EOL=\n] - The string to use for EOL
     * @param {string} [options.colon=: ] - The string to use for colons
     * @param {boolean} [options.suppress_quotes=true] - Whether to suppress quotes
     * @param {boolean} [options.escape_whitespace=true] - Whether to escape (non-space) whitespace
     * @param {boolean} [options.escape_unicode=false] - Whether to escape unicode characters
     * @param {boolean} [options.colorize=true] - Whether to colorize the output
     * @param {string} [options.quotes_color=default] -
     * @param {boolean} [options.quotes_faint=true] -
     * @param {string} [options.colon_color=default] -
     * @param {boolean} [options.colon_faint=true] -
     * @param {string} [options.comma_color=default] -
     * @param {boolean} [options.comma_faint=true] -
     * @param {string} [options.bracket_color=default] -
     * @param {boolean} [options.bracket_faint=true] -
     * @param {string} [options.key_color=white] -
     * @param {string} [options.string_color=yellow] -
     * @param {string} [options.null_color=cyan] -
     * @param {string} [options.null_bold=true] -
     * @param {string} [options.true_color=green] -
     * @param {string} [options.false_color=red] -
     * @param {string} [options.number_color=#810895] -
     */
    constructor({
        indent = "    ",
        EOL = "\n",
        colon = ": ",
        suppress_quotes = true,
        escape_whitespace = true,
        escape_unicode = false,
        colorize = true,
        quotes_color = "default",
        quotes_faint = true,
        colon_color = "default",
        colon_faint = true,
        comma_color = "default",
        comma_faint = true,
        bracket_color = "default",
        bracket_faint = true,
        key_color = "white",
        string_color = "yellow",
        null_color = "cyan",
        null_bold = true,
        true_color = "green",
        false_color = "red",
        number_color = "#810895", // bright magenta
    }={}) {

        super();

        if (colorize) {
            this.#f = f;
            this.#formats = {
                quotes : {
                    color : quotes_color,
                    faint : quotes_faint
                },
                comma : {
                    color : comma_color,
                    faint : comma_faint
                },
                bracket : {
                    color : bracket_color,
                    faint : bracket_faint
                },
                key : {
                    color : key_color
                },
                string : {
                    color : string_color
                },
                null : {
                    color : null_color,
                    bold : null_bold,
                },
                true : {
                    color : true_color
                },
                false : {
                    color : false_color
                },
                number : {
                    color : number_color
                },
            };
        } else {
            this.#f = x => x;
            this.#formats = {};
        }

        const q = this.#f(`"`, { color: quotes_color, faint: quotes_faint });
        this.#q = suppress_quotes ? x => x : x => `${q}${x}${q}`;
        this.#EOL = EOL;
        this.#indent = (n) => indent.repeat(n);
        this.#colon = this.#f(colon, { color: colon_color, faint: colon_faint });
        this.#comma = this.#f(",", { color: comma_color, faint: comma_faint });

        if (escape_whitespace) {
            if ( escape_unicode ) {
                this.#escape = (string) => _escape_unicode(_escape_whitespace(string));
            } else {
                this.#escape = (string) => _escape_whitespace(string);
            }
        } else {
            if ( escape_unicode ) {
                this.#escape = (string) => _escape_unicode(string);
            } else {
                this.#escape = (string) => string;
            }
        }

        this.#last_token = null;
    }

    /**
     * Render a list of parsed tokens to a string
     *
     * @param {Array<object>} tokens - The list of tokens to render
     * @returns {string} The rendered string
     */
    render(tokens) {
        let string = "";
        this.on("data", (data) => string += data);
        tokens.forEach(token => this.render_token(token));
        return string;
    }

    /**
     * Ingest a token for rendering
     *
     * @param {object} token - The token to render
     */
    render_token(token) {
        let string = "";

        let empty = false;
        if ( this.#last_token ) {
            // check if we are closing the bracket we just opened
            if ( token.type == `${this.#last_token.type}_closing` ) empty = true;

            if ( !empty ) {
                // Add commas, but only if we didn't just open brackets, or are about to close them
                if ( !this.#last_token.type.match(/^(object|array)$/) && !token.type.includes("closing") ) string += this.#comma;
                string += this.#EOL;
            }
        }

        // add indenting and the key (if applicable)
        if ( !empty ) {
            string += this.#indent(token.path.length);
            let key = token.path.length ? token.path[token.path.length - 1] : undefined;
            if ( typeof(key) === "string" && !token.type.includes("closing") ) {
                string += this.#q(this.#escape(key)) + this.#colon;
            }
        }

        switch (token.type) {
            case "EOF":
                string = this.#EOL;
                break;
            case "object":
                string += this.#f("{", this.#formats.bracket);
                break;
            case "object_closing":
                string += this.#f("}", this.#formats.bracket);
                break;
            case "array":
                string += this.#f("[", this.#formats.bracket);
                break;
            case "array_closing":
                string += this.#f("]", this.#formats.bracket);
                break;
            case "string":
                string += this.#q(this.#f(this.#escape(token.value), this.#formats.string));
                break;
            case "number":
                string += this.#f(token.value, this.#formats.number);
                break;
            case "null":
            case "true":
            case "false":
                string += this.#f(token.value, this.#formats[token.type]);
                break;
            default:
                string = "";
                break;
        }

        this.emit("data", string);

        this.#last_token = token;
    }

    /**
     * Render a list of parsed tokens to a string
     *
     * @param {Array<object>} tokens - The list of tokens to render
     * @param {object} [opts] - Options, @see {@link Renderer.constructor}
     * @returns {string} The rendered string
     */
    static render(tokens=[], opts={}) {
        return (new Renderer(opts).render(tokens));
    }
}

module.exports = exports = Renderer;
