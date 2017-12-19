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

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const VARIABLE_TAG_START = '{{';
const VARIABLE_TAG_END = '}}';

const TOKEN_TEXT = 'text';
const TOKEN_REF = 'ref';

const TAG_RE = new RegExp(`(${RegExp.escape(VARIABLE_TAG_START)}.*?${RegExp.escape(VARIABLE_TAG_END)})`);

const NUMBER_RANGE_RE = /^(-?\d+)\.\.(-?\d+)$/;
const CHAR_RANGE_RE = /^(.)\.\.(.)$/;

function evalPhrase(phraseBook, phrase) {
    let s = '';
    for (let token of tokenize(phrase)) {
        if (token.type === TOKEN_TEXT) {
            s += token.text;
        } else {
            let text;
            const m1 = NUMBER_RANGE_RE.exec(token.text)
            const m2 = CHAR_RANGE_RE.exec(token.text)
            if (m1) {
                const min = parseInt(m1[1]);
                const max = parseInt(m1[2]);
                text = Math.floor(rand(min, max));
            } else if (m2) {
                const min = m2[1].charCodeAt(0);
                const max = m2[2].charCodeAt(0);
                const charCode = Math.floor(rand(min, max));
                text = String.fromCharCode(charCode);
            } else {
                const phrase = lookupPhrase(phraseBook, token.text);
                text = evalPhrase(phraseBook, phrase);
                // TODO: apply filters
            }
            s += text;
        }
    }
    return s;
}

class Token {
    constructor(text, type) {
        this.type = type;
        if (this.type === TOKEN_REF) {
            const textWithoutTags = text.substring(2, text.length - 2).trim();
            const textAndFilters = textWithoutTags.split('|');
            this.text = textAndFilters[0];
            // this.filters = textAndFilters.
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
        throw new Error(`Could not find phrase with key "${key}"`);
    }
    console.assert(Array.isArray(v));
    return choice(v);
}

function parsePhraseBook(s) {
    const phrases = [];
    let currentPhrase;
    const lines = s.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line[0] === '#') {
            // Ignore comments
            continue;
        } else if (line.length === 0) {
            // Ignore empty lines
        } else if (line[0] === '-') {
            // Phrases are prefixed with '-'.
            if (!currentPhrase) {
                throw new Error(`${i}: line without a key.`);
            } else {
                currentPhrase.values.push(line.substring(2).trim());
            }
        } else if (line.endsWith(':')) {
            // Keys end with ":"
            currentPhrase = { key: line.substring(0, line.length - 1), values: [] };
            phrases.push(currentPhrase);
        } else {
            throw new Error(`${i}: do not know what to do with line "${line}".`);
        }
    }
    const phraseBook = {};
    for (let phrase of phrases) {
        phraseBook[phrase.key] = phrase.values;
    }
    return phraseBook;
}

function generateString(phraseBook, rootKey = 'root', seed = 1234) {
    return evalPhrase(phraseBook, lookupPhrase(phraseBook, rootKey));
}
