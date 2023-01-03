# JSON Color Stream
A stream parser for pretty printing for JSON!

A no-nonsense, low-dependency, streaming API for converting nasty and fragmented JSON strings into beautiful, canonicalized outputs

 - Accepts either full JSON strings or serial chunk, following a "parse-as-you-go" paradigm:
    - Large JSON blobs? No problem! The minimal memory overhead has your back!
    - Don't wait for your whole JSON string to come in, let the parser give you the fragments now!
 - Fully configurable output format (either from the command line or a configuration file): pick your "canonical form" and make all strings obey!
 - Integrated colorization: never let your eyes bleed again!
 - Fully asynchronous backend: make the event loop work for you!


Get it today, on npm!
```bash
# Add to your library
npm install json-color-stream

# Or, install globally so you can use the CLI
npm install -g json-color-stream
```

## Basic Usage
See the [full API](./API.md) for all the gory details, but here's a quick primer:
```js
const { JSONStream } = require("json-color-stream");

// Statically parse
console.log(JSONStream.parse(`{ "a": 1 }`));

let js;

// Handle non-piped input
js = new JSONStream();
js.on("data", (string) => console.log(string));
js.end(`{ "a": 1 }`);

// Handle piped (fragmented) input
js = new JSONStream();
js.on("data", (string) => process.stdout.write(string));
js.write(`{ "a"`);
js.write(`: 1 }`);
js.end();
```

## CLI Usage
If you globally installed the package (or locally, then just use `npx jcs`), then you can do all this on the command line too!
```bash
# Show the help menu
jcs --help

# Format JSON strings
jcs '{"a": 1}'

# Can pipe to stdin too!
curl -s https://api.github.com/users/jonathanvanschenck/repos | jcs -

# Can turn off colors, and quote suppression, so that your eyes can bleed
jcs --colorize-mode 0 --quote-suppression-mode 0 '{"a": 1}'

# Can turn off the pretty formatting, to, if you just want to cannonicalize the output
jcs --indent "" --EOL "" --colon ":" --colorize-mode 0 --quote-suppression-mode 0 ' { "a" : 1}       '
```

If you don't like any of the defaults, you can edit them in `$HOME/.config/jcs/config.json`,
which are just the `Renderer`'s constructor options:

## Manual Installation
Make sure you have `node.js` installed on your system

Make sure the index file is executable
```bash
chmod +x cli.js
```

Simulink the index file to some folder in your path, e.g.:
```bash
cd /usr/local/bin
ln -s /path/to/cli.js jcs
```

## TODOs
 - Add escaped string characters and unicode
 - Add configuration management tools to the cli
 - Add non-composite starts for JSON strings?
 - Clean up error reporting, for the possibility of error handling
 - Allow parser resets
 - Fix CLI `--EOL` option to un-escape `\n` characters
