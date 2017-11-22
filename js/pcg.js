VARIABLE_TAG_START = '{{';
VARIABLE_TAG_END = '}}';

const TOKEN_TEXT = 'text';
const TOKEN_REF = 'ref';

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const TAG_RE = new RegExp(`(${RegExp.escape(VARIABLE_TAG_START)}.*?${RegExp.escape(VARIABLE_TAG_END)})`);

function evalPhrase(phraseBook, phrase) {
    let s = '';
    for (let token of tokenize(phrase)) {
        if (token.type === TOKEN_TEXT) {
            s += token.text;
        } else {
            const phrase = lookupPhrase(phraseBook, token.text);
            const text = evalPhrase(phraseBook, phrase);
            s += text; // TODO: apply filters
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

function choice(l) {
    const index = Math.floor(Math.random() * l.length);
    return l[index];
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
