# SYSDOC — TODO MASTER

> Última atualização: 2026-05-04
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

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

1. FIX-01 (meus dados) — 1 linha, impacto alto
2. FIX-02 (exames 20) — 1 linha, impacto alto
3. FIX-05 (títulos com count) — visual, impacto médio
4. FIX-04 (tamanho ícones) — visual, impacto médio
5. MFG-01 (auth) — segurança, impacto alto
6. FIX-03 (modais campo/ref) — UX, impacto médio
7. MFG-02 (dashboards) — funcionalidade nova, impacto médio
8. FEAT-01 (seed perfis) — base para FEAT-02/03/04
9. FEAT-03 (CRUD páginas) — base para FEAT-02/04
10. FEAT-02 (CRUD perfis) — depende de FEAT-01/03
11. FEAT-04 (auth nas páginas) — depende de FEAT-01/02/03
12. FEAT-05 (reset senha) — independente, alto impacto UX
