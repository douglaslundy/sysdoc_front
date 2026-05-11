# TASK_TODO.md — Sysdoc: Checklist de Implementação

**Data:** 2026-05-11
**Status:** IMPLEMENTAÇÃO COMPLETA — todas as fases A–N concluídas
**Legenda:** `[x]` concluído · `[ ]` pendente (operacional)

---

## FASE A — Fixes simples e seguros ✓

- [x] **A1 · 2.5** — `LabDashboard.js` — `e.nome || e.codigo` (era: `e.codigo || e.nome`)
- [x] **A2 · 2.7** — `LabDashboard.js` — radialBar dataLabels: `color: '#b0bec5'`
- [x] **A3 · 3.4** — `ResultadoExameController::store()` — load inclui `pedido.exames.camposAtivos.referencias`
- [x] **A4 · 4.3p1** — `ResultadoExameService::liberar()` — guard null para email + cheque `email_habilitado`

---

## FASE B — Bugs com root cause claro ✓

### Auditoria
- [x] **B1 · 1.1a** — `AuditService.php` — parâmetro `?User $actingUser = null`
- [x] **B1 · 1.1b** — `AuthController::login()` — `AuditService::record('LOGIN', null, null, null, $user)`
- [x] **B1 · 1.1c** — `LogUserAction::terminate()` — bloco api/login removido
- [x] **B2 · 1.2a** — `ResultadoExameController::show()` — `AuditService::record('VIEW', $resultado)`
- [x] **B2 · 1.2b** — `ResultadoExameController::downloadPdf()` — `AuditService::record('DOWNLOAD', $resultado)`
- [x] **B2 · 1.2c** — `AuditLogController::index()` — `AuditService::record('VIEW')`

### Dashboards
- [x] **B3 · 2.6** — `LabDashboard.js` — `xaxis.categories` adicionado nos gráficos horizontais (top médicos + top exames)

### Consulta pública
- [x] **B4 · 4.2a** — `ConsultaPublicaController` — `nome_exame` incluído em cada grupo de campos
- [x] **B4 · 4.2b** — `pages/consulta-exame.js` — usa `grupo.nome_exame` em vez de `Exame #{id}`

### PDF Download
- [x] **B5 · 3.1a** — `pedidos/index.js` — `handleDownloadPdf` via `api.get(blob)` + `URL.createObjectURL`
- [x] **B5 · 3.1b** — `modal/resultado/index.js` — mesmo padrão

### Valor numérico
- [x] **B6 · 4.5a** — Migration `2026_05_10_100000` — `decimal(15,4)` + índice `clients.cns`
- [x] **B6 · 4.5b** — `SalvarCamposResultadoRequest` — `max:99999999999` + mensagem amigável
- [x] **B6 · 4.5c** — `ResultadoModal` — `inputProps={{ max: 99999999999, step: 'any' }}`

---

## FASE C — Features novas ✓

### Pesquisa em pedidos
- [x] **C1 · 3.2a** — `PedidoExameController::index()` — `whereHas('cliente')` + LIKE name/cns/cpf
- [x] **C1 · 3.2b** — Índice `clients.cns` incluído na migration B6
- [x] **C1 · 3.2c** — `fetchActions/pedidosExame` — parâmetro `busca` passado na query string
- [x] **C1 · 3.2d** — `pedidos/index.js` — TextField busca + `useRef` debounce 400ms

### LabConfig (e-mail toggle)
- [x] **C2 · 4.3p2** — Migration `2026_05_10_200000_create_lab_configs_table`
- [x] **C2 · 4.3p2** — `LabConfig.php` — singleton via `firstOrCreate([], ['email_habilitado' => false])`
- [x] **C2 · 4.3p2** — `ResultadoExameService::liberar()` — `LabConfig::get()->email_habilitado`
- [x] **C2 · 4.4** — `LabConfigController` — `show()` + `update()` com audit
- [x] **C2 · 4.4** — `routes/api.php` — `GET/PUT /laboratorio/config` (middleware admin)
- [x] **C2 · 4.4** — `pages/laboratorio/configuracoes.js` — Switch toggle com feedback
- [x] **C2 · 4.4** — `store/ducks/labConfig` + `fetchActions/labConfig`
- [x] **C2 · 4.4** — `MenuItems.js` — item "Configurações" no grupo Laboratório (admin only)

### TFD mês de referência
- [x] **C3 · 2.3** — `TfdDashboard.js` — badge Chip com `dados.periodo_referencia`

### Gráfico total realizado
- [x] **C4 · 2.1a** — `DashboardService` — `getResultadosRealizadosPorMes()` + `getResultadosRealizadosPorAno()`
- [x] **C4 · 2.1b** — `DashboardController::laboratorio()` — `realizados_por_mes` + `realizados_por_ano` no payload
- [x] **C4 · 2.1c** — `LabDashboard.js` — gráfico área (12 meses) + gráfico bar (por ano)

### Especialidades realizadas
- [x] **C5 · 2.2a** — `DashboardService` — `getEspecialidadesRealizadas()` + por mês
- [x] **C5 · 2.2b** — `DashboardController::fila()` — `especialidades_realizadas` no payload
- [x] **C5 · 2.2c** — `FilaDashboard.js` — novos gráficos de especialidades

### Viagens completas + multi-período
- [x] **C6 · 2.4a** — `DashboardService` — `getTodosMotoristas(periodo)` sem limite de 5
- [x] **C6 · 2.4b** — `DashboardService` — `getTodasRotas(periodo)` sem limite de 5
- [x] **C6 · 2.4c** — `DashboardController::tfd()` — parâmetro `?periodo` + cache key dinâmica
- [x] **C6 · 2.4d** — `TfdDashboard.js` — `ToggleButtonGroup` mês/trimestre/semestre/ano
- [x] **C6 · 2.4e** — `TfdDashboard.js` — altura dinâmica: `Math.max(300, motoristas.length * 40)`

---

## FASE D — Investigação ✓

- [x] **D1 · 4.1** — Inspecionar `PedidoExame::exames()` + `pedido_exame_itens`
- [x] **D1 · 4.1** — Fix: `->distinct()` na relação, regra `distinct` na Request, `sync()` no controller

---

## FASE E — Autorizado ✓

### E1 · 3.3 — Editar pedido de exame
- [x] **E1 · 3.3a** — `PedidoExameController::update()` — bloqueio por status + sync exames + cascade campos
- [x] **E1 · 3.3b** — Rota coberta automaticamente por `apiResource('pedidos', ...)`
- [x] **E1 · 3.3c** — `UpdatePedidoExameRequest` — todos os campos nullable, distinct em exames
- [x] **E1 · 3.3d** — Cascade: `$sync['detached']` → `ResultadoCampo::whereIn('exame_id')->delete()`
- [x] **E1 · 3.3e** — Audit: `AuditService::record('UPDATE', $pedido)` direto no controller
- [x] **E1 · 3.3f** — Frontend: `EditarPedidoDialog` (MUI Dialog) + botão edit-2 na tabela

### E2 · 1.3 — Remover sistema antigo de logs
- [x] **E2 · 1.3a** — Removido `app/Http/Controllers/LogController.php`
- [x] **E2 · 1.3b** — Removido `app/Models/Log.php`
- [x] **E2 · 1.3c** — Removida rota `apiResource('logs', ...)` de `routes/api.php`
- [x] **E2 · 1.3d** — Removido `pages/logs.js`
- [x] **E2 · 1.3e** — Removidos `store/ducks/logs/` e `store/fetchActions/logs/`
- [x] **E2 · 1.3f** — Removido item "Logs" de `MenuItems.js`
- [x] **E2 · 1.3g** — `middleware.js` e `AuthGuard` não tinham referência (n/a)
- [x] **E2 · 1.3h** — `AccessProfileSeeder` — página `/logs` e permissão admin removidas

### E3 · 4.4 — Toggle de e-mail
- [x] **E3 · 4.4a-i** — Implementado integralmente em C2 (Fase C)

---

---

## RODADA 2 — Novos itens (segunda sessão) ✓ CONCLUÍDA

### FASE F — Fixes de 1-2 linhas ✓

- [x] **F1 · Dark mode donut** — `LabDashboard.js` — donut: `legend.labels.colors` + `dataLabels.style.colors`; radialBar: `legend.labels.colors`
- [x] **F2 · TFD cache mensal** — `DashboardController.php:163` — key inclui `now()->format('Y-m')`
- [x] **F3 · TFD rotas limit 10** — `DashboardService.php` — `getTodasRotas()` → `->limit(10)`
- [x] **F4 · Fila limit 10** — `DashboardService.php` — `getFilaPorEspecialidade()` + `getEspecialidadesRealizadas()` → `->limit(10)`

### FASE G — Bugs com root cause claro ✓

- [x] **G1 · Laudo PDF médico** — `LaudoPdfService.php` + `laudo.blade.php` — eager-load `medicoSolicitante` + corrigir `?->nome`
- [x] **G2 · Salvar campos erro genérico** — `fetchActions/resultadoExames/index.js:45` — extrair `data.errors` além de `data.error`
- [x] **G3 · Liberar resultado erro genérico** — `ResultadoExameController.php` + `ResultadoExameService.php` — `catch (\Throwable $e)` + frontend mensagem

### FASE H — Feature nova ✓

- [x] **H1 · Fila visualizar** — `queue/index.js` — botão eye + Dialog inline com todos os dados do registro

### FASE I — Features pedidos + visuais ✓

- [x] **I1 · Gauge charts** — `LabDashboard.js` — "Pedidos por Status" → velocímetro (startAngle -135/135, gradient colorStops); "Resultados" → semicircle gauge (startAngle -90/90)
- [x] **I2 · Datas dd/mm/YYYY** — `pedidos/index.js` — helper `formatDate()` com split ISO para evitar offset de timezone
- [x] **I3 · Coluna Protocolo** — `pedidos/index.js` — coluna antes de Paciente; `pedido.resultado?.protocolo ?? '—'`; colSpan 5→6
- [x] **I4 · Busca por protocolo** — `PedidoExameController.php` + `pedidos/index.js` — `orWhereHas('resultado', fn → where protocolo LIKE)` + placeholder atualizado
- [x] **I5 · Imprimir laudo na consulta pública** — POST `/consulta-exame/pdf/{protocolo}` (senha no body); `ConsultaPublicaController::downloadPdf()`; botão "Baixar Laudo PDF" no frontend

---

## RODADA 4 — Novos itens (quarta sessão) ✓ CONCLUÍDA

### FASE L — Auditoria de acessos restantes ✓

- [x] **L1 · Abrir pedido de exame individual**
  - [x] L1a — `PedidoExameController::show()` → `AuditService::record('VIEW', $pedido, null, ['cliente', 'status', 'exames'])`
  - [x] L1b — `fetchActions/pedidosExame/index.js` → `viewPedidoFetch(pedidoId, onSuccess)` chama `GET /laboratorio/pedidos/{id}`
  - [x] L1c — `pedidos/index.js` → botão edit-2 chama `dispatch(viewPedidoFetch(pedido.id, setEditarPedido))`

- [x] **L2 · Abrir registro da fila (H1)**
  - [x] L2a — `QueueController::show($id)` — eager-load + `AuditService::record('VIEW', $queue, null, [...])`
  - [x] L2b — `fetchActions/queues/index.js` → `viewQueueFetch(queueId, onSuccess)` chama `GET /queues/{id}`
  - [x] L2c — `queue/index.js` → botão eye chama `dispatch(viewQueueFetch(queue.id, setViewQueue))`

---

## RODADA 3 — Novos itens (terceira sessão) ✗ AGUARDANDO APROVAÇÃO

### FASE J — Fixes e features pedidos ✓

- [x] **J1 · Confirmação antes de excluir pedido** — `pedidos/index.js`
  - `ConfirmDialog` com título dinâmico "Deseja excluir o pedido de [nome]?" + "Esta ação não poderá ser desfeita"
  - `handleRemoverPedido()` dispara `changeTitleAlert` + abre dialog; "Sim" executa `removePedidoFetch`
  - Root cause corrigido: `addMessage` removido de `removePedidoFetch` (ia para toasts, não para AlertModal); `changeTitleAlert` define o texto correto antes da confirmação

### FASE K — Auditoria de acesso individual ✓

- [x] **K1 · VIEW audit em ficha de cliente** — `ClientController::show()`
  - `AuditService::record('VIEW', $client)` após encontrar o registro
  - Audita quem acessou a ficha de qual paciente e quando (LGPD)
  - Listagem (`index`) não auditada — volume alto, baixo valor forense

---

## RODADA 5 — Novos itens (quinta sessão — 2026-05-11) ✓ CONCLUÍDA

### FASE M — Fixes de integridade e auditoria

- [x] **M1 · Cascade deletion pedidos de exame** — `PedidoExameController::destroy()` → `forceDelete()` aciona DB CASCADE
- [x] **M2 · Bloco Exames no client_report** — `Client::pedidosExame()` + eager-load + tabela no frontend com contadores
- [x] **M3 · Fix QueueController show() duplicado** — fatal error PHP corrigido
- [x] **M4 · Fix audit_logs.action ENUM → VARCHAR(30)** — VIEW/VIEW_REPORT/LIBERAR/DOWNLOAD agora gravam
- [x] **M5 · Auditoria: select usuários + filtros + uppercase** — endpoint `/audit-logs/users` + filtro user_name no backend
- [x] **M6 · Endpoint após VIEW/VIEW_REPORT na tabela** — helper endpointLabel() + exibição inline

---

---

## RODADA 6 — Novos itens (sexta sessão — 2026-05-11) ✓ CONCLUÍDA

### FASE N — Auditoria completa do sistema ✓

- [x] **N1 · Auditoria CREATE/UPDATE/DELETE em todos os controllers**
  - [x] LetterController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] OrdinanceController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] QueueController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] ExameController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] CategoriaExameController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] ExameCampoController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] CampoReferenciaController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] MedicoSolicitanteController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] VehicleController — store (CREATE), update (UPDATE), destroy (DELETE, active=false)
  - [x] RouteController — store (CREATE), update (UPDATE), destroy (DELETE, active=false)
  - [x] RoomController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] CallController — store (CREATE), update (UPDATE) — destroy não implementado
  - [x] CallServiceController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] SystemPageController — store (CREATE), update (UPDATE), destroy (DELETE)
  - [x] SectorController — insert (CREATE), update (UPDATE), delete (DELETE)
  - [x] PedidoExameObserver — forceDeleted() para capturar forceDelete()

---

## PENDENTE — Apenas operacional (servidor de produção)

```bash
# 1. Rodar migrations novas
php artisan migrate --force

# 2. Atualizar permissões no banco
php artisan db:seed --class=AccessProfileSeeder --force

# 3. Configurar .env no backend
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=...
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=...
MAIL_FROM_NAME=...

# 4. Verificar build no Vercel
npm run build
```

---

## ARQUIVOS ALTERADOS — RESUMO FINAL

### Backend — modificados
```
app/Services/AuditService.php
app/Services/DashboardService.php
app/Services/Laboratorio/ResultadoExameService.php
app/Http/Middleware/LogUserAction.php
app/Http/Controllers/AuthController.php
app/Http/Controllers/ResultadoExameController.php
app/Http/Controllers/PedidoExameController.php
app/Http/Controllers/DashboardController.php
app/Http/Controllers/ConsultaPublicaController.php
app/Http/Controllers/AuditLogController.php
app/Http/Requests/SalvarCamposResultadoRequest.php
app/Http/Requests/StorePedidoExameRequest.php
app/Models/PedidoExame.php
routes/api.php
database/seeders/AccessProfileSeeder.php
```

### Backend — criados
```
app/Models/LabConfig.php
app/Http/Controllers/LabConfigController.php
app/Http/Requests/UpdatePedidoExameRequest.php
database/migrations/2026_05_10_100000_alter_resultado_campos_decimal_and_add_clients_indexes.php
database/migrations/2026_05_10_200000_create_lab_configs_table.php
```

### Backend — removidos
```
app/Http/Controllers/LogController.php
app/Models/Log.php
```

### Frontend — modificados
```
src/components/dashboard/LabDashboard.js
src/components/dashboard/FilaDashboard.js
src/components/dashboard/TfdDashboard.js
src/components/laboratorio/pedidos/index.js
src/components/modal/resultado/index.js
src/store/fetchActions/pedidosExame/index.js
src/store/index.js
src/layouts/sidebar/MenuItems.js
pages/consulta-exame.js
```

### Frontend — criados
```
pages/laboratorio/configuracoes.js
src/components/modal/editarPedido/index.js
src/store/ducks/labConfig/index.js
src/store/fetchActions/labConfig/index.js
```

### Frontend — removidos
```
pages/logs.js
src/store/ducks/logs/index.js
src/store/fetchActions/logs/index.js
```
