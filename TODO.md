# SYSDOC — TODO MASTER

> Última atualização: 2026-05-05
> Responsável: Douglas / Claude Code

---

## LEGENDA
- [x] Concluído
- [ ] Pendente
- [~] Em andamento

---

## ✅ CONCLUÍDOS

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
- [x] **LAB-CRED** — Protocolo e senha gerados no cadastro do pedido (não na liberação)
  - `PedidoExameController::store()` cria ResultadoExame com credenciais pré-geradas
  - Dialog exibe protocolo + senha ao atendente imediatamente após criar o pedido
  - `liberar()` preserva protocolo pré-gerado, não sobrescreve

### Segurança / Auth
- [x] **SEC-01** — CORS, AdminOnly middleware, Sanctum expiry, cookie secure/sameSite, senha min:8
- [x] **SEC-02** — Token JWT em cookie httpOnly via Next.js BFF (/api/auth/login, /logout, /me)
- [x] **FIX-AUTH** — `_app.js`: layout baseado em rota (não cookie), sem flash, sem destruir sessão em erro de rede
- [x] **FIX-ADMIN** — FixAdminUserSeeder: CPF admin corrigido (profile=admin, active=true)

### RBAC — Controle de Acesso por Perfil
- [x] **RBAC-01** — MenuItems.js: removidos todos profile:[...] hardcoded (30 itens)
- [x] **RBAC-02** — Sidebar: filtra menu somente por myPermissions do banco
- [x] **RBAC-03** — AuthGuard: reescrito com permissionsLoaded, deny-by-default, admin bypass, prefix matching para sub-rotas
- [x] **RBAC-04** — AuthContext: add permissionsLoaded; consolida 2 fetches em 1 via Promise.all; handler de 401 centralizado
- [x] **RBAC-05** — /api/auth/me BFF: retorna permissions[] junto com user+token
- [x] **RBAC-06** — middleware.js (novo): redirect server-side para /login sem sessão
- [x] **RBAC-07** — FullLayout: remove requiredProfiles estático
- [x] **RBAC-08** — AccessProfileSeeder: add /paginas-sistema, /auditoria e /laboratorio/resultados

### UX / Interface
- [x] **UX-01** — Menu lateral com 8 grupos colapsáveis, auto-expand por rota, filtro por permissão
- [x] **FIX-LAYOUT-01** — showLayout baseado em rota: elimina hydration mismatch SSR/cliente
- [x] **FIX-LAYOUT-02** — Removida transition de margin-left no PageWrapper: elimina "quadrado branco"
- [x] **FIX-LAYOUT-03** — mt: "74px" → mt: "64px" na sidebar: elimina gap branco acima do logo
- [x] **FIX-10** — Ctrl+R deixa espaço vazio entre header e conteúdo
  - Fix: `position: fixed; top: 0; height: 100vh` no PaperProps do Drawer quando isDesktop
- [x] **FIX-BDAY** — Data de nascimento decrementa ao salvar cliente
  - Fix: string ISO da API passada direto sem `new Date()`

### Dashboards
- [x] **DASH-01** — Backend: 3 endpoints `/dashboard/fila`, `/dashboard/tfd`, `/dashboard/logs`
- [x] **DASH-02** — Frontend: página /dashboards com 4 abas (Laboratório, Fila, TFD, Logs/QR)
- [x] **DASH-DARK** — Labels dos gráficos de barras/linha/área com cor #b0bec5 para modo dark; categorias em maiúsculo
- [x] **DASH-TFD-HIST** — Dois novos gráficos no TFD:
  - "Total de Viagens por Mês (Últimos 12 Meses)" — barras agrupadas: viagens, pessoas, km
  - "Total por Ano (Últimos 5 Anos)" — barras agrupadas: viagens, pessoas, km

### Auditoria
- [x] **AUD-01** — Sistema de auditoria completo
  - Migration `audit_logs`, Model AuditLog, AuditService
  - Observers: User, Client, PedidoExame, ResultadoExame, Trip, AccessProfile, Speciality
  - Rota GET /audit-logs (admin only, paginada, filtros)
  - Frontend: página /auditoria com tabela, filtros e diff before/after

### Refatoração / Code Review
- [x] **REF-01** — AuthController: `Hash::make()` + `response()->json()` padronizado
- [x] **REF-02** — DashboardService extraído do DashboardController
- [x] **REF-03** — `DB::transaction()` em ClientController e TripController
- [x] **REF-04** — Paginação `per_page=50` em LogController e ErrorLogController
- [x] **REF-05** — Consulta pública: nome mascarado, email mascarado
- [x] **REF-06** — `lockForUpdate()` em ResultadoExameController (race condition)
- [x] **REF-07** — Wrapper `apiAction` para loading automático
- [x] **REF-08** — `useMemo()` no LabDashboard
- [x] **REF-09** — Paginação server-side em Logs e ErrorLogs (frontend)
- [x] **REF-10** — Regra customizada `ValidCpf` com módulo 11

### Bug Fixes Anteriores
- [x] **FIX-01** — Meus Dados: getUserFetch usando res.data.users em vez de res.data
- [x] **FIX-02** — Exames: getAllExames sem per_page, retornava só 1ª página de 20
- [x] **FIX-03** — Modais campo/referência fora do padrão (Dialog → Modal + BaseCard)
- [x] **FIX-04** — Ícones nas páginas de laboratório com tamanho inconsistente
- [x] **FIX-05** — Títulos sem contagem de registros
- [x] **FIX-06** — Logout não redirecionava para /login
- [x] **FIX-07** — Menu ignorava perfis dinâmicos do banco
- [x] **FIX-08** — AuthGuard não bloqueava acesso direto via URL para perfis dinâmicos
- [x] **FIX-09** — Modal de usuário exibia perfis hardcoded
- [x] **FIX-MENU** — "Serviços" movido de "Sistema" → "Atendimento"

---

## 🔲 PENDENTE

### Operacional — Servidor de Produção
- [ ] `php artisan migrate --force` (novas migrations do laboratório + auditoria)
- [ ] `php artisan db:seed --force` (seeders novos — insertOrIgnore, seguro em produção)
- [ ] Verificar se `react-apexcharts` está instalado no Vercel (`npm install react-apexcharts apexcharts`)
- [ ] `.env` backend: `APP_DEBUG=false`, `FRONTEND_URL=https://sysvendas.vercel.app`, `MAIL_*` configurados
- [ ] **DASH-TEST** — Verificar endpoints de dashboard em produção após migrate (queries dependem do schema)

### Opcional / Baixa Prioridade
- [ ] **REF-03b** — Trait `HandlesTransactions` (cosmético, código já funciona sem ele)
