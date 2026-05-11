# Prompt para retomada de sessão — Sysdoc

## Contexto do projeto
Sysdoc — sistema de gestão para Jr Ferragens.
- Backend: `C:\Users\dougl\workspace\sysdoc_back\` — Laravel 10, MySQL, Sanctum+JWT
- Frontend: `C:\Users\dougl\workspace\sysdoc_front\` — Next.js 12, React 17, Redux Toolkit, MUI v5
- Arquivos de controle: `C:\Users\dougl\workspace\TASK_STATE.md`, `TASK_TODO.md`, `TASK_DECISIONS.md`, `HANDOFF.md`

## Estado atual (2026-05-11 — após 6ª sessão)
Todas as fases A–N foram implementadas e commitadas. Código 100% pronto. Blocker apenas operacional.

**Último commit backend:** `845a784` — auditoria completa em todos os controllers
**Último commit frontend:** `b74e89a` — endpoint após ação VIEW/VIEW_REPORT na auditoria

## Pendências críticas em produção
```bash
php artisan migrate --force        # inclui trigger pedido liberado + VARCHAR audit_logs (CRÍTICA)
php artisan db:seed --class=AccessProfileSeeder --force
php artisan cache:forget dashboard.laboratorio
```

A migration mais crítica é `2026_05_10_400000_alter_audit_logs_action_to_varchar` — sem ela, os logs de VIEW, VIEW_REPORT, LIBERAR e DOWNLOAD não são gravados em produção.

## Cobertura de auditoria atual (100%)

| Ação | Controller/Local |
|---|---|
| LOGIN | AuthController::login() |
| LOGOUT | LogUserAction middleware |
| CREATE | Todos os 15 controllers relevantes |
| UPDATE | Todos os 15 controllers relevantes |
| DELETE | Todos os 15 controllers + PedidoExameObserver::forceDeleted() |
| VIEW | ResultadoExame, Client, PedidoExame, Queue (via show()) |
| VIEW_REPORT | ClientController::detailedClientReport() |
| DOWNLOAD | ResultadoExameController::downloadPdf() |
| LIBERAR | ResultadoExameController::liberar() |

## Módulos implementados — referência rápida

| Módulo | Arquivo principal | Status |
|---|---|---|
| Cascade delete pedidos | `PedidoExameController::destroy()` → `forceDelete()` | ✓ |
| Bloco Exames client_report | `client_report/index.js` + `Client::pedidosExame()` | ✓ |
| Auditoria VIEW fila | `QueueController::show()` + `viewQueueFetch` | ✓ |
| Auditoria VIEW pedido | `PedidoExameController::show()` + `viewPedidoFetch` | ✓ |
| Auditoria VIEW cliente | `ClientController::show()` + `viewClientFetch` | ✓ |
| Auditoria LIBERAR/DOWNLOAD | `ResultadoExameController::liberar/downloadPdf` | ✓ |
| Auditoria CREATE/UPDATE/DELETE | Todos os controllers (Fase N) | ✓ |
| Página auditoria | `auditoria/index.js` + `AuditLogController` | ✓ |
| Toggle e-mail lab | `LabConfigController` + `pages/laboratorio/configuracoes` | ✓ |
| Gauge dashboard lab | `LabDashboard.js` ApexCharts radialBar | ✓ |

## Padrões do projeto (não quebrar)
- Commits por feature/fix — nunca commits em branco
- Validações em `App\Http\Requests`, nunca inline em controllers
- Redux: ducks em `store/ducks/<feature>`, async em `store/fetchActions/<feature>`
- `AuditService::record()` silencia exceções — verificar se action está em VARCHAR (não ENUM)
- PDF download: sempre `api.get(blob)` + `URL.createObjectURL`
- Datas: sempre `s.substring(0,10).split('-')` — nunca `new Date(str)` (offset UTC-3)
- forceDelete() para pedidos de exame — não usar soft delete
- Padrão view*Fetch: sempre chamar GET antes de abrir modal que precisa de audit
- audit_logs.action é VARCHAR(30) — extensível sem migration

## Para iniciar nova tarefa
Leia HANDOFF.md para contexto completo, depois implemente.
Não há backlog de código pendente — qualquer nova tarefa virá do usuário.
