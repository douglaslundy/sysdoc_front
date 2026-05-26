# Design — Abas do Dashboard no Sistema de Permissões

**Data:** 2026-05-26
**Status:** Aprovado

---

## Problema

O dashboard analítico tem 7 abas (Início, Vigilância Sanitária, Laboratório, Fila, TFD, Farmácia, Logs/QR). Hoje todas as abas aparecem para qualquer usuário autenticado que tenha acesso a `/dashboard`. A proteção de backend é feita via Gates hardcoded em `AuthServiceProvider` (perfis fixos no código). Não há controle granular por perfil configurável via UI.

---

## Objetivo

- Cada aba do dashboard entra no sistema de permissões existente (`SystemPage` + `profile_page_permissions`)
- O admin configura quais abas cada perfil pode ver pela tela de "Perfis de Acesso" (sem UI nova)
- Abas sem permissão não aparecem na aba de navegação nem no conteúdo
- Proteção de backend unificada com o mesmo banco, sem perfis hardcoded

---

## Arquitetura

### Modelo de dados (sem schema novo)

Reutiliza as tabelas existentes:

| Tabela | Papel |
|--------|-------|
| `system_pages` | Registro de cada aba como página do sistema |
| `page_categories` | Categoria "Dashboard" para agrupar as abas na UI de perfis |
| `profile_page_permissions` | Pivot: qual perfil acessa qual aba |

### Paths registrados

| path | titulo | icone |
|------|--------|-------|
| `/dashboard/inicio` | Dashboard - Início | `home` |
| `/dashboard/vigilancia` | Dashboard - Vigilância Sanitária | `shield` |
| `/dashboard/laboratorio` | Dashboard - Laboratório | `thermometer` |
| `/dashboard/fila` | Dashboard - Fila | `list` |
| `/dashboard/tfd` | Dashboard - TFD | `send` |
| `/dashboard/farmacia` | Dashboard - Farmácia | `package` |
| `/dashboard/logs` | Dashboard - Logs/QR | `eye` |

---

## Backend

### 1. Seeder: `DashboardTabPageSeeder`

- Cria (ou atualiza via `updateOrInsert`) a categoria "Dashboard" em `page_categories`
- Insere os 7 registros em `system_pages` com `categoria = 'Dashboard'`
- Permissões iniciais via seeder:
  - `admin` → todas as 7 abas
  - `user` → Início, Vigilância, Laboratório, Fila, TFD, Farmácia (sem Logs)
  - `manager` → Início, Vigilância, Laboratório, Fila, TFD, Farmácia (sem Logs)
- Seeder é idempotente (`updateOrInsert`); pode ser re-executado sem duplicar dados

### 2. `AuthServiceProvider` — substituir Gates hardcoded

Gates atuais (`dashboard-laboratorio`, `dashboard-fila`, `dashboard-tfd`, `dashboard-logs`) são reescritos para consultar `PagePermissionService`:

```php
Gate::define('dashboard-laboratorio', fn ($user) =>
    app(PagePermissionService::class)->canAccess($user, '/dashboard/laboratorio')
);
// idem para os demais
```

- Rotas em `api.php` **não mudam** — continuam com `->middleware('can:dashboard-*')`
- Gates para abas sem middleware de rota (`inicio`, `vigilancia`, `farmacia`) não precisam ser criados — a proteção frontend é suficiente; o conteúdo dessas rotas não retorna dados sensíveis

### 3. `myPermissions` — sem alteração

O endpoint `GET /access-profiles/my-permissions` já retorna todos os paths do perfil do usuário. Com os novos `system_pages` cadastrados e atribuídos ao perfil, `/dashboard/laboratorio` etc. passarão a aparecer no array retornado automaticamente.

---

## Frontend

### `pages/dashboard.js`

**Mudança:** adicionar `permission` a cada item de `ABAS` e filtrar pelo `AuthContext`.

```js
const ABAS = [
  { label: 'Início',               permission: '/dashboard/inicio',      component: <InicioDashboard /> },
  { label: 'Vigilância Sanitária', permission: '/dashboard/vigilancia',  component: <VigilanciaDashboard /> },
  { label: 'Laboratório',          permission: '/dashboard/laboratorio', component: <LabDashboard /> },
  { label: 'Fila',                 permission: '/dashboard/fila',        component: <FilaDashboard /> },
  { label: 'TFD',                  permission: '/dashboard/tfd',         component: <TfdDashboard /> },
  { label: 'Farmácia',             permission: '/dashboard/farmacia',    component: <FarmaciaDashboard /> },
  { label: 'Logs/QR',             permission: '/dashboard/logs',        component: <LogsDashboard /> },
];
```

**Lógica de filtro:**

```js
const { myPermissions, profile } = useContext(AuthContext);
const abasVisiveis = profile === 'admin'
  ? ABAS
  : ABAS.filter(a => myPermissions.includes(a.permission));
```

**Aba selecionada padrão:** índice `0` relativo ao array `abasVisiveis`.

**Sem abas visíveis:** exibe mensagem "Nenhuma aba disponível para seu perfil. Entre em contato com o administrador."

**Tabs e conteúdo** renderizam a partir de `abasVisiveis` — uma única filtragem controla tanto o "menu topo" (barra de tabs) quanto o painel de conteúdo.

---

## Tela de Perfis de Acesso — sem mudança de código

As 7 novas `system_pages` com `categoria = 'Dashboard'` aparecem automaticamente na tela de "Perfis de Acesso" sob um grupo "Dashboard". O admin pode marcar/desmarcar cada aba por perfil sem nenhuma mudança de UI.

---

## Fluxo completo

```
Admin abre "Perfis de Acesso"
  → vê grupo "Dashboard" com 7 checkboxes
  → marca/desmarca abas por perfil
  → salva

Usuário faz login
  → AuthContext chama GET /access-profiles/my-permissions
  → recebe paths incluindo ex: ["/dashboard", "/dashboard/inicio", "/dashboard/laboratorio"]

Usuário acessa /dashboard
  → dashboard.js filtra ABAS por myPermissions
  → só renderiza tabs e painéis autorizados

Usuário tenta chamar GET /api/dashboard/laboratorio sem permissão
  → Gate 'dashboard-laboratorio' consulta PagePermissionService
  → retorna 403
```

---

## Tratamento de erros

- `permissionsLoaded = false`: dashboard aguarda (spinner já existente no `AuthGuard`)
- `myPermissions` vazio ou sem abas permitidas: mensagem inline no dashboard
- Admin: bypass completo (profile === 'admin')

---

## O que NÃO muda

- Schema do banco (sem novas tabelas ou colunas)
- Tela de "Perfis de Acesso"
- `AccessProfileController`
- `PagePermissionService`
- `myPermissions` endpoint
- Rotas em `api.php` (só `AuthServiceProvider` muda)
