# README — Monitor APS: Prompts para Claude Code

## O que é este pacote de prompts

Este diretório contém a estrutura de prompts, contextos e agentes para desenvolver o módulo **Monitor APS** usando o **Claude Code**. O módulo é um dashboard de acompanhamento de metas e indicadores do novo cofinanciamento federal da APS (Portaria GM/MS 3.493/2024 + 6.907/2025).

---

## Arquitetura Real

O módulo **não é um serviço separado**. Está integrado diretamente nos dois projetos existentes:

```
sysdoc_front (Next.js :3000)
  └── pages/monitor-aps/*
  └── src/components/monitor-aps/*
  └── src/services/monitorApsApi.js  ← chama Laravel via Axios
         ↓ HTTP Bearer token
sysdoc_back (Laravel :8000)
  └── routes/api.php  (prefix: monitor-aps, auth:sanctum)
  └── MonitorApsController.php       ← 15 indicadores em PHP
  └── MonitorApsConfigController.php ← config da conexão
  └── MonitorApsBaseController.php   ← conexão ao PostgreSQL
         ↓ PostgreSQL somente leitura
eSUS APS PEC (:5432)
  └── schema public (fat_, dim_, vw_)
```

---

## Como usar no Claude Code

### Passo 1: Subir o banco de desenvolvimento

```bash
cd psf-dashboard-prompts/modules/monitor-aps
docker compose -f docker/docker-compose.yml up -d
```

Banco disponível em `localhost:5432` com ~300 registros fictícios de Ilicínea/MG.

### Passo 2: Configurar o sysdoc_back

```bash
# Em sysdoc_back/.env
APS_DB_HOST=localhost
APS_DB_PORT=5432
APS_DB_DATABASE=esus
APS_DB_USERNAME=monitor_aps
APS_DB_PASSWORD=monitor123
MONITOR_APS_MUNICIPIO_NOME=Ilicínea
MONITOR_APS_MUNICIPIO_IBGE=3131703
MONITOR_APS_ESTRATO_IED=4
```

### Passo 3: Iniciar os projetos

```bash
# Terminal 1 — Backend Laravel
cd sysdoc_back && php artisan serve

# Terminal 2 — Frontend Next.js
cd sysdoc_front && npm run dev
```

### Passo 4: Consultar o plano de execução

```
Leia o arquivo tasks/execution-plan.md.
As Fases 0-4 estão concluídas.
Execute a Task 5.1 (teste end-to-end).
```

---

## Estrutura dos Arquivos de Prompt

```
psf-dashboard-prompts/
├── CLAUDE.md                    ← Contexto geral, stack, arquitetura, regras
├── README.md                    ← Este arquivo
│
├── context/
│   └── project.md               ← Detalhes do município, banco eSUS PEC
│
├── agents/
│   ├── 01-database-config-agent.md   ← Conexão ao banco (Laravel PHP)
│   ├── 02-indicators-service-agent.md ← MonitorApsController (15 indicadores PHP)
│   ├── 03-frontend-dashboard-agent.md ← Components React + monitorApsApi.js
│   ├── 04-integration-agent.md       ← Integração rotas Laravel + menu Next.js
│   └── 05-docker-dev-agent.md        ← Docker PostgreSQL de desenvolvimento
│
├── tasks/
│   └── execution-plan.md        ← Plano sequencial (Fases 0-5, marcação de status)
│
├── memory/
│   └── project-state.md         ← Estado atual, decisões, thresholds, progresso
│
├── docs/
│   └── INDICADORES.md           ← Tabela dos 15 indicadores com fórmulas (a completar)
│
└── modules/monitor-aps/
    └── docker/                  ← Docker Compose + schema DW + seed de dados
```

---

## Resumo do Módulo

### O que monitora

| Componente | O que mede |
|---|---|
| **Vínculo Territorial** | Cadastros individuais/domiciliares, grupos prioritários |
| **15 Indicadores de Qualidade** | Boas práticas clínicas por equipe (eSF/eAP/eSB) |
| **Repasse Estimado** | Valor financeiro federal por equipe e municipal |

### Páginas do módulo

| URL | Componente |
|---|---|
| `/monitor-aps` | Dashboard geral: scorecard + mapa de calor |
| `/monitor-aps/vinculo` | Cadastros e grupos prioritários |
| `/monitor-aps/qualidade` | Grid dos 15 indicadores com gauge |
| `/monitor-aps/equipe` | Radar chart + histórico por equipe |
| `/monitor-aps/configuracoes` | Configuração da conexão com o eSUS PEC |

---

## Adaptação para outro município

Alterar em `sysdoc_back/.env`:
- `MONITOR_APS_MUNICIPIO_NOME`
- `MONITOR_APS_MUNICIPIO_IBGE`
- `MONITOR_APS_ESTRATO_IED` (verificar no SISAB)
- `APS_DB_*` com credenciais do servidor PostgreSQL local do eSUS PEC

O código é genérico — não há IBGE ou CNES hardcoded nos controllers.

---

## Links de Referência

| Recurso | URL |
|---|---|
| DW PEC (schema banco) | https://integracao.esusaps.bridge.ufsc.tech/dw/ |
| Portaria 3.493/2024 | https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html |
| Portaria 6.907/2025 | https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt6907_08_05_2025.html |
| Fichas técnicas indicadores | https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas |

---

## Aviso sobre Thresholds

Os valores de meta (suficiente/bom/ótimo) em `MonitorApsController::THRESHOLDS` são estimativas baseadas nas informações disponíveis até maio/2025. **Verificar sempre nas fichas técnicas oficiais do Ministério da Saúde** antes de usar em produção.
