# Repository Guidelines

## Project Structure & Module Organization

The root hosts `index.html` and `embed.html` while app logic lives in `js/` (`core.js`, `editor.js`). Shared styles sit in `css/` (`style.css`, `codemirror.css`); static art belongs in `gallery/`; third-party bundles stay under `third_party/`. Generated assets land in `_build/` via `deploy.sh` and must not be committed. Reference docs and examples reside in `_docs/`.

## Build, Test, and Development Commands

Install the static server once with `npm install -g serve`, then run `serve -s` from the repo to preview the SPA locally. Deployment uses `./deploy.sh`, which stages files into `_build/`, appends cache-busting timestamps in `index.html`, and calls `firebase deploy`. For a clean rebuild run `rm -rf _build && ./deploy.sh` (usually unnecessary).

## Coding Style & Naming Conventions

JavaScript follows ES6 with 4-space indentation, semicolons, and `const`/`let`. Prefer narrow helpers, camelCase functions, and uppercase shared constants. CSS uses 4-space indentation, variables grouped in `:root`, and concise class names. Filenames are lowercase with short words (e.g., `core.js`, `style.css`). There is no transpilation or linting, so match the existing browser-ready style.

## Testing Guidelines

Automated tests are not in place. Before handing off changes, launch `serve -s`, walk through main routes such as `/sketch`, exercise gallery entries, and confirm the browser console stays clean.

## Commit & Pull Request Guidelines

Write commit subjects in the imperative mood (e.g., "Fix scrolling for long projects") with optional context bodies. Keep diffs focused and avoid touching `_build/`. Pull requests should describe the change, link issues, and include screenshots or GIFs for UI updates, plus note any configuration shifts like Firebase hosting changes.

## Security & Configuration Tips

Do not commit secrets. Firebase settings live in `firebase.json` and `.firebaserc`; runtime config references only the database URL from `index.html`. Treat `_build/` as disposable output.
