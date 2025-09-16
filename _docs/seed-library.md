# Using Seed as a JavaScript Library

Seed can be used as a standard JavaScript library, either by installing it using `npm install @ndbx/seed` or even without a build step, using [esm.sh](https://esm.sh/).

## Quick start with a static string

```html
<script type="module">
import { parsePhraseBook, generateString } from 'https://esm.sh/@ndbx/seed';

const phraseSource = `
root:
- Hello {{ who }}!

who:
- world
- Seed users
`.trim();

const phraseBook = await parsePhraseBook(phraseSource);
const output = await generateString(phraseBook);

console.log(output);
</script>
```

## Loading from a `.txt` seed file

```html
<script type="module">
import { parsePhraseBook, generateString } from 'https://esm.sh/@ndbx/seed';

const response = await fetch('seed-example.txt');
const phraseSource = await response.text();

const phraseBook = await parsePhraseBook(phraseSource);
const output = await generateString(phraseBook);

console.log(output);

</script>
```

Store reusable seeds as `.txt` files served from the same origin so `fetch` succeeds. Read more about [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).
