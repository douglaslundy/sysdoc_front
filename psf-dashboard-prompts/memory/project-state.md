# memory/project-state.md — Estado e Decisões do Projeto

## Decisões de Arquitetura (como foi implementado)

### Stack Real

| Camada | Tecnologia | Localização |
|---|---|---|
| Backend | Laravel 10 (PHP 8.1) | `sysdoc_back/` |
| Frontend | Next.js 12 (React 17) | `sysdoc_front/` |
| Banco dev | PostgreSQL via Docker | `psf-dashboard-prompts/modules/monitor-aps/docker/` |
| Banco prod | PostgreSQL eSUS PEC (read-only) | Servidor da SMS Ilicínea |

**Decisão principal**: toda a lógica de indicadores fica em PHP (Laravel), não em Node.js. O módulo é integrado diretamente nos projetos existentes, sem serviço separado.

### Backend (sysdoc_back/Laravel)

- **Conexão ao eSUS PEC**: `MonitorApsBaseController::db()` — prioridade para `storage/app/monitor-aps-config.json`, fallback para `pgsql_esus` via `APS_DB_*` no `.env`
- **Lógica dos indicadores**: `MonitorApsController.php` — 15 indicadores + vínculo + repasse em PHP puro
- **Configuração**: `MonitorApsConfigController.php` — endpoints de status, test, save, equipes
- **Autenticação**: middleware `auth:sanctum` em todas as rotas `/api/monitor-aps/*`
- **Throttle**: 60 requisições/minuto
- **Acesso ao banco**: somente SELECT — zero INSERT/UPDATE/DELETE no eSUS PEC

### Frontend (sysdoc_front/Next.js)

- **Pages**: `pages/monitor-aps/{index,vinculo,qualidade,equipe,configuracoes}.js`
- **Components**: `src/components/monitor-aps/{Dashboard,VinculoTerritorial,IndicadoresQualidade,PorEquipe,Configuracoes}.js`
- **API**: `src/services/monitorApsApi.js` — wrapper do Axios existente, BASE = `/monitor-aps`
- **Sem dependências novas**: usa MUI v5 e ApexCharts já instalados no projeto

### Configuração dinâmica do banco

O banco eSUS PEC pode ser configurado de duas formas:
1. Via UI (Configurações): grava em `sysdoc_back/storage/app/monitor-aps-config.json`
2. Via `.env`: variáveis `APS_DB_*` como fallback

### Banco de Desenvolvimento

```
Docker: psf-dashboard-prompts/modules/monitor-aps/docker/docker-compose.yml
Host: localhost | Porta: 5432 | Banco: esus
Usuário: monitor_aps | Senha: monitor123
Dados: ~300 cidadãos, 2 eSF + 1 eSB, 2° quadrimestre 2025
```

---

## Informações do Município

```
Município: Ilicínea – MG
IBGE: 3131703
CNES UBS: 2794454
Estrato IED: 4
Portaria base: GM/MS 3.493/2024 (atualizada pela 6.907/2025)
```

---

## Thresholds dos Indicadores (MonitorApsController::THRESHOLDS)

| Indicador | Suficiente | Bom | Ótimo |
|---|---|---|---|
| 1 - Mais Acesso APS | 20% | 40% | 60% |
| 2 - Criança | 30% | 60% | 80% |
| 3 - Gestante | 40% | 65% | 85% |
| 4 - Hipertensão | 35% | 60% | 80% |
| 5 - Diabetes | 35% | 60% | 80% |
| 6 - Idoso | 30% | 55% | 75% |
| 7 - Saúde Mental | 15% | 30% | 50% |
| 8 - Visita ACS | 50% | 70% | 85% |
| 9 - Vacinação | 70% | 85% | 95% |
| 10 - Interprofissional | 20% | 40% | 60% |
| 13 - Acesso Bucal | 20% | 40% | 60% |
| 14 - Conclusão Odonto | 30% | 50% | 70% |
| 15 - Ações Coletivas Bucal | 10% | 25% | 40% |
| Vínculo | 40% | 65% | 85% |

⚠️ Verificar valores reais nas fichas técnicas oficiais do MS: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas

---

## Repasse Estimado

| Estrato IED | Componente Fixo/equipe |
|---|---|
| 1 | R$ 18.000 |
| 2 | R$ 16.000 |
| 3 | R$ 14.000 |
| 4 | R$ 12.000 (Ilicínea) |

| Classificação | Vínculo | Qualidade |
|---|---|---|
| Ótimo | R$ 8.000 | R$ 8.000 |
| Bom | R$ 6.000 | R$ 6.000 |
| Suficiente | R$ 4.000 | R$ 4.000 |
| Regular | R$ 2.000 | R$ 2.000 |

---

## Progresso das Tasks

- [x] Fase 0: Docker de desenvolvimento
- [x] Fase 1: Conexão ao banco (MonitorApsBaseController + MonitorApsConfigController)
- [x] Fase 2: Serviços de indicadores (MonitorApsController — 15 indicadores + vínculo + repasse)
- [x] Fase 3: Frontend (pages + components + monitorApsApi.js)
- [x] Fase 4: Integração (rotas Laravel + menu sysdoc_front)
- [ ] Fase 5: Testes e ajuste de thresholds com fichas técnicas oficiais
- [ ] Fase 6: Monitoramento de Visitas ACS/TACS (6A: Backend | 6B: Lista/Detalhe | 6C: Mapa)

---

## Fase 6 — Visitas ACS/TACS

### Decisões de Design

| Decisão | Escolha |
|---|---|
| Mapa base | Leaflet.js + OpenStreetMap (gratuito, sem API key) |
| Street View | Mapillary API (gratuito, cadastro em mapillary.com) — fallback: só mapa |
| Cor pins modo agente | Desfecho da visita (realizada/não encontrado/recusou) |
| Paginação | Server-side, 20 por página |
| Autenticação | `auth:sanctum` — mesmo middleware existente |

### Tabelas eSUS usadas (confirmar nomes em produção)

- `tb_fat_visita_domiciliar` — visitas (CBO ACS: 515105/516220, TACS: 322255)
- `tb_dim_equipe` — equipes
- `tb_dim_tempo` — dimensão tempo (nu_ano, nu_mes)

### Novos arquivos

```
sysdoc_back/app/Http/Controllers/VisitaAcsController.php
sysdoc_front/src/store/ducks/visitasAcs/index.js
sysdoc_front/src/store/fetchActions/visitasAcs/index.js
sysdoc_front/src/components/monitor-aps/visitas/VisitasList.js
sysdoc_front/src/components/monitor-aps/visitas/VisitaDetailModal.js
sysdoc_front/src/components/monitor-aps/visitas/MapaVisitas.js
sysdoc_front/pages/monitor-aps/visitas.js
sysdoc_front/pages/monitor-aps/visitas/mapa.js
```

### Rotas API

```
GET /monitor-aps/visitas            → lista paginada
GET /monitor-aps/visitas/mapa       → pins com lat/lng
GET /monitor-aps/visitas/{id}       → detalhe
GET /monitor-aps/visitas/equipes    → equipes com ACS
GET /monitor-aps/visitas/agentes    → agentes por equipe (?ine=)
```
