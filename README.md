# Seed

Procedural Content Generator


## Local development

The app runs as a single-page application, so we use [serve](https://www.npmjs.com/package/serve) to always serve the index.html.

    # Only needed the first time
    npm install -g serve

    # Serve as a single-page application
    serve -s

## Deploy

    npm install -g firebase-tools
    firebase login
    firebase deploy
