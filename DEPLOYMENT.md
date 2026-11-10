# GitHub Pages deployment

Repository: https://github.com/weeelin98/weeelin98.github.io

Website: https://weeelin98.github.io/

Local production build and all eight check scripts passed. The GitHub Actions
workflow checks and publishes each push to `main`. Initial publication is in progress.

## Initial setup

1. Sign in locally with `gh auth login`.
2. Choose the target repository. A repository named `<username>.github.io` serves
   at `https://<username>.github.io/`; another name serves at a project subpath.
3. Initialize this folder as a Git repository on `main`, review the source files,
   and push them to the chosen remote. Do not overwrite an existing site's history.
4. In the repository's Settings > Pages, choose GitHub Actions as the source.
5. Watch the Deploy to GitHub Pages workflow and verify the published URL.

The workflow runs the checks, builds with Vite, and publishes only `dist/`.
The existing relative base and local font URLs support both root and project paths.
Future pushes to `main` deploy automatically.

## Next development session

Keep the completed city as the baseline. The six content entrances are configured
in `src/content.js`: About Me, CV, Projects, Memo, Contact Me, and Notes. They still
use placeholder content; Notes is marked coming-soon. Real content and destination
pages remain to be developed.

Run `npm run dev -- --port 5173` for local development and `npm run check` plus
`npm run build` before publishing changes.
