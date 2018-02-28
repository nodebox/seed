function rand(min, max) {
    return min + Math.random() * (max - min);
}

function choice(l) {
    const index = Math.floor(Math.random() * l.length);
    return l[index];
}

function randomChar(min, max) {
    min = min.charCodeAt(0);
    max = max.charCodeAt(0);
    charCode = Math.round(rand(min, max));
    return String.fromCharCode(charCode);
}

function randomTextSeed() {
    let seed = '';
    for (let i = 0; i < 3; i++) {
        const min = 'A'.charCodeAt(0);
        const max = 'Z'.charCodeAt(0);
        seed += String.fromCharCode(Math.round(rand(min, max)));
    }
    return seed;
}

function seedTextToNumber(s) {
    let v = 0;
    for (let i = 0; i < s.length; i++) {
        v *= 26;
        const c = s.charCodeAt(i) - 65;
        v += c;
    }
    return v;
}

function seedNumberToText(v) {
    let s = '';
    while (v > 0) {
        const digit = v % 26;
        const c = String.fromCharCode(65 + digit);
        s = c + s;
        v = Math.floor(v / 26);
    }
    return s;
}

function nextTextSeed(s) {
    const val = seedTextToNumber(s);
    return seedNumberToText(val + 1);
}

function prevTextSeed(s) {
    const val = seedTextToNumber(s);
    return seedNumberToText(val - 1);
}

function applyFilters(s, filters) {
    for (f of filters) {
        if (f === 'upper') {
            s = s.toUpperCase();
        } else if (f === 'lower') {
            s = s.toLowerCase();
        } else if (f === 'title') {
            s = s.toTitleCase();
        } else if (f === 'sentence') {
            s = s.substring(0, 1).toUpperCase() + s.substring(1);
        } else {
            throw new Error(`Unknown filter "${f}".`);
        }
    }
    return s;
}

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function getURLParameter(name, url) {
    if (typeof window === 'undefined') { return false; }
    if (!url) { url = window.location.search; }
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) { return null; }
    if (!results[2]) { return ''; }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

const VARIABLE_TAG_START = '{{';
const VARIABLE_TAG_END = '}}';
const REF_START = 'ref_start';
const REF_END = 'ref_end';
const TEXT = 'text';
const REF = 'ref';
const EOF = 'eof';
const KEY = 'key';
const STRING = 'string';
const REAL_CONST = 'real_const';
const INTEGER_CONST = 'integer_const';
const RANGE = 'range';
const ANIMATION_RANGE = 'anim_range';
const FILTER = 'filter';
const VAR_GLOBAL = 'var_g';
const PLUS = '+';
const MINUS = '-';
const MUL = '*';
const DIV = '/';
const LPAREN = '(';
const RPAREN = ')';
const LBRACK = '[';
const RBRACK = ']';
const COMMA = ',';
const COLON = ':';

const DIGITS = '0123456789';
const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHANUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._';
const WHITESPACE = '  \t'; // todo: add more to these

const PREAMBLE_RE = /^\s*(\w+)\s*:\s*(.+)*$/;
const POS_INTEGER_RE = /^\d+$/;
const DURATION_RE = /^(\d+(\.\d+)?)\s*(s|ms)?$/;
const IMPORT_RE = /^\s*import\s+(.+)\s+as\s+(([a-zA-Z]|\_)([a-zA-Z0-9]|\_|\.(?!\.))*)\s*$/;

const PREAMBLE_KEYS = ['depth', 'duration', 'animation', 'script'];
const ANIMATION_TYPES = ['once', 'linear', 'bounce'];
const MAX_LEVEL = 50;
const TIMEOUT_MILLIS = 1000;

const TIMEOUT = getURLParameter('timeout') !== 'false';

function bounce(t) {
    const a = t * Math.PI * 2;
    return 0.5 - Math.cos(a) * 0.5;
}

function lerp(min, max, t, animType) {
    switch (animType){
        case 'linear':
            break;

        case 'bounce':
        default:
            t = bounce(t);
            break;
    }
    return min + t * (max - min);
}

class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    toString() {
        return `Token(${this.type}, ${this.value})`;
    }
}

class Lexer {
    constructor(text) {
        this.text = text;
        this.pos = 0;
        this.currentChar = text.length > 0 ? text[this.pos] : null;
    }

    error(char) {
        const s = char.length > 1 ? 's' : '';
        throw new Error(`Invalid character${s} ${char} at position ${this.pos} in phrase '${this.text}'.`);
    }

    advance() {
        this.pos += 1;
        if (this.pos > this.text.length - 1) {
            this.currentChar = null;
        } else {
            this.currentChar = this.text[this.pos];
        }
    }

    peek() {
        const peekPos = this.pos + 1;
        if (peekPos > this.text.length - 1) {
            return null;
        } else {
            return this.text[peekPos];
        }
    }

    skipWhitespace() {
        while (WHITESPACE.indexOf(this.currentChar) !== -1) {
            this.advance();
        }
    }

    checkCurrentNextChars(chars) {
        return this.currentChar === chars[0] && this.peek() === chars[1];
    }

    checkEscapeChar(char) {
        return this.currentChar === '\\' && this.peek() === char;
    }

    nextToken() {
        throw new Error('Cannot call Lexer this way. Did you forget to subclass it?');
    }
}

class PhraseLexer extends Lexer {
    constructor(text) {
        super(text);
        this.insideRef = false;
    }

    _string(terminator) {
        let result = '';
        while (this.currentChar !== null) {
            if (this.checkEscapeChar(terminator)) {
                result += terminator;
                this.advance();
                this.advance();
            } else if (this.currentChar === terminator) {
                this.advance();
                break;
            } else {
                result += this.currentChar;
                this.advance();
            }
        }
        return new Token(STRING, result);
    }

    _number() {
        let result = '';
        while (this.currentChar !== null && DIGITS.indexOf(this.currentChar) !== -1) {
            result += this.currentChar;
            this.advance();
        }

        if (this.currentChar === '.' && this.peek() !== '.') {
            result += this.currentChar;
            this.advance();

            while (this.currentChar !== null && DIGITS.indexOf(this.currentChar) !== -1) {
                result += this.currentChar;
                this.advance();
            }
            return new Token(REAL_CONST, parseFloat(result));
        } else {
            return new Token(INTEGER_CONST, parseInt(result));
        }
    }

    _key() {
        let result = '';
        if (DIGITS.indexOf(this.currentChar) !== -1) {
            this.error(this.currentChar);
        }
        while (this.currentChar !== null && ALPHANUM.indexOf(this.currentChar) !== -1) {
            if (this.checkCurrentNextChars('..')) {
                break;
            }
            result += this.currentChar;
            this.advance();
        }
        return new Token(KEY, result);
    }

    _filter() {
        let result = '';
        while (this.currentChar !== null && WHITESPACE.indexOf(this.currentChar) !== -1) {
            this.skipWhitespace();
            continue;
        }
        while (this.currentChar !== null && ALPHANUM.indexOf(this.currentChar) !== -1) {
            if (this.checkCurrentNextChars('..')) {
                break;
            }
            result += this.currentChar;
            this.advance();
        }
        return new Token(FILTER, result);
    }

    _varg() {
        let result = '';
        while (this.currentChar !== null && WHITESPACE.indexOf(this.currentChar) !== -1) {
            this.skipWhitespace();
            continue;
        }
        while (this.currentChar !== null && ALPHANUM.indexOf(this.currentChar) !== -1) {
            result += this.currentChar;
            this.advance();
        }
        return new Token(VAR_GLOBAL, result);
    }

    _animRange() {
        while (this.currentChar !== null) {
            this.skipWhitespace();
            let start, end;
            let negate = false;
            if (this.currentChar === '-') {
                negate = true;
                this.advance();
            }
            if (DIGITS.indexOf(this.currentChar) !== -1) {
                start = this._number().value;
                if (negate) {
                    start = -start;
                }
            } else {
                this.error(this.currentChar);
            }
            negate = false;
            this.skipWhitespace();
            if (this.currentChar !== ',') {
                this.error(this.currentChar);
            } else {
                this.advance();
            }
            this.skipWhitespace();
            if (this.currentChar === '-') {
                negate = true;
                this.advance();
            }
            if (DIGITS.indexOf(this.currentChar) !== -1) {
                end = this._number().value;
                if (negate) {
                    end = -end;
                }
            } else {
                this.error(this.currentChar);
            }
            this.skipWhitespace();
            if (this.currentChar !== ']') {
                this.error(this.currentChar);
            } else {
                this.advance();
            }
            return new Token(ANIMATION_RANGE, {start, end});
        }
    }

    _ref() {
        let result = '';
        while (this.currentChar !== null) {
            if (WHITESPACE.indexOf(this.currentChar) !== -1) {
                this.skipWhitespace();
                continue;
            } else if (this.checkCurrentNextChars(VARIABLE_TAG_START)) {
                this.error(VARIABLE_TAG_START);
            } else if (this.checkCurrentNextChars(VARIABLE_TAG_END)) {
                this.advance();
                this.advance();
                this.insideRef = false;
                return new Token(REF_END, VARIABLE_TAG_END);
            } else if (this.currentChar === '"') {
                this.advance();
                return this._string('"');
            } else if (this.currentChar === '\'') {
                this.advance();
                return this._string("'");
            } else if (this.checkCurrentNextChars('..')) {
                this.advance();
                this.advance();
                return new Token(RANGE, '..');
            } else if (this.currentChar === '[') {
                this.advance();
                return this._animRange();
            } else if (this.currentChar === '|') {
                this.advance();
                return this._filter();
            } else if (this.currentChar === ':') {
                this.advance();
                return this._varg();
            } else if (DIGITS.indexOf(this.currentChar) !== -1) {
                return this._number();
            } else if (this.currentChar === ',') {
                this.advance();
                return new Token(COMMA, ',');
            } else if (this.currentChar === '+') {
                this.advance();
                return new Token(PLUS, '+');
            } else if (this.currentChar === '-') {
                this.advance();
                return new Token(MINUS, '-');
            } else if (this.currentChar === '*') {
                this.advance();
                return new Token(MUL, '*');
            } else if (this.currentChar === '/') {
                this.advance();
                return new Token(DIV, '/');
            } else if (this.currentChar === '(') {
                this.advance();
                return new Token(LPAREN, '(');
            } else if (this.currentChar === ')') {
                this.advance();
                return new Token(RPAREN, ')');
            } else if (ALPHANUM.indexOf(this.currentChar) !== -1) {
                return this._key();
            }

            result += this.currentChar;

            if (result) {
                this.error(result);
            }
        }
    }

    _text() {
        if (this.checkCurrentNextChars(VARIABLE_TAG_START)) {
            this.advance();
            this.advance();
            this.insideRef = true;
            return new Token(REF_START, VARIABLE_TAG_START);
        }
        let result = '';
        while (this.currentChar !== null) {
            if (this.checkCurrentNextChars(VARIABLE_TAG_END)) {
                this.error(VARIABLE_TAG_END);
            } else if (this.checkCurrentNextChars(VARIABLE_TAG_START)) {
                break;
            } else if (this.checkEscapeChar('{')) {
                result += '{';
                this.advance();
                this.advance();
            } else if (this.checkEscapeChar('}')) {
                result += '}';
                this.advance();
                this.advance();
            } else {
                result += this.currentChar;
                this.advance();
            }
        }
        return new Token(TEXT, result);
    }

    nextToken() {
        while (this.currentChar !== null) {
            return this.insideRef ? this._ref() : this._text();
        }
        return new Token(EOF, null);
    }
}

class DefLexer extends Lexer {
    _key() {
        let result = '';
        if (DIGITS.indexOf(this.currentChar) !== -1) {
            this.error(this.currentChar);
        }
        while (this.currentChar !== null && ALPHANUM.indexOf(this.currentChar) !== -1) {
            if (this.checkCurrentNextChars('..')) {
                break;
            }
            result += this.currentChar;
            this.advance();
        }
        return new Token(KEY, result);
    }

    nextToken() {
        let result = '';
        while (this.currentChar !== null) {
            if (WHITESPACE.indexOf(this.currentChar) !== -1) {
                this.skipWhitespace();
                continue;
            } else if (this.currentChar === ':') {
                this.advance();
                return new Token(COLON, ':');
            } else if (this.currentChar === ',') {
                this.advance();
                return new Token(COMMA, ',');
            } else if (this.currentChar === '(') {
                this.advance();
                return new Token(LPAREN, '(');
            } else if (this.currentChar === ')') {
                this.advance();
                return new Token(RPAREN, ')');
            } else if (ALPHANUM.indexOf(this.currentChar) !== -1) {
                return this._key();
            }
            result += this.currentChar;

            if (result) {
                this.error(result);
            }
        }
        return new Token(EOF, null);
    }
}

const NODE_CONCAT = 'Concat';
const NODE_TEXT = 'Text';
const NODE_REF = 'Ref';
const NODE_INTEGER = 'Integer';
const NODE_REAL = 'Real';
const NODE_STRING = 'String';
const NODE_RANGE = 'Range';
const NODE_KEY = 'Key';
const NODE_NAMED_KEY = 'NamedKey';
const NODE_CHAR = 'Char';
const NODE_FILTER = 'Filter';
const NODE_ANIMATION_RANGE = 'AnimRange';
const NODE_UNARY_OP = 'UnaryOp';
const NODE_BINARY_OP = 'BinaryOp';
const NODE_NO_OP = 'NoOp';

class Node {
    constructor(type, data) {
        this.type = type;
        if (data) {
            Object.assign(this, data);
        }
    }
}

class Parser {
    constructor(lexer, lineno) {
        this.lexer = lexer;
        this.lineno = lineno;
        this.currentToken = this.lexer.nextToken();
    }

    error() {
        throw new Error('Cannot call Parser this way. Did you forget to subclass it?');
    }

    consume(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.nextToken();
        } else {
            this.error(tokenType);
        }
    }

    parse() {
        throw new Error('Cannot call Parser this way. Did you forget to subclass it?');
    }
}

class PhraseParser extends Parser {
    error(tokenType) {
        throw new Error(`Invalid syntax: expected a symbol of type ${tokenType} at position ${this.lexer.pos}, but encountered ${this.currentToken.type} instead.`);
    }

    _filters(node) {
        while (this.currentToken.type === FILTER) {
            if (this.currentToken.value === '') {
                throw new Error(`Naming Error. Encountered a filter token (|) at position ${ this.lexer.pos } without a filter name.`);
            }
            node = new Node(NODE_FILTER, { node, name: this.currentToken.value });
            this.consume(FILTER);
            node = this._parameters(node);
        }
        return node;
    }

    _range(node) {
        if (this.currentToken.type === RANGE) {
            if (node.type === NODE_STRING && node.value.length !== 1) {
                throw new Error(`Range Error: Only single character strings can be part of a range. The encountered string '${ node.value }' at position ${ this.lexer.pos } has a length of ${ node.value.length }.`);
            }
            this.consume(RANGE);
            let start = node;
            let end = this.factor(false);
            if (end.type === NODE_STRING && end.value.length !== 1) {
                throw new Error(`Range Error: Only single character strings can be part of a range. The encountered string '${ end.value }' at position ${ this.lexer.pos } has a length of ${ end.value.length }.`);
            }
            if (start.type === NODE_KEY && start.key.length === 1 && !start.parameters) {
                start = new Node(NODE_CHAR, { value: start.key });
            }
            if (end.type === NODE_KEY && end.key.length === 1 && !end.parameters) {
                end = new Node(NODE_CHAR, { value: end.key });
            }
            node = new Node(NODE_RANGE, { start, end });
            node = this._filters(node);
        }
        return node;
    }

    _name(node) {
        let token = this.currentToken;
        if (this.currentToken.type === VAR_GLOBAL) {
            this.consume(VAR_GLOBAL);
            node = new Node(NODE_NAMED_KEY, { key: node.key, name: token.value });
        }
        return node;
    }

    _parameters(node) {
        const parameters = [];
        if (this.currentToken.type === LPAREN) {
            this.consume(LPAREN);
            if (this.currentToken.type === RPAREN) {
                node.parameters = parameters;
                this.consume(RPAREN);
                return node;
            }
            parameters.push(this.expr());
            while (this.currentToken.type === COMMA) {
                this.consume(COMMA);
                parameters.push(this.expr());
            }
            if (this.currentToken.type === RPAREN) {
                this.consume(RPAREN);
                node.parameters = parameters;
                return node;
            } else {
                this.error(RPAREN);
            }
        }
        return node;
    }

    factor(parseFiltersRange = true) {
        const token = this.currentToken;
        let node;
        if (token.type === PLUS) {
            this.consume(PLUS);
            node = new Node(NODE_UNARY_OP, { op: token.type, expression: this.factor(false) });
        } else if (token.type === MINUS) {
            this.consume(MINUS);
            node = new Node(NODE_UNARY_OP, { op: token.type, expression: this.factor(false) });
        } else if (token.type === INTEGER_CONST) {
            this.consume(INTEGER_CONST);
            node = new Node(NODE_INTEGER, { value: token.value });
        } else if (token.type === REAL_CONST) {
            this.consume(REAL_CONST);
            node = new Node(NODE_REAL, { value: token.value });
        } else if (token.type === ANIMATION_RANGE) {
            this.consume(ANIMATION_RANGE);
            node = new Node(NODE_ANIMATION_RANGE, { start: token.value.start, end: token.value.end });
        } else if (token.type === STRING) {
            this.consume(STRING);
            node = new Node(NODE_STRING, { value: token.value });
        } else if (token.type === KEY) {
            this.consume(KEY);
            if (this.currentToken.type === KEY) {
                throw new Error(`Invalid syntax at position ${this.lexer.pos}: Spaces are not allowed as part of identifiers. You could write '${token.value}_${this.currentToken.value}' instead.`);
            }
            node = new Node(NODE_KEY, { key: token.value });
            node = this._name(node);
            node = this._parameters(node);
        } else if (token.type === LPAREN) {
            this.consume(LPAREN);
            try {
                node = this.expr();
            } catch (e) {
                throw new Error(`Error. Empty expression at position ${this.lexer.pos}.`);
            }
            this.consume(RPAREN);
        } else {
            throw new Error(`Invalid syntax: expected a symbol (an integer, float, string, ...) at position ${this.lexer.pos}, but encountered ${this.currentToken.type} instead.`);
        }
        if (parseFiltersRange) {
            node = this._filters(node);
            node = this._range(node);
        }
        return node;
    }

    term() {
        let node = this.factor();
        while (this.currentToken.type === MUL || this.currentToken.type === DIV) {
            let token = this.currentToken;
            if (token.type === MUL) {
                this.consume(MUL);
            } else if (token.type === DIV) {
                this.consume(DIV);
            }
            node = new Node(NODE_BINARY_OP, { left: node, op: token.type, right: this.factor() });
        }
        return node;
    }

    expr() {
        if (this.currentToken.type === REF_END) {
            return new Node(NODE_NO_OP);
        } else if (this.currentToken.type === RPAREN) {
            throw new Error(`Invalid syntax: Encountered ) symbol at position ${this.lexer.pos} but no ( was seen.`);
        }
        let node = this.term();
        while (this.currentToken.type === PLUS || this.currentToken.type === MINUS) {
            let token = this.currentToken;
            if (token.type === PLUS) {
                this.consume(PLUS);
            } else if (token.type === MINUS) {
                this.consume(MINUS);
            }
            node = new Node(NODE_BINARY_OP, { left: node, op: token.type, right: this.term() });
        }
        return node;
    }

    ref() {
        let node = this.expr();
        if (this.currentToken.type !== REF_END) {
            throw new Error(`Invalid syntax: expected end of reference at position ${this.lexer.pos}, but encountered ${this.currentToken.type} instead.`);
        }
        return new Node(NODE_REF, { node });
    }

    part() {
        const token = this.currentToken;
        let node;
        if (token.type === TEXT) {
            this.consume(TEXT);
            return new Node(NODE_TEXT, { text: token.value });
        } else if (token.type === REF_START) {
            this.consume(REF_START);
            node = this.ref();
            this.consume(REF_END);
            return node;
        }
    }

    phrase() {
        let node = this.part();
        while (this.currentToken.type === TEXT || this.currentToken.type === REF_START) {
            node = new Node(NODE_CONCAT, { left: node, right: this.part() });
        }
        return node;
    }

    parse() {
        try {
            const node = this.phrase();
            if (this.currentToken.type !== EOF) {
                this.error(EOF);
            }
            return node;
        } catch (e) {
            throw new Error(`Line ${this.lineno}: ${e.message}`);
        }
    }
}

class DefParser extends Parser {
    error(tokenType) {
        throw new Error(`Invalid syntax: expected a symbol of type ${tokenType} at position ${this.lexer.pos}, but encountered ${this.currentToken.type} instead.`);
    }

    _key() {
        let key = this.currentToken.value;
        this.consume(KEY);
        if (this.currentToken.type === KEY) {
            throw new Error(`Invalid syntax at position ${this.lexer.pos}: Spaces are not allowed as part of identifiers. You could write '${key}_${this.currentToken.value}' instead.`);
        }
        return key;
    }

    _parameters() {
        const parameters = [];
        if (this.currentToken.type === LPAREN) {
            this.consume(LPAREN);
            if (this.currentToken.type === RPAREN) {
                this.consume(RPAREN);
                return parameters;
            }
            parameters.push(this._key());
            while (this.currentToken.type === COMMA) {
                this.consume(COMMA);
                parameters.push(this._key());
            }
            if (this.currentToken.type === RPAREN) {
                this.consume(RPAREN);
                return parameters;
            } else {
                this.error(RPAREN);
            }
        }
        return parameters;
    }

    parse() {
        try {
            const key = this._key();
            const parameters = this._parameters();
            this.consume(COLON);
            if (this.currentToken.type !== EOF) {
                this.error(EOF);
            }
            if (parameters.length === 0) {
                return {key};
            } else {
                return {key, parameters};
            }
        } catch (e) {
            throw new Error(`Line ${this.lineno}: ${e.message}`);
        }
    }
}

class Interpreter {
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
        this.globalScope = {};
    }

    visit(node) {
        const methodName = 'visit' + node.type;
        if (this[methodName]) {
            return this[methodName](node);
        }
        this.genericVisit(node);
    }

    genericVisit(node) {
        throw new Error(`No visit${node.type} method available for node ${node}.`);
    }

    visitNoOp(node) {
        return '';
    }

    visitUnaryOp(node) {
        const op = node.op;
        if (op === PLUS) {
            return +this.visit(node.expression);
        } else if (op === MINUS) {
            return -this.visit(node.expression);
        }
    }

    visitBinaryOp(node) {
        const op = node.op;
        if (op === PLUS) {
            return this.visit(node.left) + this.visit(node.right);
        } else if (op === MINUS) {
            return this.visit(node.left) - this.visit(node.right);
        } else if (op === MUL) {
            return this.visit(node.left) * this.visit(node.right);
        } else if (op === DIV) {
            return this.visit(node.left) / this.visit(node.right);
        }
    }

    visitConcat(node) {
        return this.visit(node.left) + this.visit(node.right);
    }

    visitText(node) {
        return node.text;
    }

    visitRef(node) {
        return String(this.visit(node.node));
    }

    visitString(node) {
        return node.value;
    }

    visitInteger(node) {
        return node.value;
    }

    visitReal(node) {
        return node.value;
    }

    visitChar(node) {
        return node.value;
    }

    visitRange(node) {
        let start, end;
        let startError, endError;
        if (node.start.type === NODE_CHAR) {
            start = node.start.value;
            if (this.localMemory[start] !== undefined) {
                start = this.localMemory[start];
            } else if (this.phraseBook[start] !== undefined) {
                start = this.visitKey(new Node(NODE_KEY, {key: start}));
            }
        } else {
            start = this.visit(node.start);
        }
        if (typeof start === 'string' && String(parseFloat(start)) === start) {
            start = parseFloat(start);
        }
        if (node.end.type === NODE_CHAR) {
            end = node.end.value;
            if (this.localMemory[end] !== undefined) {
                end = this.localMemory[end];
            } else if (this.phraseBook[end] !== undefined) {
                end = this.visitKey(new Node(NODE_KEY, {key: end}));
            }
        } else {
            end = this.visit(node.end);
        }
        if (typeof end === 'string' && end.length === 1 && String(parseFloat(end)) === end) {
            end = parseFloat(end);
        }
        if (typeof start === 'number' && typeof end === 'number') {
            return Math.floor(rand(start, end));
        }
        let min, max, charCode;
        if (typeof start === 'string' && start.length === 1 && typeof end === 'string' && end.length === 1) {
            return randomChar(start, end);
        } else if (typeof start === 'string' && start.length === 1 && typeof end === 'number' && String(end).length === 1) {
            return randomChar(start, String(end));
        } else if (typeof start === 'number' && String(start).length === 1 && typeof end === 'string' && end.length === 1) {
            return randomChar(String(start), end);
        } else {
            if (typeof start === 'string') {
                start = `"${start}"`;
            }
            if (typeof end === 'string') {
                end = `"${end}"`;
            }
            throw new Error(`Range Error: ${start}..${end}`);
        }
    }

    visitKey(node, searchLocal=true) {
        if (searchLocal && this.localMemory[node.key] !== undefined) {
            return this.localMemory[node.key];
        }
        let key, phraseBook, globalMemory;
        if (this.phraseBook['%imports'][node.key] !== undefined) {
            phraseBook = this.phraseBook['%imports'][node.key];
            key = 'root';
            globalMemory = {};
        } else {
            phraseBook = this.phraseBook;
            key = node.key;
            globalMemory = this.globalMemory;
        }
        const phrase = lookupPhrase(phraseBook, key);
        const localMemory = {};
        const parameters = phraseBook[key].parameters;
        if (parameters) {
            for (let i = 0; i < parameters.length; i += 1) {
                let name = parameters[i];
                if (node.parameters && node.parameters[i]) {
                    localMemory[name] = this.visit(node.parameters[i]);
                } else {
                    localMemory[name] = '';
                }
            }
        }
        return evalPhrase(phraseBook, phrase, globalMemory, localMemory, this.t, this.level + 1, this.startTime);
    }

    visitNamedKey(node) {
        const name = `${node.key}:${node.name}`;
        if (!this.globalMemory[name]) {
            this.globalMemory[name] = this.visitKey(node);
        }
        return this.globalMemory[name];
    }

    visitRepeatFilter(node) {
        if (!node.parameters || node.parameters.length === 0) {
            throw new Error('Repeat filter takes a positive integer argument.');
        }
        const times = parseInt(this.visit(node.parameters[0]));
        if (isNaN(times)) {
            throw new Error('Repeat filter takes a positive integer argument.');
        } else if (times <= 0) {
            throw new Error(`Repeat filter takes one positive integer argument, not ${times}`);
        }
        let s = '';
        for (let i = 0; i < times; i += 1) {
            s += this.visit(node.node);
        }
        return s;
    }

    jsEvaluator(source) {
        const evaluator = new Function(source + 'return function (_fn, args) { return eval(_fn).apply(null, args) };');
        return evaluator();
    }

    visitJSFilter(node) {
        if (!node.parameters || node.parameters.length === 0) {
            throw new Error('JS filter takes at least one argument.');
        }
        const source = this.visit(node.node);
        let evaluator;
        if (node.node.type === NODE_NAMED_KEY) {
            const name = `${node.key}:${node.name}:__evaluator`;
            if (!this.globalMemory[name]) {
                this.globalMemory[name] = this.jsEvaluator(source);
            }
            evaluator = this.globalMemory[name];
        } else {
            evaluator = this.jsEvaluator(source);
        }
        const fnName = this.visit(node.parameters[0]);
        let parameters = [];
        if (node.parameters.length > 1) {
            parameters = node.parameters.slice(1).map(p => this.visit(p));
        }
        return evaluator(fnName, parameters);
    }

    visitFilter(node) {
        const f = node.name;
        if (f === 'repeat') {
            return this.visitRepeatFilter(node);
        } else if (f === 'js') {
            return this.visitJSFilter(node);
        }
        const v = this.visit(node.node);
        if (f === 'upper') {
            return String(v).toUpperCase();
        } else if (f === 'lower') {
            return String(v).toLowerCase();
        } else if (f === 'title') {
            return String(v).toTitleCase();
        } else if (f === 'sentence') {
            return String(v).substring(0, 1).toUpperCase() + String(v).substring(1);
        } else if (f === 'str') {
            return String(v);
        } else if (f === 'int') {
            let result = parseInt(v);
            return isNaN(result) ? 0 : result;
        } else if (f === 'float') {
            let result = parseFloat(v);
            return isNaN(result) ? 0 : result;
        } else {
            throw new Error(`Unknown filter "${f}".`);
        }
    }

    visitAnimRange(node) {
        const type = this.phraseBook['%preamble'].animation || 'bounce';
        return lerp(node.start, node.end, this.t, type);
    }

    interpret() {
        try {
            return this.visit(this.phrase.tree);
        } catch (e) {
            throw new Error(`Line ${this.phrase.lineno}: ${e.message}`)
        }
    }
}

function parsePhrase(phrase, lineno) {
    const lexer = new PhraseLexer(phrase);
    const parser = new PhraseParser(lexer, lineno);
    const tree = parser.parse();
    return tree;
}

function maxLevel(phraseBook) {
    const depth = phraseBook['%preamble'].depth;
    if (depth !== undefined) { return depth; }
    return MAX_LEVEL;
}

function evalPhrase(phraseBook, phrase, globalMemory, localMemory, t=0.0, level=0, startTime=0) {
    if (level > maxLevel(phraseBook)) return '';
    if (TIMEOUT && startTime > 0 && Date.now() - startTime > TIMEOUT_MILLIS) {
        throw new Error('Evaluation timed out. Do you have a recursive function?');
    }
    let interpreter = new Interpreter({ phraseBook, phrase, globalMemory, localMemory, t, level, startTime });
    return interpreter.interpret();
}

function lookupPhrase(phraseBook, key) {
    const v = phraseBook[key];
    if (v === undefined) {
        throw new Error(`Could not find phrase with key "${key}".`);
    }
    console.assert(Array.isArray(v));
    return choice(v);
}

function parsePreamble(preamble, key, value, lineno) {
    if (PREAMBLE_KEYS.indexOf(key) === -1) {
        throw new Error(`Line ${lineno}: unknown '${key}' property in preamble.`);
    }
    if (value === undefined) {
        throw new Error(`Line ${lineno}: no value given for '${key}' property.`);
    }
    value = value.trim();
    if (key === 'depth') {
        if (!value.match(POS_INTEGER_RE)) {
            throw new Error(`Line ${lineno}: expecting integer value for 'depth' property, not '${value}'.`);
        } else {
            preamble[key] = parseInt(value);
        }
    } else if (key === 'duration') {
        let m = value.match(DURATION_RE);
        if (!m || !m[3]) {
            throw new Error(`Line ${lineno}: expecting seconds (e.g. 1s) or milliseconds (e.g. 1000ms) for 'duration' property, not '${value}'.`);
        } else {
            if (m[3] === 'ms') {
                preamble[key] = parseFloat(m[1]) / 1000;
            } else {
                preamble[key] = parseFloat(m[1]);
            }
        }
    } else if (key === 'animation') {
        if (ANIMATION_TYPES.indexOf(value) === -1) {
            throw new Error(`Line ${lineno}: expecting one of bounce/linear/once for 'animation' property, not '${value}'.`);
        } else {
            preamble[key] = value;
        }
    } else if (key === 'script') {
        if (!value.endsWith('.js')) throw new Error(`Line ${lineno}: expecting script preamble to end with .js.`);
        const currentScripts = Array.from(document.head.getElementsByTagName('script'));
        if (currentScripts.some(tag => tag.src === value)) return;
        const tag = document.createElement('script');
        tag.setAttribute('src', value);
        document.head.appendChild(tag);
    }
}

const importedSketches = {};

async function parsePhraseBook(s, loadSketch) {
    const importSketches = [];
    const preamble = {};
    const phrases = [];
    let currentPhrase;
    const lines = s.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        if (line.startsWith('  ')) {
            // Phrases continue with two spaces.
            // This comes first because some of the next rules trim the spaces, which we don't want here.
            if (!currentPhrase) {
                throw new Error(`Line ${ i + 1 }: continuation line without a starting block.`);
            }
            const lastIndex = currentPhrase.values.length - 1;
            if (lastIndex < 0) {
                throw new Error(`Line ${ i + 1 }: continuation line without a previous line.`);
            }
            const lastPhrase = currentPhrase.values[lastIndex];
            console.assert(typeof lastPhrase === 'string');
            currentPhrase.values[lastIndex] = lastPhrase + line.substring(2);
        } else if (trimmedLine[0] === '#') {
            // Ignore comments
            currentPhrase = undefined;
            continue;
        } else if (trimmedLine.length === 0) {
            // Ignore empty lines
            currentPhrase = undefined;
            continue;
        } else if (line.startsWith('%')) {
            // Preamble
            currentPhrase = undefined;
            let m, l = trimmedLine.slice(1).trim();
            if (l.startsWith('import')) {
                m = l.match(IMPORT_RE);
                if (m) {
                    importSketches.push({name: m[1], alias: m[2], line: i + 1});
                    continue;
                } else {
                    throw new Error(`Line ${ i + 1 }: Error in import statement.`);
                }
            }
            m = line.slice(1).match(PREAMBLE_RE);
            if (m) {
                parsePreamble(preamble, m[1], m[2], i + 1);
            }
            else if (trimmedLine.length !== 0) {
                throw new Error(`Line ${ i + 1}: expecting '% value: property' for the preamble.`);
            }
            continue;
        } else if (line.startsWith('- ')) {
            // Phrases are prefixed with '-'.
            if (!currentPhrase) {
                throw new Error(`Line ${ i + 1 }: line without a key.`);
            }
            currentPhrase.values.push(line.substring(2));
            currentPhrase.lines.push(i + 1);
        } else if (trimmedLine.endsWith(':')) {
            // Keys end with ":"
            let parser = new DefParser(new DefLexer(trimmedLine), i + 1);
            currentPhrase = parser.parse();
            currentPhrase.values = [];
            currentPhrase.lines = [];
            currentPhrase.lineno = i + 1;
            phrases.push(currentPhrase);
        } else {
            throw new Error(`Line ${ i + 1 }: do not know what to do with line "${line}".`);
        }
    }

    const imports = {};
    for (let i = 0; i < importSketches.length; i += 1) {
        let o = importSketches[i];
        let sketch;
        if (importedSketches[o.name]) {
            sketch = importedSketches[o.name];
        } else {
            let snap = await loadSketch.download(`sketch/${o.name}`);
            sketch = Object.assign({}, snap.val());
            if (sketch.source === undefined) {
                throw new Error(`Line ${ o.line }: Could not import sketch named "${o.name}".`)
            }
            importedSketches[o.name] = sketch;
        }
        let pb = await parsePhraseBook(sketch.source, loadSketch);
        imports[o.alias] = pb;
    }
    const phraseBook = {};
    for (let phrase of phrases) {
        phraseBook[phrase.key] = phrase.values.map((text, index) => ({text, tree: parsePhrase(text, phrase.lines[index]), lineno: phrase.lines[index]}));
        phraseBook[phrase.key].lineno = phrase.lineno;
        if (phrase.parameters) {
            phraseBook[phrase.key].parameters = phrase.parameters;
        }
    }
    phraseBook['%preamble'] = preamble;
    phraseBook['%imports'] = imports;
    return phraseBook;
}

function generateString(phraseBook, rootKey = 'root', globalMemory = {}, seed = 1234, t = 0.0) {
    Math.seedrandom(seed);
    const startTime = Date.now();
    return evalPhrase(phraseBook, lookupPhrase(phraseBook, rootKey), globalMemory, {}, t, 0, startTime);
}
