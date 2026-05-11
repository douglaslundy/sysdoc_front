# TASK_STATE.md — Estado atual da implementação

**Última atualização:** 2026-05-11 (6ª sessão — Fase N concluída)
**Fase ativa:** — TODAS AS FASES CONCLUÍDAS ✓ (A–N)
**Item ativo:** nenhum — todos os commits pushados, blocker apenas operacional (produção)

---

## LEGENDA
`[x]` concluído · `[~]` em andamento · `[ ]` pendente · `[!]` bloqueado

---

## FASE A — Fixes simples e seguros ✓ CONCLUÍDA

- [x] **A1 · 2.5** — LabDashboard.js — exame: `e.codigo || e.nome` → `e.nome || e.codigo`
- [x] **A2 · 2.7** — LabDashboard.js — radialBar labels: adicionar `color: '#b0bec5'`
- [x] **A3 · 3.4** — ResultadoExameController::store() — incluir `pedido.exames.camposAtivos.referencias` no load
- [x] **A4 · 4.3p1** — ResultadoExameService::liberar() — guard null email

## FASE B — Bugs com root cause claro ✓ CONCLUÍDA

- [x] **B1 · 1.1a** — AuditService — parâmetro `?User $actingUser`
- [x] **B1 · 1.1b** — AuthController::login() — chamar AuditService com $user
- [x] **B1 · 1.1c** — LogUserAction — remover bloco api/login
- [x] **B2 · 1.2a** — ResultadoExameController::show() — VIEW audit
- [x] **B2 · 1.2b** — ResultadoExameController::downloadPdf() — DOWNLOAD audit
- [x] **B2 · 1.2c** — AuditLogController::index() — VIEW audit
- [x] **B3 · 2.6** — Root cause: xaxis.categories ausente nos gráficos horizontais → corrigido em LabDashboard
- [x] **B4 · 4.2a** — ConsultaPublicaController — incluir nome_exame no grupo de campos
- [x] **B4 · 4.2b** — consulta-exame.js — usar grupo.nome_exame
- [x] **B5 · 3.1a** — pedidos/index.js — PDF download via axios blob
- [x] **B5 · 3.1b** — modal/resultado/index.js — PDF download via axios blob
- [x] **B6 · 4.5a** — Migration decimal(10,3) → decimal(15,4) + índice clients.cns
- [x] **B6 · 4.5b** — SalvarCamposResultadoRequest — validação max + msg amigável
- [x] **B6 · 4.5c** — ResultadoModal frontend — inputProps max

## FASE C — Features novas ✓ CONCLUÍDA

- [x] **C1 · 3.2a** — PedidoExameController::index() — filtro busca (whereHas + LIKE)
- [x] **C1 · 3.2b** — Índices clients.cpf/cns na migration B6
- [x] **C1 · 3.2c** — fetchActions/pedidosExame — parâmetro busca
- [x] **C1 · 3.2d** — pedidos/index.js — campo de pesquisa UI com debounce 400ms
- [x] **C2 · 4.3p2** — Migration create_lab_configs
- [x] **C2 · 4.3p2** — LabConfig model (singleton via firstOrCreate)
- [x] **C2 · 4.3p2** — ResultadoExameService — checar email_habilitado
- [x] **C2 · 4.4** — LabConfigController (show + update + audit)
- [x] **C2 · 4.4** — Rota GET/PUT /laboratorio/config (middleware admin)
- [x] **C2 · 4.4** — Frontend: pages/laboratorio/configuracoes.js (Switch toggle)
- [x] **C2 · 4.4** — Frontend: store/ducks/labConfig + fetchActions/labConfig
- [x] **C2 · 4.4** — Frontend: item Configurações no menu (admin only)
- [x] **C3 · 2.3** — TfdDashboard — badge mês de referência nos cards
- [x] **C4 · 2.1a** — DashboardService — getResultadosRealizadosPorMes/Ano
- [x] **C4 · 2.1b** — DashboardController::laboratorio() — incluir realizados no payload
- [x] **C4 · 2.1c** — LabDashboard.js — dois novos gráficos (área 12 meses + bar por ano)
- [x] **C5 · 2.2a** — DashboardService — getEspecialidadesRealizadas + por mês
- [x] **C5 · 2.2b** — DashboardController::fila() — incluir especialidades no payload
- [x] **C5 · 2.2c** — FilaDashboard.js — gráficos de especialidades realizadas
- [x] **C6 · 2.4a** — DashboardService — getTodosMotoristas(periodo) sem limite
- [x] **C6 · 2.4b** — DashboardService — getTodasRotas(periodo) sem limite
- [x] **C6 · 2.4c** — DashboardController::tfd() — parâmetro ?periodo + cache key dinâmica
- [x] **C6 · 2.4d** — TfdDashboard.js — ToggleButtonGroup de período (mês/trimestre/semestre/ano)
- [x] **C6 · 2.4e** — TfdDashboard.js — altura dinâmica do gráfico de motoristas

## FASE D — Investigação ✓ CONCLUÍDA

- [x] **D1 · 4.1** — Inspecionar PedidoExame::exames() + pedido_exame_itens
  - UNIQUE constraint existe na migration (pedido_exame_id, exame_id)
  - Root cause real: `sync()` não era usado (loop manual sem dedup); frontend toggle de checkbox já prevenia UI duplicates
- [x] **D1 · 4.1** — Correção: `->distinct()` em exames(), `distinct` rule na Request, `sync()` no store()

## FASE E — Autorizado ✓ CONCLUÍDA

- [x] **E1 · 3.3a** — PedidoExameController::update() com bloqueio por status
- [x] **E1 · 3.3b** — Rota coberta por apiResource (PUT/PATCH automático)
- [x] **E1 · 3.3c** — UpdatePedidoExameRequest (todos os campos nullable)
- [x] **E1 · 3.3d** — Cascade: sync() retorna detached → delete ResultadoCampo por exame_id
- [x] **E1 · 3.3e** — Audit via AuditService::record('UPDATE') direto no controller
- [x] **E1 · 3.3f** — Frontend: EditarPedidoDialog (MUI Dialog) + botão edit-2 na tabela
- [x] **E2 · 1.3a** — Removido LogController.php
- [x] **E2 · 1.3b** — Removido Log.php
- [x] **E2 · 1.3c** — Removida rota apiResource /logs de api.php
- [x] **E2 · 1.3d** — Removido pages/logs.js
- [x] **E2 · 1.3e** — Removidos store/ducks/logs/ e fetchActions/logs/
- [x] **E2 · 1.3f** — Removido item "Logs" do MenuItems.js
- [x] **E2 · 1.3g** — middleware.js e AuthGuard não tinham referência a /logs (n/a)
- [x] **E2 · 1.3h** — AccessProfileSeeder: removida página /logs e permissão admin
- [x] **E3 · 4.4a-i** — Coberto integralmente por C2 (implementado junto na Fase C)

## FASE F — Fixes de 1-2 linhas ✓ CONCLUÍDA

- [x] **F1** — `LabDashboard.js` — dark mode: `legend.labels.colors` + `dataLabels.style.colors` no donut/radialBar
- [x] **F2** — `DashboardController.php` — cache key TFD inclui `now()->format('Y-m')` (evita dado do mês anterior)
- [x] **F3** — `DashboardService::getTodasRotas()` — `->limit(10)` antes do `->get()`
- [x] **F4** — `DashboardService::getFilaPorEspecialidade()` + `getEspecialidadesRealizadas()` — `->limit(10)`

## FASE G — Bugs com root cause claro ✓ CONCLUÍDA

- [x] **G1** — `LaudoPdfService.php` — eager-load `pedido.medicoSolicitante`; `laudo.blade.php` — `$resultado->pedido->medicoSolicitante?->nome ?? '—'`
- [x] **G2** — `fetchActions/resultadoExames/index.js` — extrai `data.errors` (FormRequest) além de `data.error` em `salvarCamposFetch`
- [x] **G3** — `ResultadoExameController.php` + `ResultadoExameService.php` — `catch (Exception $e)` → `catch (\Throwable $e)` em `salvarCampos()` e `liberar()`; frontend extrai `data.message` em `liberarResultadoFetch`

## FASE H — Feature nova ✓ CONCLUÍDA

- [x] **H1** — `queue/index.js` — botão eye em cada linha; Dialog com todos os campos (posição, cidadão, mãe, CPF/CNS/tel, especialidade, observação, data entrada, cadastrador, realizado + data realização); Fragment `<>...</>` envolvendo retorno

## FASE I — Features pedidos + visuais ✓ CONCLUÍDA

- [x] **I1** — `LabDashboard.js` — "Pedidos por Status" → velocímetro ApexCharts (`startAngle: -135, endAngle: 135`, gradient colorStops red→orange→gray→green, série = % liberados); "Resultados" → semicircle gauge (`startAngle: -90, endAngle: 90`, verde)
- [x] **I2** — `pedidos/index.js` — helper `formatDate(s)` com `s.substring(0,10).split('-')` (evita offset timezone); aplicado em `data_pedido` e `data_coleta`
- [x] **I3** — `pedidos/index.js` — coluna "Protocolo" antes de "Paciente"; `pedido.resultado?.protocolo ?? '—'`; colSpan 5→6
- [x] **I4** — `PedidoExameController::index()` — `orWhereHas('resultado', fn → where protocolo LIKE "%busca%")`; `pedidos/index.js` — placeholder atualizado
- [x] **I5** — `ConsultaPublicaController::downloadPdf()` — valida senha via `Hash::check()`; `Storage::download()` do PDF; rota pública `POST /consulta-exame/pdf/{protocolo}`; `consulta-exame.js` — `handleImprimirLaudo()` com `axios.post(responseType: blob)` + botão "Baixar Laudo PDF"

---

## COMMITS REALIZADOS NESTA SESSÃO

### sysdoc_back — 1ª sessão (fases A–E)
| Hash | Descrição |
|---|---|
| `5b8113c` | fix: fase A — ResultadoExameController store + email guard |
| `498868a` | fix: fase B — auditoria, consulta pública, validações (B1–B6) |
| `2f34714` | feat: fase C — pesquisa pedidos, LabConfig, dashboards realizados e viagens |
| `9fb30b9` | fix: fase D — inputs duplicados (distinct, sync, validação) |
| `580975b` | chore: fase E2 — remove sistema de logs antigo |
| `7c1de27` | feat: fase E1 — editar pedido de exame |

### sysdoc_back — 2ª sessão (fases F–I)
| Hash | Descrição |
|---|---|
| `3909151` | fix: fase F — cache key mensal TFD, limit rotas e especialidades |
| `386682b` | fix: fase G — laudo PDF médico solicitante e catch Throwable |
| `5d73b2a` | feat: fase I — busca por protocolo no filtro de pedidos |
| `500734c` | feat: fase I — download de laudo PDF na consulta pública |

### sysdoc_front — 1ª sessão (fases A–E)
| Hash | Descrição |
|---|---|
| `b0bcfdc` | fix: fase A — LabDashboard nome exame + dark mode |
| `38285f3` | fix: fase B — dashboards, consulta pública, PDF download, validação numérica |
| `79a420f` | feat: fase C — pesquisa pedidos, labConfig, TFD período, gráficos realizados |
| `b489219` | chore: fase E2 — remove sistema de logs antigo |
| `0a7d075` | feat: fase E1 — editar pedido de exame |

### sysdoc_front — 2ª sessão (fases F–I)
| Hash | Descrição |
|---|---|
| `088a4ab` | fix: Fragment wrapper no retorno de ListaPedidos |
| `c0260e3` | fix: fase F — dark mode legend, cache key mensal TFD, limits dashboard |
| `17fa822` | fix: fase G — mensagens de erro específicas em salvar campos e liberar |
| `56fa175` | feat: fase H — fila visualizar registro completo |
| `6a3ed9a` | feat: fase I — pedidos: protocolo, datas formatadas e busca por protocolo |
| `d58ab67` | feat: fase I — botão baixar laudo PDF na consulta pública |
| `e875362` | feat: fase I — gauge charts no dashboard lab + fix Fragment queue |

---

## RODADA 3 — Tarefas concluídas (terceira sessão) ✓

### J1 — Confirmação + mensagem correta ao excluir pedido `[x]` CONCLUÍDO
**Commit:** `e39e1bc` (front)  
**Root cause confirmado:** `titleAlert` tem padrão `"Cadastro realizado com sucesso!"` no Layout duck. `removePedidoFetch` disparava `addMessage()` (array de toasts — sistema separado) e depois `turnAlert()` — que abria o AlertModal com o título padrão, não com a mensagem de exclusão.  
**Fix aplicado:**
- `handleRemoverPedido()` dispara `changeTitleAlert('Pedido de [nome] excluído com sucesso!')` + abre `ConfirmDialog`
- `addMessage()` removido de `removePedidoFetch` (estava no destino errado)
- `ConfirmDialog` com título dinâmico + subtítulo adicionado ao Fragment do retorno

### K1 — Auditoria VIEW ficha de cliente `[x]` CONCLUÍDO
**Commit:** `ff6744b` (back)  
**Fix aplicado:** `AuditService::record('VIEW', $client)` em `ClientController::show()`. Listagem não auditada (volume alto, baixo valor forense).

---

## RODADA 4 — Tarefas concluídas (quarta sessão) ✓

### L1 — Auditoria VIEW ao abrir pedido de exame `[x]` CONCLUÍDO
**Commits:** back (4ª sessão), `87f3e05` (front)  
**Fix aplicado:** `AuditService::record('VIEW', $pedido, null, ['cliente', 'status', 'exames'])` em `PedidoExameController::show()`. Frontend substituiu `setEditarPedido(pedido)` direto por `dispatch(viewPedidoFetch(pedido.id, setEditarPedido))` — garante que a rota backend é chamada antes de abrir o dialog.

### L2 — Auditoria VIEW ao abrir registro da fila `[x]` CONCLUÍDO
**Commits:** `afedfce` (back), `132b309` (front)  
**Fix aplicado:** Novo `QueueController::show($id)` com eager-load + `AuditService::record('VIEW', $queue, null, ['cliente', 'cpf', 'especialidade', 'status'])`. Frontend adicionou `viewQueueFetch(queueId, onSuccess)` e substituiu `setViewQueue(queue)` por `dispatch(viewQueueFetch(queue.id, setViewQueue))` no botão eye.

---

## RODADA 5 — Tarefas concluídas (quinta sessão — 2026-05-11) ✓

### M1 — Cascade deletion de pedidos de exame `[x]` CONCLUÍDO
**Commits:** `21af5cd` → revertido → `b727d85` (back)
**Root cause:** `PedidoExame` usa SoftDeletes, então `ON DELETE CASCADE` do banco nunca dispara. Primeira tentativa: deletar filhos manualmente antes do soft delete. Corrigido para `forceDelete()` — hard delete físico que aciona cascade do banco automaticamente. Consistente: se os filhos não têm soft delete, o pai também não deve ter.
**Cascata ativa:** `pedidos_exame` → `pedido_exame_itens` + `resultado_exames` → `resultado_campos` (via FK cascade)

### M2 — Bloco Exames no client_report + contadores `[x]` CONCLUÍDO
**Commits:** `c619d20` (back), `3d4c478` (front)
**Implementado:**
- `Client::pedidosExame()` hasMany + eager-load em `detailedClientReport` com `exames`, `medicoSolicitante`, `criadoPor`, `resultado.liberadoPor`
- Bloco "Exames (N)" na página client_report: data, chips de exames, médico solicitante, status (Chip colorido), cadastrado por, liberado por
- Contadores `(N)` em todos os blocos: Viagens, Filas, Exames

### M3 — Fix QueueController show() duplicado `[x]` CONCLUÍDO
**Commit:** `0d82c3e` (back)
**Root cause:** L2 inseriu novo `show()` mas o `show()` original não foi removido. Fatal error PHP impedia o boot da aplicação inteira. Detectado via `php artisan route:list`.

### M4 — Fix crítico: audit_logs.action era ENUM restrito `[x]` CONCLUÍDO
**Commit:** `acbcd4e` (back)
**Root cause:** Coluna `action` definida como `ENUM('LOGIN','LOGOUT','CREATE','UPDATE','DELETE')`. Ações `VIEW`, `VIEW_REPORT`, `LIBERAR`, `DOWNLOAD` eram rejeitadas pelo MySQL e engolidas pelo `catch (\Throwable)` do `AuditService` — zero logs gravados para essas ações.
**Fix:** Migration `2026_05_10_400000` converte para `VARCHAR(30)`. Testado via tinker: 4 tipos inseridos com sucesso.

### M5 — Auditoria: select de usuários + filtros corrigidos + uppercase `[x]` CONCLUÍDO
**Commits:** `970c534` (back), `3c8ca9f` (front)
**Problemas corrigidos:**
- Frontend enviava `user_name` mas backend só filtrava por `user_id` → param ignorado → filtro não funcionava
- Recurso exibido com casing original (`PedidoExame`) em vez de uppercase
- Ações VIEW/VIEW_REPORT/LIBERAR/DOWNLOAD ausentes do select de filtro
**Implementado:**
- Novo endpoint `GET /audit-logs/users` — retorna usuários distintos dos logs
- `AuditLogController::index()` agora filtra por `user_name` (exact match)
- Select de usuários populado via API (todos os usuários já presentes nos logs)
- Recurso em uppercase com espaços no select e na tabela
- Todas as 9 ações no select de filtro

### M6 — Endpoint exibido após ação VIEW e VIEW_REPORT `[x]` CONCLUÍDO
**Commit:** `b74e89a` (front)
**Implementado:** Helper `endpointLabel()` extrai nome legível do campo `endpoint` (remove `api/`, IDs numéricos, converte hífens em espaços). Exibido como `/ clients`, `/ queues`, `/ laboratorio/pedidos` após o Chip da ação.

---

## RODADA 6 — Tarefas concluídas (sexta sessão — 2026-05-11) ✓

### N1 — Auditoria completa: CREATE/UPDATE/DELETE em todos os controllers `[x]` CONCLUÍDO
**Commit:** `845a784` (back)
**Controllers cobertos:** LetterController, OrdinanceController, QueueController, ExameController, CategoriaExameController, ExameCampoController, CampoReferenciaController, MedicoSolicitanteController, VehicleController, RouteController, RoomController, CallController, CallServiceController, SystemPageController, SectorController
**Observer:** PedidoExameObserver::forceDeleted() adicionado — `forceDelete()` dispara `forceDeleted`, não `deleted`, então o `deleted()` existente não captava exclusões físicas de pedidos.
**Padrão:** `$old = $model->toArray()` antes do update; `AuditService::record('DELETE', ...)` antes do delete.
**Casos especiais:**
- VehicleController/RouteController::destroy() usa `active=false` — auditado como DELETE antes da desativação
- SectorController usa `insert()`, `update()`, `delete()` em vez de `store()`, `update()`, `destroy()`
- CallController::destroy() não implementado — skipped

---

## PENDENTE (apenas operacional — servidor de produção)

- [ ] `php artisan migrate --force` — inclui: decimal(15,4), lab_configs, trigger pedido liberado, **VARCHAR action audit_logs**
- [ ] `php artisan db:seed --class=AccessProfileSeeder --force` — atualiza permissões
- [ ] `php artisan cache:forget dashboard.laboratorio` — limpa cache do gauge
- [ ] `.env` backend — configurar MAIL_* para envio de resultado por e-mail
- [ ] Vercel — auto-deploy via push (já realizado)
