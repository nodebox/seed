# Repository Guidelines

## Project Structure & Module Organization
- Root contains `index.html` and `embed.html`. App code lives in `js/` (`core.js`, `editor.js`), styles in `css/` (`style.css`, `codemirror.css`), static images in `gallery/`, and third‑party bundles in `third_party/`. Reference docs/examples are under `_docs/`.
- Build artifacts are written to `_build/` by `deploy.sh` and are not committed.

## Build, Test, and Development Commands
- Local serve: `npm install -g serve` (first run), then `serve -s` to serve the SPA (open the printed localhost URL).
- Deploy: `npm install -g firebase-tools && firebase login` (once), then `./deploy.sh`. The script copies assets to `_build/`, appends cache‑busting timestamps to `.js/.css` in `index.html`, and runs `firebase deploy`.
- Clean build (usually unnecessary): `rm -rf _build && ./deploy.sh`.

## Coding Style & Naming Conventions
- JavaScript: ES6, 4‑space indent, semicolons. Prefer `const`/`let`, small pure helpers, and clear names. Functions `camelCase`; constants UPPER_SNAKE when shared. Filenames are lowercase with short words (e.g., `core.js`, `style.css`).
- CSS: 4‑space indent; keep variables under `:root`; group component blocks and use concise class names.
- No transpile/lint step—match existing style so code runs directly in modern browsers.

## Testing Guidelines
- No automated tests currently.
- Before submitting: run `serve -s`, navigate through routes (e.g., `/sketch`), try gallery links, and ensure no console errors.

## Commit & Pull Request Guidelines
- Commits: short imperative subject (e.g., "Fix scrolling for long projects"), optional body for context. Keep changes focused.
- PRs: include a clear description, linked issues, and screenshots/GIFs for UI changes. Call out behavior or config changes (e.g., Firebase rules/hosting). Ensure local checks above pass.

## Security & Configuration Tips
- Do not commit secrets. Firebase configuration is in `firebase.json`/`.firebaserc`, and `index.html` references only the database URL.
- `_build/` is generated; avoid committing it. Prefer small, reviewable diffs.
