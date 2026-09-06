# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sysdoc** is a monorepo containing a full-stack document management and customer service system. It has two sub-projects:

- `sysdoc_back/` — Laravel 10 REST API (PHP 8.1+, MySQL)
- `sysdoc_front/` — Next.js 12 frontend (React 17, Redux Toolkit, MUI v5)

Frontend is deployed on Vercel (`sysvendas.vercel.app`); backend is hosted at `dlsistemas.com.br`.

---

## Token-Efficient Development Policy

Goal: maximize useful, correct work per token spent. This governs *exploration, research, and communication overhead* — never correctness or verification.

**Non-negotiable exemption — always full-cost, no shortcuts:**
- Running a full test suite before calling any implementation done.
- The subagent-driven-development skill's task-level review, final whole-branch review, and independent re-verification of every subagent's report (never trust a self-reported PASS — re-run it yourself).
- Any security-, data-integrity-, or destructive-operation-relevant check.
- This project's history has real, expensive bugs (a PHI access-control bypass, a silent permission-wipe, a data-loss migration bug) that were caught *only* because of full verification — token savings never override this.

**Everywhere else, default to minimum-sufficient context:**
- Search/grep for the specific symbol or line range before reading a whole file. Read the whole file when: (a) you're about to rewrite or restructure a meaningful part of it, (b) it's short enough that a full read costs about the same as a targeted search (roughly under 250 lines), or (c) the edit's correctness depends on surrounding control/data flow, not just the target line. Otherwise, grep for the symbol first.
- Reuse what this session already established — don't reread an unchanged file or redo a search whose answer is already known and still valid.
- Prefer diffs over rereading a file you just edited; prefer targeted single-test runs over the full suite while iterating (the full suite still runs before marking a task done, per the exemption above).
- When dispatching a subagent, give it only the context its task needs (never the whole conversation history). If a dispatch prompt is about to include more than roughly one file's worth of pasted background, stop — point to a file/ledger entry instead of pasting it. Require a structured return: conclusion, essential evidence, affected files/lines, remaining risks — not a full transcript.
- Compress a finished investigation into a short conclusion (cause / evidence / affected / decision / remaining risk) instead of carrying the raw exploration forward.
- Routine status updates: 1-3 sentences, no restated context. Full detail only when reporting a finding that requires a human decision (a bug, a ruling, a scope question) or documenting something for the ledger.
- Stop investigating when either: (a) you can cite the specific line(s)/behavior that directly answers the question, or (b) two independent signals agree (e.g., the code and a passing test, or two different searches). If the next read would not change your decision, stop.

If token economy and correctness ever genuinely conflict, correctness wins.

---

## Backend (sysdoc_back)

### Commands

```bash
composer install
php artisan serve          # API at localhost:8000
php artisan migrate
php artisan db:seed

./vendor/bin/phpunit                             # All tests
./vendor/bin/phpunit tests/Feature/SomeTest.php # Single test file
./vendor/bin/pint                                # Format code
./vendor/bin/pint --test                         # Check formatting only

npm run dev        # Compile assets (Laravel Mix)
npm run production
```

### Architecture

- **Auth:** Laravel Sanctum guards + `tymon/jwt-auth`. Protected routes use `middleware(['auth:sanctum'])`. JWT secret lives in `.env` (`JWT_SECRET`).
- **Validation:** All request validation is in dedicated `App\Http\Requests\*Request` classes — never inline in controllers.
- **Logging:** A `LogUserAction` middleware automatically logs all authenticated requests to the `logs` table.
- **AI Documents:** `LetterController` and `OrdinanceController` call OpenAI directly (via `openai-php/client`), not through a service abstraction. Config is in `config/openai.php`.
- **Atomic operations:** `ClientController` wraps client + address creation in `DB::transaction()`.
- **No soft deletes:** Deleted/inactive records use a boolean `active` field instead of `deleted_at`.
- **Public endpoints:** Queue location logging (`/public-queue-log`) accepts UUID-identified requests without auth.

### Database Conventions

Table names use underscore separation (`call_services`, `qr_code_logs`). FKs follow mixed naming: some use `id_client` style, others use `user_id`. Timestamps (`created_at`/`updated_at`) are present on most tables.

---

## Frontend (sysdoc_front)

### Commands

```bash
npm install
npm run dev    # Dev server at localhost:3000

npm run build
npm run start

npm test                                         # Jest watch mode
npm test -- --testNamePattern="name" --watch=false  # Single test
```

### Environment

```
NEXT_PUBLIC_API_URL=https://dlsistemas.com.br/api
METABASE_JWT_SHARED_SECRET=...
METABASE_SITE_URL=https://mb.dlsistemas.com.br
```

For local development, set `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.

### Architecture

- **State:** Redux Toolkit with a "ducks" pattern — each feature has `src/store/ducks/<feature>/` (slice + reducers) and `src/store/fetchActions/<feature>/` (async thunks). There are ~18 feature slices.
- **API client:** Single Axios instance in `src/services/api.js` adds `Authorization: Bearer {token}` to every request automatically.
- **Auth flow:** JWT token is stored in a cookie (`sysvendas.token`) via `nookies`. On app load, `AuthContext` validates the token against the `/validate` endpoint. Token is cleared on logout.
- **Provider stack in `_app.js`:** Redux `Provider` → `AuthProvider` → `CustomThemeProvider` → MUI `CacheProvider`. Order matters.
- **Forms:** Custom masked input components in `src/components/inputs/` handle CPF, phone, and currency formatting.
- **Reports:** Export functionality lives in `src/reports/`, separate from components.
- **Metabase:** Business intelligence dashboards are embedded via JWT-authenticated iframes.
