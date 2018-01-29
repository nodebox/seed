function rand(min, max) {
    return min + Math.random() * (max - min);
}

function choice(l) {
    const index = Math.floor(Math.random() * l.length);
    return l[index];
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

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

const VARIABLE_TAG_START = '{{';
const VARIABLE_TAG_END = '}}';

const TOKEN_TEXT = 'text';
const TOKEN_REF = 'ref';

const TAG_RE = new RegExp(`(${RegExp.escape(VARIABLE_TAG_START)}.*?${RegExp.escape(VARIABLE_TAG_END)})`);

const NUMBER_RANGE_RE = /^(-?\d+(\.\d+)?)\.\.(-?\d+(\.\d+)?)$/;
const ANIMATION_RANGE_RE = /^(-?\d+(\.\d+)?)-(-?\d+(\.\d+)?)$/;
const CHAR_RANGE_RE = /^(.)\.\.(.)$/;
const AMOUNT_RE = /^(.*?)\s*\*\s*(\d+)$/;

const MAX_LEVEL = 50;
const TIMEOUT_MILLIS = 1000;

function bounce(t) {
    const a = t * Math.PI * 2;
    return 0.5 - Math.cos(a) * 0.5;
}

function lerp(min, max, t) {
    t = bounce(t);
    return min + t * (max - min);
}

function evalPhrase(phraseBook, phrase, memory, t=0.0, level=0, startTime=0) {
    if (level > MAX_LEVEL) return '';
    if (startTime > 0 && Date.now() - startTime > TIMEOUT_MILLIS) {
        throw new Error('Evaluation timed out. Do you have a recursive function?');
    }
    let s = '';
    for (let token of tokenize(phrase)) {
        if (token.type === TOKEN_TEXT) {
            s += token.text;
        } else {
            let dvar;
            if (token.variable) {
                dvar = token.text + ':' + token.variable;
            }
            for (let i = 0; i < token.amount; i++) {
                let text;
                if (dvar && memory[dvar]) {
                    text = memory[dvar];
                    text = applyFilters(text, token.filters);
                } else {
                    const m1 = NUMBER_RANGE_RE.exec(token.text)
                    const m2 = CHAR_RANGE_RE.exec(token.text)
                    const m3 = ANIMATION_RANGE_RE.exec(token.text)
                    if (m1) {
                        const min = parseFloat(m1[1]);
                        const max = parseFloat(m1[3]);
                        text = Math.floor(rand(min, max));
                    } else if (m2) {
                        const min = m2[1].charCodeAt(0);
                        const max = m2[2].charCodeAt(0);
                        const charCode = Math.floor(rand(min, max));
                        text = String.fromCharCode(charCode);
                    } else if (m3) {
                        const min = parseFloat(m3[1]);
                        const max = parseFloat(m3[3]);
                        text = lerp(min, max, t);
                    } else {
                        const phrase = lookupPhrase(phraseBook, token.text);
                        text = evalPhrase(phraseBook, phrase, memory, t, level + 1, startTime);
                        if (dvar) {
                            memory[dvar] = text;
                        }
                        text = applyFilters(text, token.filters);
                    }
                }
                s += text;
            }
        }
    }
    return s;
}

class Token {
    constructor(text, type) {
        this.type = type;
        if (this.type === TOKEN_REF) {
            let amount = 1
            let textWithoutTags = text.substring(2, text.length - 2).trim();
            const m = AMOUNT_RE.exec(textWithoutTags);
            if (m) {
                textWithoutTags = m[1];
                amount = parseInt(m[2]);
            }
            const textAndFilters = textWithoutTags.split('|');
            textWithoutTags = textAndFilters[0];
            const textAndVar = textWithoutTags.split(':');
            this.text = textAndVar[0];
            if (textAndVar[1]) {
                this.variable = textAndVar[1];
            }
            this.amount = amount;
            this.filters = textAndFilters.slice(1);
        } else {
            this.text = text;
        }
    }
}

function tokenize(phrase) {
    const result = [];
    let inTag = false;
    const parts = phrase.split(TAG_RE);
    let type;
    for (let part of parts) {
        if (part) {
            if (inTag) {
                type = TOKEN_REF;
            } else {
                type = TOKEN_TEXT;
            }
            result.push(new Token(part, type));
        }
        inTag = !inTag;
    }
    return result;
}

function lookupPhrase(phraseBook, key) {
    const v = phraseBook[key];
    if (v === undefined) {
        throw new Error(`Could not find phrase with key "${key}".`);
    }
    console.assert(Array.isArray(v));
    return choice(v);
}

function parsePhraseBook(s) {
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
        } else if (line.startsWith('- ')) {
            // Phrases are prefixed with '-'.
            if (!currentPhrase) {
                throw new Error(`Line ${ i + 1 }: line without a key.`);
            }
            currentPhrase.values.push(line.substring(2));
        } else if (trimmedLine.endsWith(':')) {
            // Keys end with ":"
            currentPhrase = { key: trimmedLine.substring(0, trimmedLine.length - 1), values: [] };
            phrases.push(currentPhrase);
        } else {
            throw new Error(`Line ${ i + 1 }: do not know what to do with line "${line}".`);
        }
    }
    const phraseBook = {};
    for (let phrase of phrases) {
        phraseBook[phrase.key] = phrase.values;
    }
    return phraseBook;
}

function generateString(phraseBook, rootKey = 'root', memory = {}, seed = 1234, t = 0.0) {
    Math.seedrandom(seed);
    const startTime = Date.now();
    return evalPhrase(phraseBook, lookupPhrase(phraseBook, rootKey), memory, t, 0, startTime);
}
