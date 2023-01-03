## Classes

<dl>
<dt><a href="#JSONStream">JSONStream</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Class representing a JSONStream.</p>
</dd>
<dt><a href="#Parser">Parser</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Class to parse JSON strings into tokens</p>
</dd>
<dt><a href="#Renderer">Renderer</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Class representing a JSON renderer</p>
</dd>
</dl>

<a name="JSONStream"></a>

## JSONStream ⇐ <code>EventEmitter</code>
Class representing a JSONStream.

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [JSONStream](#JSONStream) ⇐ <code>EventEmitter</code>
    * [new JSONStream([opts])](#new_JSONStream_new)
    * _instance_
        * [.write(string)](#JSONStream+write) ⇒ <code>Promise</code>
        * [.end(string)](#JSONStream+end) ⇒ <code>Promise</code>
        * ["data"](#JSONStream+event_data)
        * ["drain"](#JSONStream+event_drain)
        * ["end"](#JSONStream+event_end)
    * _static_
        * [.parse(string, [opts])](#JSONStream.parse) ⇒ <code>string</code>
        * [.stringify(object, [opts])](#JSONStream.stringify) ⇒ <code>string</code>

<a name="new_JSONStream_new"></a>

### new JSONStream([opts])
Constructor


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [opts] | <code>object</code> | <code>{}</code> | Options, @see [Renderer#constructor](Renderer#constructor) |

<a name="JSONStream+write"></a>

### jsonStream.write(string) ⇒ <code>Promise</code>
Write a chunk of data to the stream.

**Kind**: instance method of [<code>JSONStream</code>](#JSONStream)  
**Returns**: <code>Promise</code> - Resolves when the chunk has been written.  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | The chunk of data to write. |

<a name="JSONStream+end"></a>

### jsonStream.end(string) ⇒ <code>Promise</code>
Write a chunk of data to the stream, then close it

**Kind**: instance method of [<code>JSONStream</code>](#JSONStream)  
**Returns**: <code>Promise</code> - Resolves when the stream has been closed  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | The chunk of data to write. |

<a name="JSONStream+event_data"></a>

### "data"
TODO

**Kind**: event emitted by [<code>JSONStream</code>](#JSONStream)  
<a name="JSONStream+event_drain"></a>

### "drain"
TODO

**Kind**: event emitted by [<code>JSONStream</code>](#JSONStream)  
<a name="JSONStream+event_end"></a>

### "end"
TODO

**Kind**: event emitted by [<code>JSONStream</code>](#JSONStream)  
<a name="JSONStream.parse"></a>

### JSONStream.parse(string, [opts]) ⇒ <code>string</code>
Statically parse a JSON string.

**Kind**: static method of [<code>JSONStream</code>](#JSONStream)  
**Returns**: <code>string</code> - The parsed JSON string.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | The JSON string to parse. |
| [opts] | <code>object</code> | <code>{}</code> | Options, @see [Renderer#constructor](Renderer#constructor) |

<a name="JSONStream.stringify"></a>

### JSONStream.stringify(object, [opts]) ⇒ <code>string</code>
Statically parse a javascript object into a JSON string.

**Kind**: static method of [<code>JSONStream</code>](#JSONStream)  
**Returns**: <code>string</code> - The parsed JSON string.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>object</code> \| <code>Array</code> |  | The javascript object to parse |
| [opts] | <code>object</code> | <code>{}</code> | Options, @see [Renderer#constructor](Renderer#constructor) |

<a name="Parser"></a>

## Parser ⇐ <code>EventEmitter</code>
Class to parse JSON strings into tokens

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [Parser](#Parser) ⇐ <code>EventEmitter</code>
    * [new Parser()](#new_Parser_new)
    * _instance_
        * [.closed](#Parser+closed) : <code>boolean</code>
        * [.write(chunk)](#Parser+write) ⇒ <code>Promise</code>
        * [.end(chunk)](#Parser+end) ⇒ <code>Promise</code>
        * ["close"](#Parser+event_close)
        * ["drain"](#Parser+event_drain)
        * ["error"](#Parser+event_error)
        * ["token"](#Parser+event_token)
    * _static_
        * [.parse(text)](#Parser.parse) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

<a name="new_Parser_new"></a>

### new Parser()
Constructor

<a name="Parser+closed"></a>

### parser.closed : <code>boolean</code>
Has the stream been closed?

**Kind**: instance property of [<code>Parser</code>](#Parser)  
<a name="Parser+write"></a>

### parser.write(chunk) ⇒ <code>Promise</code>
Add the following chunk to the parser's data stack

**Kind**: instance method of [<code>Parser</code>](#Parser)  
**Returns**: <code>Promise</code> - Resolves when the chunk has been parsed  

| Param | Type |
| --- | --- |
| chunk | <code>string</code> | 

<a name="Parser+end"></a>

### parser.end(chunk) ⇒ <code>Promise</code>
Add the following chunk to the parser's data stack, and declare this the end

**Kind**: instance method of [<code>Parser</code>](#Parser)  
**Returns**: <code>Promise</code> - Resolves when the parser has finished  

| Param | Type |
| --- | --- |
| chunk | <code>string</code> | 

<a name="Parser+event_close"></a>

### "close"
TODO

**Kind**: event emitted by [<code>Parser</code>](#Parser)  
<a name="Parser+event_drain"></a>

### "drain"
TODO

**Kind**: event emitted by [<code>Parser</code>](#Parser)  
<a name="Parser+event_error"></a>

### "error"
TODO

**Kind**: event emitted by [<code>Parser</code>](#Parser)  
<a name="Parser+event_token"></a>

### "token"
TODO

**Kind**: event emitted by [<code>Parser</code>](#Parser)  
<a name="Parser.parse"></a>

### Parser.parse(text) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Parse the provided text into tokens

**Kind**: static method of [<code>Parser</code>](#Parser)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Array of tokens  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

<a name="Renderer"></a>

## Renderer ⇐ <code>EventEmitter</code>
Class representing a JSON renderer

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [Renderer](#Renderer) ⇐ <code>EventEmitter</code>
    * [new Renderer([options])](#new_Renderer_new)
    * _instance_
        * [.render(tokens)](#Renderer+render) ⇒ <code>string</code>
        * [.render_token(token)](#Renderer+render_token)
        * ["data"](#Renderer+event_data)
    * _static_
        * [.render(tokens, [opts])](#Renderer.render) ⇒ <code>string</code>

<a name="new_Renderer_new"></a>

### new Renderer([options])
Constructor


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Options |
| [options.indent] | <code>string</code> | <code>&quot;&#x27;    &#x27;&quot;</code> | The string to use for indentation |
| [options.EOL] | <code>string</code> | <code>&quot;\\n&quot;</code> | The string to use for EOL |
| [options.colon] | <code>string</code> | <code>&quot;:&quot;</code> | The string to use for colons |
| [options.colorize] | <code>boolean</code> | <code>true</code> | Whether to colorize the output |
| [options.suppress_quotes] | <code>boolean</code> | <code>false</code> | Whether to suppress quotes |
| [options.quotes_color] | <code>string</code> | <code>&quot;default&quot;</code> | - |
| [options.quotes_faint] | <code>boolean</code> | <code>true</code> | - |
| [options.colon_color] | <code>string</code> | <code>&quot;default&quot;</code> | - |
| [options.colon_faint] | <code>boolean</code> | <code>true</code> | - |
| [options.comma_color] | <code>string</code> | <code>&quot;default&quot;</code> | - |
| [options.comma_faint] | <code>boolean</code> | <code>true</code> | - |
| [options.bracket_color] | <code>string</code> | <code>&quot;default&quot;</code> | - |
| [options.bracket_faint] | <code>boolean</code> | <code>true</code> | - |
| [options.key_color] | <code>string</code> | <code>&quot;white&quot;</code> | - |
| [options.string_color] | <code>string</code> | <code>&quot;yellow&quot;</code> | - |
| [options.null_color] | <code>string</code> | <code>&quot;cyan&quot;</code> | - |
| [options.null_bold] | <code>string</code> | <code>true</code> | - |
| [options.true_color] | <code>string</code> | <code>&quot;green&quot;</code> | - |
| [options.false_color] | <code>string</code> | <code>&quot;red&quot;</code> | - |
| [options.number_color] | <code>string</code> | <code>&quot;#810895&quot;</code> | - |

<a name="Renderer+render"></a>

### renderer.render(tokens) ⇒ <code>string</code>
Render a list of parsed tokens to a string

**Kind**: instance method of [<code>Renderer</code>](#Renderer)  
**Returns**: <code>string</code> - The rendered string  

| Param | Type | Description |
| --- | --- | --- |
| tokens | <code>Array.&lt;object&gt;</code> | The list of tokens to render |

<a name="Renderer+render_token"></a>

### renderer.render\_token(token)
Ingest a token for rendering

**Kind**: instance method of [<code>Renderer</code>](#Renderer)  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>object</code> | The token to render |

<a name="Renderer+event_data"></a>

### "data"
TODO

**Kind**: event emitted by [<code>Renderer</code>](#Renderer)  
<a name="Renderer.render"></a>

### Renderer.render(tokens, [opts]) ⇒ <code>string</code>
Render a list of parsed tokens to a string

**Kind**: static method of [<code>Renderer</code>](#Renderer)  
**Returns**: <code>string</code> - The rendered string  

| Param | Type | Description |
| --- | --- | --- |
| tokens | <code>Array.&lt;object&gt;</code> | The list of tokens to render |
| [opts] | <code>object</code> | Options, @see [Renderer.constructor](Renderer.constructor) |

