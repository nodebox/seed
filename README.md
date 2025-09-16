# Seed

Procedural Content Generator

## Using Seed as a library

Seed both from the [website](https://seed.emrg.be) as well as a JavaScript library. Use it like this:

```html
<script type="module">
    import { parsePhraseBook, generateString } from "https://esm.sh/@ndbx/seed";

    const res = await fetch("your-seed-file.txt");
    const phraseSource = await res.text();

    const phraseBook = await parsePhraseBook(phraseSource);
    const randomSeed = Math.random(); // Or use a fixed value to always get the same outcome
    const output = await generateString(phraseBook, { seed: randomSeed });

    console.log(output);
</script>
```

## Local development

The app runs as a single-page application, so we use [serve](https://www.npmjs.com/package/serve) to always serve the index.html.

    # Only needed the first time
    npm install -g serve

    # Serve as a single-page application
    serve -s

## Deploy

Do this once:

    npm install -g firebase-tools
    firebase login

Do this every time you want to deploy:

    ./deploy.sh

This will copy all the files over to the \_build directory, and a timestamp to the CSS and JS files so we immediately see the latest version.
