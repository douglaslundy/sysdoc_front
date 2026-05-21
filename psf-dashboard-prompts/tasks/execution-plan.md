# tasks/execution-plan.md — Plano de Execução (como foi implementado)

> Este documento descreve a ordem em que o módulo Monitor APS foi desenvolvido.
> As Fases 0 a 4 estão concluídas. A Fase 5 está pendente.

---

## FASE 0: Ambiente de Desenvolvimento (Docker)

### Task 0.1 — Subir PostgreSQL de dev ✅

```bash
cd psf-dashboard-prompts/modules/monitor-aps
docker compose -f docker/docker-compose.yml up -d
```

Verifica se o banco está com dados:
```sql
SELECT COUNT(*) FROM fat_cad_individual;  -- deve retornar ~300
SELECT nu_ine, no_equipe, tp_equipe FROM dim_equipe;
```

Credenciais de dev:
- Host: localhost | Porta: 5432 | Banco: esus
- Usuário: monitor_aps | Senha: monitor123

---

## FASE 1: Fundação — Conexão ao Banco (sysdoc_back)

### Task 1.1 — MonitorApsBaseController ✅

Arquivo: `sysdoc_back/app/Http/Controllers/MonitorApsBaseController.php`

- Método `db()` retorna conexão Laravel ao PostgreSQL eSUS PEC
- Prioridade: `storage/app/monitor-aps-config.json` → fallback: `pgsql_esus` via `.env`
- Adicionar conexão `pgsql_esus` em `config/database.php` com variáveis `APS_DB_*`

### Task 1.2 — MonitorApsConfigController ✅

Arquivo: `sysdoc_back/app/Http/Controllers/MonitorApsConfigController.php`

Endpoints:
- `GET /api/monitor-aps/config/status` — verifica conexão
- `GET /api/monitor-aps/config/equipes` — lista `dim_equipe`
- `POST /api/monitor-aps/config/test` — testa credenciais (admin)
- `POST /api/monitor-aps/config/save` — salva em `storage/app/monitor-aps-config.json` (admin)

Testar:
```bash
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/monitor-aps/config/status
```

### Task 1.3 — Registrar rotas no Laravel ✅

Arquivo: `sysdoc_back/routes/api.php`

Adicionar grupo `monitor-aps` com middleware `auth:sanctum` e `throttle:60,1`.

### Task 1.4 — Script SQL de setup do usuário ✅

Arquivo: `sysdoc_back/docs/setup-readonly-user.sql` (ou `psf-dashboard-prompts/docs/`)

CREATE USER monitor_aps com permissão somente SELECT no banco esus.

---

## FASE 2: Serviços de Indicadores (sysdoc_back)

### Task 2.1 — Exploração do schema DW ✅

Executar no banco de dev para confirmar estrutura:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE 'fat_%' OR table_name LIKE 'dim_%' OR table_name LIKE 'vw_%')
ORDER BY table_name;
```

Confirmar colunas das tabelas principais antes de escrever as queries.

### Task 2.2 — MonitorApsController — Vínculo ✅

Arquivo: `sysdoc_back/app/Http/Controllers/MonitorApsController.php`

Método `calcularVinculo()`: query em `fat_cad_individual` + `fat_cad_domiciliar` + `dim_equipe` + `dim_tempo`.

Testar:
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8000/api/monitor-aps/indicadores/vinculo?ano=2025&quadrimestre=2"
```

### Task 2.3 — MonitorApsController — Indicadores ESF (1-10) ✅

Métodos `calcularInd1` a `calcularInd10` no mesmo controller.

Para cada indicador:
1. Implementar query SQL com tabelas DW
2. Testar com INE real do banco de dev
3. Verificar classificação resultante

### Task 2.4 — MonitorApsController — Indicadores ESB (13-15) ✅

Métodos `calcularInd13`, `calcularInd14`, `calcularInd15`.

### Task 2.5 — MonitorApsController — Repasse e Resumo ✅

Método `calcularRepasseEstimado()` aplica `REPASSE_FIXO_IED` e `REPASSE_CLASS`.
Endpoint `resumo()` consolida vínculo + repasse + total de equipes.

### Task 2.6 — MonitorApsController — Histórico ✅

Método `historico()`: itera anos e quadrimestres, chama o método do indicador solicitado.

---

## FASE 3: Frontend (sysdoc_front)

### Task 3.1 — monitorApsApi.js ✅

Arquivo: `sysdoc_front/src/services/monitorApsApi.js`

Wrapper simples do Axios existente:
```javascript
import { api } from './api';
const BASE = '/monitor-aps';
export const monitorApsApi = {
    get:  async (path)       => (await api.get(BASE + path)).data,
    post: async (path, body) => (await api.post(BASE + path, body)).data,
};
```

### Task 3.2 — Componente Dashboard ✅

Arquivo: `sysdoc_front/src/components/monitor-aps/Dashboard.js`

- Cards: repasse estimado, status vínculo, status qualidade, alertas
- Tabela mapa de calor dos 15 indicadores por equipe
- Gráficos ApexCharts (linha repasse histórico, donut classificações)

### Task 3.3 — Componente VinculoTerritorial ✅

Arquivo: `sysdoc_front/src/components/monitor-aps/VinculoTerritorial.js`

- Cards de cadastros e grupos prioritários
- Tabela por equipe com classificação

### Task 3.4 — Componente IndicadoresQualidade ✅

Arquivo: `sysdoc_front/src/components/monitor-aps/IndicadoresQualidade.js`

- Filtros: equipe, bloco, ano, quadrimestre
- Grid de cards com gauge (ApexCharts radialBar), numerador/denominador, metas

### Task 3.5 — Componente PorEquipe ✅

Arquivo: `sysdoc_front/src/components/monitor-aps/PorEquipe.js`

- Seletor de equipe
- Cards de classificação por componente + repasse estimado
- Radar chart dos 15 indicadores (ApexCharts)
- Histórico em linha

### Task 3.6 — Componente Configuracoes ✅

Arquivo: `sysdoc_front/src/components/monitor-aps/Configuracoes.js`

- Form de conexão com banco (host, porta, banco, usuário, senha)
- Botão "Testar Conexão" e "Salvar"
- Badge de status: Conectado / Desconectado
- Tabela de equipes ativas (carregada após conexão)

### Task 3.7 — Pages (wrappers) ✅

Arquivos: `sysdoc_front/pages/monitor-aps/{index,vinculo,qualidade,equipe,configuracoes}.js`

Cada page é apenas um MUI Grid wrapping o componente correspondente.

---

## FASE 4: Integração

### Task 4.1 — Integração das Rotas no Laravel ✅

Rotas adicionadas em `sysdoc_back/routes/api.php` sob o grupo `monitor-aps`.

### Task 4.2 — Menu de navegação no sysdoc_front ✅

Entrada "Monitor APS" adicionada ao menu lateral do sistema.

### Task 4.3 — Variáveis de ambiente ✅

Documentadas em `sysdoc_back/.env.example`:
```bash
APS_DB_HOST=
APS_DB_PORT=5432
APS_DB_DATABASE=esus
APS_DB_USERNAME=monitor_aps
APS_DB_PASSWORD=
MONITOR_APS_MUNICIPIO_NOME=
MONITOR_APS_MUNICIPIO_IBGE=
MONITOR_APS_ESTRATO_IED=4
```

---

## FASE 6: Monitoramento de Visitas ACS/TACS (PENDENTE)

> Ver arquivo completo: `tasks/visitas-execution-plan.md`
> Agentes: `agents/06-visitas-backend-agent.md`, `agents/07-visitas-frontend-list-agent.md`, `agents/08-visitas-mapa-agent.md`

### Fase 6A — Backend API ⬜
- `VisitaAcsController.php` com métodos: index, show, mapa, equipes, agentes
- Rotas em `routes/api.php` dentro do grupo `monitor-aps`
- Testar todos os endpoints no banco de produção

### Fase 6B — Frontend Lista + Detalhe ⬜
- Duck Redux `visitasAcs` + fetch actions
- `VisitasList.js` com filtros (ano, mês, equipe, agente) e paginação
- `VisitaDetailModal.js` com relato + mapa Leaflet + Street View Mapillary
- Page `/monitor-aps/visitas`

### Fase 6C — Frontend Mapa ⬜
- `MapaVisitas.js` com Leaflet + OpenStreetMap
- Pins coloridos por equipe / agente / desfecho conforme modo ativo
- Tooltip no hover + modal ao clicar no pin
- Page `/monitor-aps/visitas/mapa`

---

## FASE 5: Testes e Refinamento (PENDENTE)

### Task 5.1 — Teste end-to-end

1. Subir Docker dev: `docker compose up -d`
2. Rodar `sysdoc_back`: `php artisan serve`
3. Rodar `sysdoc_front`: `npm run dev`
4. Acessar http://localhost:3000/monitor-aps
5. Verificar que todas as páginas carregam com dados reais do Docker
6. Testar filtros de equipe e período
7. Testar a página de Configurações (testar + salvar conexão)

### Task 5.2 — Validação dos thresholds

Acessar fichas técnicas oficiais:
https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas

Para cada indicador, verificar e atualizar os valores em `MonitorApsController::THRESHOLDS` com a fonte correta.

### Task 5.3 — Documentação final

Criar/atualizar `psf-dashboard-prompts/docs/INDICADORES.md`:
- Tabela dos 15 indicadores com fórmula, thresholds e tabela DW usada
- Instruções de produção (criar usuário read-only no eSUS PEC real)
- Guia de configuração para outro município
