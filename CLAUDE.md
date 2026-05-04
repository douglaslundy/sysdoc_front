# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sysdoc** is a monorepo containing a full-stack document management and customer service system built for Jr Ferragens. It has two sub-projects:

- `sysdoc_back/` — Laravel 10 REST API (PHP 8.1+, MySQL)
- `sysdoc_front/` — Next.js 12 frontend (React 17, Redux Toolkit, MUI v5)

Frontend is deployed on Vercel (`sysvendas.vercel.app`); backend is hosted at `dlsistemas.com.br`.

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
