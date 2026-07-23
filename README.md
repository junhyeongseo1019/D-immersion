# D-immersion

> University research-life companion — papers + lab meetings in one app.

A static web prototype for graduate students. Two tabs:

- **Papers** — save papers, AI auto-classifies them into one of three projects
  (EGaIn/PDMS, Wearable Cooling, 4D Printing), track read status.
- **Lab Meeting** — five weeks of meetings, week-chip navigation, per-student
  mini list with progress, "note upload" flow that simulates AI analysis to
  produce per-student summary / highlights / challenges / supervisor feedback.
  Drill into any student to see weekly history.

## Live demo

`https://<your-github-username>.github.io/d-immersion/` (after GitHub Pages is enabled — see below).

## Run locally

```bash
cd my-app
python -m http.server 8000
# open http://127.0.0.1:8000
```

Any static file server works (`npx serve`, `php -S`, etc.) — there is no
backend, no build step. Just open `index.html`.

## Project structure

```
my-app/
├── index.html             entry
├── styles.css             Toss-style light theme
├── app.js                 tab switching, paper/meeting rendering
├── data.js                mock data: team, projects, papers, meetings
├── platform.js            host API shim (AI-HUB compatible; harmless otherwise)
├── storage-adapter.js     in-memory + (optional) BaaS storage adapter
├── plugin.json            manifest for the AI-HUB static-app platform
├── manifest.json          PWA manifest
└── assets/
    ├── logo-wordmark.png  D-IMMERSION wordmark
    └── dalgu.png          DGIST mascot
```

## Deploy to GitHub Pages

1. Create a new (public) repo on GitHub, e.g. `d-immersion`.
2. Push this folder as the repo root.
3. On the repo page: **Settings → Pages → Build and deployment → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save**.
4. Wait ~1 minute. Visit `https://<username>.github.io/d-immersion/`.

That's it. No build step, no CI, no actions.

## License

Internal prototype — research project. No public license declared.
