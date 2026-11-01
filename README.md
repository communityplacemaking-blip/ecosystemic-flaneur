# The Ecosystemic Flâneur / המשוטט האקוסיסטמי

The public home of the Ecosystemic Flâneur wandering methodology. It is a developing practice, not a validated theory.

Site: https://communityplacemaking-blip.github.io/ecosystemic-flaneur/ (GitHub Pages, `main`, root).

**How the pages are made (since 1.11.2026, One World design).** The public pages are generated. Their content sources live in `_source/` (one `index.html` per page). To change a text, edit it in `_source/`, then run `python3 preview/one-world/_build/build.py --live` and commit both. Never hand-edit the generated pages at the root, because the next build overwrites them. The world's scripts and styles are copied into `/assets/`; their sources are in `preview/one-world/assets/`. Without `--live` the same build refreshes `/preview/one-world/`. `/preview/worlds/` is a frozen earlier study: do not rebuild it.

- `index.html`: main page. How the ecosystemic view, the five life insights, the seven movements, the two modes and the tools fit together.
- `method/`: the deeper methodology page.
- `library/`: design prototype of the knowledge library (repository A ideas, repository B participatory tools, C journey templates). `library/ideas-snapshot.js` is a read-only display copy of the 25 Stage 2 records; the Stage 2 library itself lives on its own branch.
- `mechanism/`: the Wanderer, version B (preferred). `mechanism/a/`: version A, archived original. Never hand-edit either (B's source is `_source/mechanism/index.html`).
- `archive/`, `landing/`: earlier versions; `/landing/` redirects to `/`.
- `updates/latest.md`: the current status of the work, rewritten at each update.
