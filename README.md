# Seed

Procedural Content Generator


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

This will copy all the files over to the _build directory, and a timestamp to the CSS and JS files so we immediately see the latest version.
