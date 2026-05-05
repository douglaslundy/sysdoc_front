# SYSDOC — TODO MASTER

> Última atualização: 2026-05-05
> Responsável: Douglas / Claude Code

---

## LEGENDA
- [x] Concluído
- [ ] Pendente
- [~] Em andamento

---

## ✅ CONCLUÍDOS (histórico)

### Módulo Laboratório (Abr–Mai 2026)
- [x] Migrations: exames, campos, referências, categorias, pedidos, resultados
- [x] Models: Exame, ExameCampo, CampoReferencia, CategoriaExame, PedidoExame, ResultadoExame
- [x] Controllers: ExameController, ExameCampoController, CampoReferenciaController, CategoriaExameController, PedidoExameController, ResultadoExameController
- [x] Services: ResultadoExameService (protocolo, hash, PDF), LaudoPdfService
- [x] Redux: ducks + fetchActions para todos os recursos de laboratório
- [x] Páginas: /laboratorio/exames, /pedidos, /resultados, /categorias, /medicos, /agenda
- [x] Modais: ExameModal, PedidoModal, CategoriaExameModal, MedicoSolicitanteModal
- [x] CRUD Médicos Solicitantes (completo)
- [x] Agenda de Coleta por data
- [x] Consulta Pública (protocolo + senha, throttle)
- [x] Envio de e-mail com laudo
- [x] Seed: CategoriaExameSeeder (35 categorias), ExamesCompletosSeeder (80+ exames)

---

## 🐛 BUG FIXES

- [x] **FIX-10** — Ctrl+R em qualquer página deixa espaço vazio entre header e conteúdo
  - Causa: SSR renderiza `variant="temporary"` (isDesktop=false) → hydration muda para `"persistent"` → `DrawerDockedRoot` entra no `flex-column` do MainWrapper adicionando ~500px de altura → PageWrapper empurrado para baixo
  - Fix: `position: fixed; top: 0; height: 100vh` no `PaperProps` do Drawer quando `isDesktop` — retira o Paper do fluxo da coluna sem alterar comportamento visual; `marginLeft` no PageWrapper já compensava o offset horizontal
  - Arquivo: `sysdoc_front/src/layouts/sidebar/Sidebar.js`

- [x] **FIX-06** — Logout não redireciona para /login (fica no dashboard legado)
  - Fix: `getServerSideProps` em `login.js` passou a checar `sysvendas.id` + `sysvendas.profile` (não-httpOnly) em vez de `sysvendas.token` (httpOnly)
  - Commit: `c69f638`

- [x] **FIX-07** — Menu lateral ignora perfis criados dinamicamente no banco
  - Fix: `AuthContext` carrega `myPermissions[]` via `GET /auth/my-permissions`; `Sidebar` usa tripla verificação (admin / estático / dinâmico)
  - Commit: `c69f638`

- [x] **FIX-08** — AuthGuard não bloqueia acesso direto via URL para perfis dinâmicos
  - Fix: `AuthGuard` verifica `myPermissions` do contexto além dos arrays estáticos; admin tem bypass total
  - Commit: `c69f638`

- [x] **FIX-09** — Modal de cadastro de usuário exibe perfis hardcoded, não reflete banco
  - Fix: `UserModal` usa `state.accessProfiles.profiles` do Redux; despacha `getAllProfiles()` ao abrir para admin
  - Commit: `c69f638`

- [x] **FIX-01** — Meus Dados: `getUserFetch` despacha `res.data.users` mas API retorna `res.data` diretamente → trocar para `res.data`
  - Arquivo: `sysdoc_front/src/store/fetchActions/user/index.js` linha 77
  - Impacto: modal de edição do próprio perfil abre vazio e não salva

- [x] **FIX-02** — Exames: listagem retorna apenas 20 (paginação padrão da API) mas sistema tem 120+
  - API: `ExameController.php` usa `paginate(20)` por padrão
  - Frontend: `getAllExames()` chamado sem params → recebe só 1ª página
  - Fix: passar `per_page: 1000` no fetchAction do catálogo

- [x] **FIX-03** — Modais campo/referência fora do padrão do sistema
  - Arquivos: `GerenciarCampos.js` usa MUI `Dialog` (compact popup)
  - Padrão: `Modal + BaseCard` com style `{ width: '90%', height: '98%' }`
  - Fix: converter Dialog→Modal+BaseCard em ambos os modais

- [x] **FIX-04** — Ícones nas páginas de laboratório com tamanho diferente do padrão
  - Clientes usa: `<Button variant="contained">` + FeatherIcon `width="20" height="20"` + FAB sem `size`
  - Lab usa: `<IconButton size="small">` + FeatherIcon `size={16}` + `<Fab size="small">`
  - Fix: padronizar ícones para `width="20" height="20"` e FAB sem size="small"
  - Arquivos: exames/index.js, categorias/index.js, medicos/index.js

- [x] **FIX-05** — Títulos sem contagem de registros
  - Exames, Pedidos, Categorias, Médicos precisam mostrar qtd cadastrada no título
  - Modelo: `BaseCard title="Você possui X Registros Cadastrados"` (padrão clientes)

---

## 🔧 MELHORIAS

- [x] **MFG-01** — Autenticação: revisar e corrigir problemas
  - Bug: `useContext(AuthContext)` em `_app.js` chamado fora do `AuthProvider`
  - Bug: rota `/showqueue/*` não está em `PUBLIC_ROUTES` → redireciona para login
  - Bug: qualquer erro de rede (500, timeout) destrói o cookie igual ao 401
  - Fix: corrigir PUBLIC_ROUTES, só destruir token em 401 real
  
- [x] **MFG-02** — Dashboard analítico: criar página `/dashboards` com gráficos
  - Gráficos sugeridos:
    - Pedidos por status (pizza/donut)
    - Pedidos por mês (linha/barra)
    - Top 10 exames mais solicitados (barra horizontal)
    - Pedidos por médico solicitante
    - Clientes cadastrados por mês
    - Resultados liberados vs pendentes
    - Distribuição por categoria de exame
  - Backend: criar endpoint `/api/dashboard/laboratorio` com dados agregados
  - Frontend: usar Recharts ou ApexCharts (já instalado — SalseOverview.js usa ApexCharts)

---

## 🆕 NOVAS FUNCIONALIDADES

- [x] **FEAT-01** — Seed de perfis de acesso com permissões baseadas no menu atual
  - Criar tabela `profiles` com os 6 perfis (admin, manager, user, tfd, driver, partner)
  - Criar tabela `system_pages` com todas as páginas do sistema
  - Criar tabela `profile_page_permissions` (pivô)
  - Criar seeder populando com permissões atuais do MenuItems.js
  - Backend: 3 migrations + 1 seeder

- [x] **FEAT-02** — CRUD de perfis de acesso (admin gerencia perfis e páginas)
  - Backend: ProfileController, PageController, rotas
  - Frontend: página `/perfis` (admin only)
  - Modal de perfil: nome, descrição, lista de páginas com checkboxes
  - Menu: adicionar link "Perfis de Acesso" para admin

- [x] **FEAT-03** — CRUD de páginas do sistema
  - Tabela `system_pages`: id, titulo, path, icone, categoria, ativo
  - Usar para controlar quais páginas são visíveis por perfil
  - Seeder populando com todas as páginas do MenuItems.js

- [x] **FEAT-04** — Regras de autorização nas páginas
  - Componente `<AuthGuard>` que verifica se o perfil tem acesso à página atual
  - Se sem permissão: exibir componente `<UnauthorizedPage />`
  - Backend: endpoint `/api/auth/my-permissions` retornando array de paths permitidos
  - Frontend: usar no HOC de cada página protegida

- [x] **FEAT-05** — Redefinição de senha via link no email
  - Backend:
    - Migration: `password_reset_tokens` (email, token, created_at)
    - Controller: `PasswordResetController` com métodos `sendLink` e `reset`
    - Rota POST `/api/forgot-password` (público, throttle 3/min)
    - Rota POST `/api/reset-password` (público)
    - Email: template Blade com link de redefinição
    - Token: 60min de validade, 1 uso
  - Frontend:
    - Página `/esqueci-senha` (pública): input de email + botão
    - Página `/redefinir-senha?token=...&email=...` (pública): inputs de nova senha

---

## 🔐 SEGURANÇA (Fase 2)

- [x] **SEC-01** — Correções críticas: CORS, AdminOnly middleware, token expiration, cookie secure/sameSite
- [ ] **SEC-02** — Cookie httpOnly para JWT via Next.js API Route (BFF)
  - Criar `/pages/api/auth/login.js`, `logout.js`, `validate.js` como proxy
  - Token setado server-side com flag `httpOnly; Secure; SameSite=Strict`
  - Frontend passa a chamar `/api/auth/*` em vez do backend diretamente
  - `services/api.js` — nos API routes, ler token do cookie e injetar no header Authorization
  - **Nota**: refatoração significativa; SEssões com usuários internos e `sameSite: strict` já mitigam CSRF

---

## 🎨 UX / INTERFACE

- [ ] **UX-01** — Menu lateral com grupos e dropdowns colapsáveis
  - `MenuItems.js`: adicionar campo `group: true` e `children: []` nos itens agrupados
  - `Sidebar.js`: renderizar grupos com `Collapse` + `ListItemButton` para expandir/colapsar
  - Grupos: **Geral** (Dashboard, Dashboards) | **Administração** (Usuários, Perfis, Páginas) | **Cadastros** (Clientes, Especialidades) | **Laboratório** (Exames, Pedidos, Categorias, Médicos, Agenda) | **TFD** (Veículos, Rotas, Viagens) | **Atendimento** (Fila, Salas, Minha Sala, Em Atendimento, Novo Atendimento, Painel) | **Documentos** (Ofícios, Portarias, Modelos IA) | **Sistema** (Logs, Logs Erro, Logs QRCODE, Serviços)
  - Auto-expandir o grupo do item ativo
  - Salvar estado de abertura em localStorage

---

## 📋 AUDITORIA

- [ ] **AUD-01** — Sistema de auditoria de ações (enterprise-grade)
  - **Backend**:
    - Migration `audit_logs`: `id, user_id, user_name, action (enum: CREATE/UPDATE/DELETE/LOGIN/LOGOUT), model_type, model_id, endpoint, method, ip, user_agent, old_values (JSON), new_values (JSON), created_at`
    - Model `AuditLog` + Service `AuditService::record(action, model?, old?, new?)`
    - Observers em: User, Client, PedidoExame, ResultadoExame, Trip, AccessProfile — registram CREATE/UPDATE/DELETE automaticamente com diff
    - `LogUserAction` middleware: simplificar para apenas chamar AuditService para LOGIN (POST /login) e LOGOUT
    - Rota `GET /audit-logs` (admin only, paginada, filtros: user_id, action, model_type, date_from, date_to)
  - **Frontend**:
    - Página `/auditoria` (admin only)
    - Tabela: data, usuário, ação (chip colorido), recurso, ID, IP
    - Filtros: usuário, período, tipo de ação, tipo de recurso
    - Expandir linha para ver diff (tabela before/after lado a lado)
    - Menu: adicionar "Auditoria" no grupo Sistema

---

## 🔧 REFATORAÇÃO / CODE REVIEW

- [ ] **REF-01** — `AuthController::register()` usa `password_hash()` misturado com `Hash::make()` e retorna array em vez de `response()->json()`
  - Substituir `password_hash()` por `Hash::make()`; retornar `response()->json([...], 201)`

- [ ] **REF-02** — `DashboardController::laboratorio()` — método monolítico de 90+ linhas com múltiplas queries
  - Extrair para `DashboardService` com métodos privados (`getTotais`, `getPedidosPorStatus`, etc.)

- [ ] **REF-03** — Lógica de transação duplicada em `ClientController`, `TripController`, etc.
  - Criar trait `HandlesTransactions` com método `executeTransaction(callable $cb)`

- [ ] **REF-04** — `LogController` e `ErrorLogController` sem paginação (`.take(3000)` hardcoded)
  - Implementar paginação padrão `per_page=50` com `paginate()`

- [ ] **REF-05** — `ConsultaPublicaController` expõe email e nome completo do paciente na consulta pública
  - Mascarar email (`d****@gmail.com`) e retornar apenas iniciais do nome

- [ ] **REF-06** — `ResultadoExameController::store()` sem transação — race condition possível em concorrência
  - Envolver `firstOrCreate()` em `DB::transaction()`

- [ ] **REF-07** — Frontend: `loginFetch` e `logoutFetch` sem padrão claro de loading; `turnLoading()` chamado 2x
  - Criar wrapper `apiAction(dispatch, fn)` que gerencia loading automaticamente

- [ ] **REF-08** — Frontend: `LabDashboard.js` recalcula meses sem `useMemo()`
  - Adicionar `useMemo()` nas funções de transformação de dados do dashboard

- [ ] **REF-09** — `LogController` e `ErrorLogController` retornam até 3000 registros sem paginação
  - Frontend: implementar paginação na tabela de logs

- [ ] **REF-10** — `ClientRequest.php` valida CPF com `digits:11` apenas — aceita CPFs inválidos
  - Criar regra customizada `ValidCpf` que verifica dígitos verificadores (módulo 11)

---

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA (FASE 2)

### Prioridade Alta
1. **UX-01** — Menu com dropdowns (UX imediata, baixo risco)
2. **AUD-01** — Auditoria de ações (compliance, segurança operacional)
3. **REF-01** — AuthController (segurança: hash consistente)
4. **REF-05** — Consulta pública (segurança: exposição de dados)
5. **REF-06** — Race condition resultados (bug potencial)

### Prioridade Média
6. **REF-02** — DashboardService (manutenibilidade)
7. **REF-04** — Paginação logs (performance)
8. **REF-10** — Validação CPF real (qualidade de dados)
9. **SEC-02** — Cookie httpOnly (segurança avançada)

### Prioridade Baixa
10. **REF-03** — Trait transações (DRY)
11. **REF-07/08** — Melhorias frontend (qualidade)
12. **REF-09** — Paginação frontend logs
