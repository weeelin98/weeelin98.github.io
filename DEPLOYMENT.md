# GitHub Pages deployment

Repository: https://github.com/weeelin98/weeelin98.github.io

Website: https://weeelin98.github.io/

Local production build and all automated check scripts passed. The GitHub Actions
workflow checks and publishes each push to `main`. GitHub Pages is enabled with
GitHub Actions as its publishing source.

## Publishing updates

Commit reviewed changes and push `main` to `origin`. Watch the Deploy to GitHub
Pages workflow in the repository's Actions tab and verify the published URL.

The workflow runs the checks, builds with Vite, and publishes only `dist/`.
The existing relative base and local font URLs support both root and project paths.
Future pushes to `main` deploy automatically.

## Next development session

Keep the completed city as the baseline. The six content entrances are configured
in `src/content.js`: About Me, CV, Projects, Memo, Contact Me, and Notes. About Me
opens `about.html`; Projects and Contact use its sections and CV opens the supplied
PDF. Memo and Notes remain placeholders. The shared dock's first icon is Home,
returning to the city, and Experience opens the profile's experience section.

Run `npm run dev -- --port 5173` for local development and `npm run check` plus
`npm run build` before publishing changes.
