---
name: run-sysvendas-front
description: Run, start, test, screenshot, or smoke-test the sysvendas_front Next.js frontend. Use when asked to launch the frontend, verify pages, confirm UI changes work, or check that authentication flows render correctly.
---

# run-sysvendas-front

Next.js 12 frontend for the Sysdoc system (SysDoc - Controle de Documentos). Driven by `curl`-based smoke tests in `.claude/skills/run-sysvendas-front/smoke.sh`. Pages are SSR so HTML is inspectable without a browser.

All commands below were verified on this machine (Node v24, Windows 11). Run from the workspace root (`C:\Users\dougl\workspace`).

---

## Prerequisites

- Node.js v24 in PATH (`node --version`)
- `yarn` or `npm` installed
- Dependencies installed: `yarn install` (or `npm install`)

## Setup

No `.env` file is required for local dev — the app reads `NEXT_PUBLIC_API_URL` from the environment at build time. For local development pointing at the Laravel backend:

```bash
# Set before starting dev server if backend is on 8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev
```

Without it, the frontend uses `undefined` as the API URL and all API calls fail — but pages still render.

## Run (agent path)

Start the dev server in the background, then run the smoke script:

```bash
# From workspace root
npm run dev &
sleep 10   # Next.js takes ~8s to compile on first boot
bash .claude/skills/run-sysvendas-front/smoke.sh
```

Smoke script checks: `/` redirects → `/login` renders (200) → CPF input present → `__NEXT_DATA__` present → page title "SysDoc" → webpack chunk loads → `/esqueci-senha` renders.

### Inspecting a specific page

```bash
# Get server-rendered HTML of any page
curl -s http://localhost:3000/login | grep -o '<title>[^<]*</title>'

# Check HTTP status without body
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/clients
```

### Pages that require auth

All dashboard pages (`/dashboard`, `/clients`, `/users`, etc.) redirect to `/login` when there's no valid `sysvendas.token` cookie. That's a 307 — expected behavior, not a bug.

## Run (human path)

```bash
npm run dev
# App at http://localhost:3000
# Ctrl-C to stop
```

## Tests

```bash
npm test                                         # Jest watch mode
npm test -- --watchAll=false                     # Single run
npm test -- --testNamePattern="name" --watch=false  # Single test
```

## Gotchas

- **`src/components/monitor-aps/VisitaDetalheModal.js` has a syntax error.** "Expected unicode escape" from the SWC compiler. Any page that imports this component returns 500. The smoke script avoids these pages intentionally. To fix before testing monitor-aps pages, check that file for a unicode character (likely a `—` em-dash or similar) in a JSX context that SWC misparses.
- **First boot takes ~8–10s.** Next.js compiles pages on demand. The first `curl` to any unvisited page adds another ~2s compile time. If the smoke script hits `/login` during an active recompile (e.g., triggered by navigating to a broken page first), it may get 500. Wait 2–3 seconds and retry — it clears itself.
- **`/` always redirects (307) to `/dashboard`.** This is intentional SSR redirect in `pages/index.js`. A 307 is success here, not an error.
- **Auth pages redirect to `/login` with 307.** Protected pages check the `sysvendas.token` cookie server-side. `curl` has no cookie so it always gets 307 from protected routes.
- **`NEXT_PUBLIC_API_URL` baked at compile time.** Changing it after startup requires restarting the dev server.
- **Port 3000 may be in use.** Next.js auto-increments to 3001, 3002, etc. The smoke script defaults to 3000; pass the actual port as arg: `bash .claude/skills/run-sysvendas-front/smoke.sh 3001`

## Troubleshooting

| Symptom | Fix |
|---|---|
| `EADDRINUSE 3000` | `npm run dev` picks next free port automatically, check output for actual port. |
| Smoke script `/ redirects` fails | Server not up yet. Increase sleep to 15s or check if port differs from 3000. |
| Pages return blank HTML body | Dev server compiled but React hydration failed. Check terminal for `error TS` or missing module. |
| `Module not found` on startup | Run `yarn install` — lock file may be out of sync after a dependency change. |
