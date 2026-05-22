# CLAUDE.md — PSF Dashboard: Módulo de Metas e Indicadores do Cofinanciamento APS

## Visão Geral do Projeto

Você está desenvolvendo o módulo **Monitor APS** — um dashboard de acompanhamento de metas do novo modelo de cofinanciamento federal da Atenção Primária à Saúde (**Portaria GM/MS nº 3.493/2024** + **Portaria GM/MS nº 6.907/2025**) para a SMS de Ilicínea/MG.

O módulo está **integrado** a dois projetos existentes:

| Projeto | Stack | Localização | Função |
|---|---|---|---|
| **sysdoc_back** | Laravel 10 (PHP 8.1) | `C:\Users\dougl\workspace\sysdoc_back` | API REST — lógica dos 15 indicadores, config, repasse |
| **sysdoc_front** | Next.js 12 (React 17) | `C:\Users\dougl\workspace\sysdoc_front` | Interface — pages e components do Monitor APS |

**Não existe serviço Node.js separado.** Toda a lógica de cálculo fica no Laravel. O frontend chama diretamente o Laravel via Axios.

---

## Contexto Normativo: O Novo Cofinanciamento APS (Portaria 3.493/2024)

### 6 Componentes do Cofinanciamento

| Componente | Descrição |
|---|---|
| I - Fixo (Equidade) | Valor mensal fixo por equipe (eSF/eAP), baseado no IED |
| II - Vínculo e Acompanhamento Territorial | Qualidade do cadastro + acompanhamento de grupos prioritários |
| III - Qualidade | Desempenho nos 15 indicadores de boas práticas |
| IV - Programas e Estratégias | PSE, Academia da Saúde, ACS, etc. |
| V - Atenção à Saúde Bucal | eSB, CEO, UOM, LRPD |
| VI - Per Capita de Base Populacional | Proporcional à população municipal |

### Classificações de Desempenho
**Ótimo / Bom / Suficiente / Regular**

---

## Os 15 Indicadores do Componente de Qualidade (Portaria 6.907/2025)

### Bloco A: eSF e eAP (tp_equipe = 70 ou 71)

| Nº | Nome | Tabelas DW usadas |
|---|---|---|
| 1 | Mais Acesso à Atenção Primária | fat_atendimento_individual |
| 2 | Cuidado Longitudinal da Criança | fat_atendimento_individual, fat_visita_domiciliar, fat_vacinacao, fat_cad_individual |
| 3 | Cuidado da Gestante e Puérpera | vw_acompanhamento_pre_natal |
| 4 | Cuidado da Pessoa com Hipertensão | vw_acompanhamento_hipertensao |
| 5 | Cuidado da Pessoa com Diabetes | vw_acompanhamento_diabetes |
| 6 | Cuidado da Pessoa Idosa | fat_atendimento_individual, fat_cad_individual |
| 7 | Saúde Mental na APS | fat_atendimento_individual (CIAP2 P76-P99 ou CID10 F*) |
| 8 | Visita Domiciliar por ACS/TACS | fat_visita_domiciliar (CBO 516220) |
| 9 | Vacinação na APS | fat_vacinacao |
| 10 | Ações Interprofissionais | fat_ativ_coletiva |

### Bloco C: eSB (tp_equipe = 72)

| Nº | Nome | Tabelas DW usadas |
|---|---|---|
| 13 | Acesso à Saúde Bucal | fat_atendimento_odontologico (st_primeira_consulta) |
| 14 | Conclusão de Tratamento Odontológico | fat_atendimento_odontologico (st_conclusao_tratamento) |
| 15 | Ações Coletivas em Saúde Bucal | fat_ativ_coletiva |

---

## Arquitetura Real do Módulo

### Backend (sysdoc_back — Laravel)

```
app/Http/Controllers/
├── MonitorApsBaseController.php     ← conexão ao PostgreSQL eSUS PEC
│     Lê: storage/app/monitor-aps-config.json (prioridade)
│     Fallback: conexão pgsql_esus via APS_DB_* no .env
├── MonitorApsController.php         ← 15 indicadores + vínculo + repasse (PHP puro)
└── MonitorApsConfigController.php   ← config/status, config/test, config/save, config/equipes

routes/api.php
└── prefix: monitor-aps, middleware: auth:sanctum, throttle:60,1
    ├── GET indicadores/resumo
    ├── GET indicadores/vinculo
    ├── GET indicadores/qualidade
    ├── GET indicadores/qualidade/{id}
    ├── GET indicadores/repasse
    ├── GET indicadores/historico
    ├── GET config/status
    ├── GET config/equipes
    ├── POST config/test   (admin)
    └── POST config/save   (admin)
```

### Frontend (sysdoc_front — Next.js)

```
pages/monitor-aps/
├── index.js          ← Dashboard principal
├── vinculo.js        ← Vínculo Territorial
├── qualidade.js      ← 15 Indicadores de Qualidade
├── equipe.js         ← Análise por equipe
└── configuracoes.js  ← Configuração da conexão (admin)

src/components/monitor-aps/
├── Dashboard.js
├── VinculoTerritorial.js
├── IndicadoresQualidade.js
├── PorEquipe.js
└── Configuracoes.js

src/services/monitorApsApi.js  ← wrapper Axios, BASE = /monitor-aps
```

### Ambiente de Desenvolvimento

```bash
# 1. Subir o PostgreSQL de dev (dados fictícios de Ilicínea/MG)
cd psf-dashboard-prompts/modules/monitor-aps
docker compose -f docker/docker-compose.yml up -d
# → localhost:5432 | banco: esus | user: monitor_aps | senha: monitor123

# 2. Configurar sysdoc_back/.env:
APS_DB_HOST=localhost
APS_DB_PORT=5432
APS_DB_DATABASE=esus
APS_DB_USERNAME=monitor_aps
APS_DB_PASSWORD=monitor123

# 3. Rodar o backend Laravel
cd sysdoc_back && php artisan serve   # :8000

# 4. Rodar o frontend Next.js
cd sysdoc_front && npm run dev        # :3000
```

Em produção (SMS Ilicínea): preencher `APS_DB_*` no `.env` com as credenciais reais do servidor eSUS PEC.

---

## Regras de Negócio Críticas

1. **Acesso ao banco é SOMENTE LEITURA** — jamais INSERT/UPDATE/DELETE no banco do eSUS PEC
2. **Usar schema `public`** com tabelas DW (fat_, dim_, vw_) do PEC para relatórios
3. **Período de avaliação**: quadrimestral (jan-abr=1, mai-ago=2, set-dez=3)
4. **Classificação**: ótimo/bom/suficiente/regular — thresholds definidos em `THRESHOLDS` const no controller
5. **Bloqueio financeiro**: alertar quando equipe atinge critérios de suspensão (Anexo C, Portaria 6.907/2025)
6. **Multi-equipe**: mostrar resultados por INE e consolidado municipal

---

## Dados do Município (Ilicínea/MG)

- IBGE: 3131703
- CNES UBS: 2794454
- Estrato IED: 4 (configurável via `MONITOR_APS_ESTRATO_IED` no `.env`)

---

## Documentação de Referência

- DW PEC: https://integracao.esusaps.bridge.ufsc.tech/dw/index.html
- Portaria 3.493/2024: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html
- Portaria 6.907/2025: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt6907_08_05_2025.html
- Fichas técnicas indicadores: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
