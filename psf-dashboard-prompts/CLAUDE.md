# CLAUDE.md — PSF Dashboard: Módulo de Metas e Indicadores do Cofinanciamento APS

## Visão Geral do Projeto

Você está desenvolvendo um **novo módulo** de dashboard acoplado a um sistema de gestão municipal já existente. O módulo se chama **"Monitor APS"** e tem como objetivo exibir, em tempo real, o progresso das metas e indicadores exigidos pelo novo modelo de cofinanciamento federal da Atenção Primária à Saúde (APS), instituído pela **Portaria GM/MS nº 3.493/2024** e atualizado pela **Portaria GM/MS nº 6.907/2025**.

A fonte de dados primária é o banco de dados PostgreSQL local da instalação do **e-SUS APS PEC** (Prontuário Eletrônico do Cidadão), acessado via conexão direta ao banco ou via estrutura DW (Data Warehouse) do PEC.

---

## Contexto Normativo: O Novo Cofinanciamento APS (Portaria 3.493/2024)

### Nome do Programa
**Nova Metodologia de Cofinanciamento Federal do Piso de Atenção Primária à Saúde**
- Substitui: Previne Brasil (Portaria 2.979/2019) e PMAQ (Portaria 1.654/2011)
- Base legal principal: Portaria GM/MS nº 3.493/2024 + Portaria GM/MS nº 6.907/2025

### 6 Componentes do Cofinanciamento

| Componente | Descrição |
|---|---|
| I - Fixo (Equidade) | Valor mensal fixo por equipe (eSF/eAP), baseado no IED |
| II - Vínculo e Acompanhamento Territorial | Qualidade do cadastro + acompanhamento de pessoas |
| III - Qualidade | Desempenho nos 15 indicadores de boas práticas |
| IV - Programas e Estratégias | Programas específicos (PSE, Academia da Saúde, ACS, etc.) |
| V - Atenção à Saúde Bucal | eSB, CEO, UOM, LRPD |
| VI - Per Capita de Base Populacional | Distribuição proporcional à população municipal |

### Classificações de Desempenho
As equipes são classificadas em: **Ótimo / Bom / Suficiente / Regular**

---

## Os 15 Indicadores do Componente de Qualidade (Portaria 6.907/2025 — vigência: 2º quadrimestre/2025)

### Bloco A: eSF e eAP (Equipes de Saúde da Família e Atenção Primária)

| Nº | Nome do Indicador | Descrição / Subindicadores-chave |
|---|---|---|
| 1 | **Mais Acesso à Atenção Primária** | Proporção de atendimentos por demanda programada, espontânea, escuta inicial, consulta do dia e urgência |
| 2 | **Cuidado Longitudinal da Criança** | ≥9 consultas presenciais/remotas (médico/enfermeiro) até 2 anos; ≥9 registros de peso/altura; ≥2 visitas domiciliares por ACS/TACS; vacinação completa (DTP, HepB, HiB, pólio, tríplice viral, pneumocócica) |
| 3 | **Cuidado da Gestante e Puérpera** | Pré-natal adequado (≥6 consultas), exames, vacinação, consulta puerperal |
| 4 | **Cuidado da Pessoa com Hipertensão** | Consultas periódicas, aferição de PA, controle pressórico |
| 5 | **Cuidado da Pessoa com Diabetes** | Consultas periódicas, HbA1c, controle glicêmico |
| 6 | **Cuidado da Pessoa Idosa** | Avaliação funcional, visitas domiciliares, rastreamentos |
| 7 | **Saúde Mental na APS** | Atendimentos de saúde mental, articulação com RAPS |
| 8 | **Visita Domiciliar por ACS/TACS** | Cobertura e frequência de visitas domiciliares |
| 9 | **Vacinação na APS** | Cobertura vacinal das vacinas do calendário nacional |
| 10 | **Ações Interprofissionais** | Projetos terapêuticos singulares, atividades coletivas, reuniões de equipe |

### Bloco B: eMulti (Equipes Multiprofissionais)

| Nº | Nome do Indicador |
|---|---|
| 11 | **Cuidado Interprofissional** (ações da eMulti integradas ao território) |
| 12 | **Apoio Matricial** (suporte às eSF nas condições crônicas e saúde mental) |

### Bloco C: eSB (Equipes de Saúde Bucal)

| Nº | Nome do Indicador |
|---|---|
| 13 | **Acesso à Saúde Bucal** (proporção de primeiras consultas odontológicas) |
| 14 | **Conclusão de Tratamento Odontológico** (proporção de tratamentos concluídos) |
| 15 | **Ações Coletivas em Saúde Bucal** (atividades educativas, escovação supervisionada) |

---

## Indicadores do Componente Vínculo e Acompanhamento Territorial

O sistema deve monitorar:
- **Completude do cadastro individual** (pontuação: 0,75/cadastro individual; 1,5/cadastro individual+domiciliar)
- **Cobertura de cadastro** por equipe (parâmetro de referência e teto máximo por porte municipal)
- **Grupos prioritários acompanhados**: crianças <5 anos, idosos >60 anos, beneficiários BPC, beneficiários Bolsa Família
- **Contatos, visitas e atendimentos** por equipe no quadrimestre

---

## Stack Tecnológica Obrigatória

```
Backend:   Node.js (Express) ou Python (FastAPI) — a ser definido conforme sistema existente
Database:  PostgreSQL (banco do eSUS PEC — acesso somente leitura)
Frontend:  React + Recharts/Chart.js + TailwindCSS
Schema DW: Estrutura DW PEC (integracao.esusaps.bridge.ufsc.tech/dw/)
```

---

## Arquitetura do Módulo

```
sistema-existente/
├── ... (código do sistema atual — NÃO MODIFICAR)
└── modules/
    └── monitor-aps/                  ← NOVO MÓDULO
        ├── backend/
        │   ├── src/
        │   │   ├── config/           ← Configuração de conexão ao PEC
        │   │   ├── queries/          ← Queries SQL ao DW do PEC
        │   │   ├── services/         ← Lógica de cálculo dos indicadores
        │   │   ├── routes/           ← Endpoints da API interna
        │   │   └── models/           ← Modelos de dados dos indicadores
        │   └── package.json
        └── frontend/
            ├── src/
            │   ├── pages/
            │   │   ├── Dashboard.jsx       ← Visão geral
            │   │   ├── VinculoTerritorial.jsx
            │   │   ├── IndicadoresQualidade.jsx
            │   │   ├── PorEquipe.jsx
            │   │   └── Configuracoes.jsx   ← Config de conexão DB
            │   ├── components/
            │   │   ├── IndicadorCard.jsx
            │   │   ├── GaugeChart.jsx
            │   │   ├── ProgressBar.jsx
            │   │   └── AlertaBloqueio.jsx
            │   └── services/
            │       └── api.js
            └── package.json
```

---

## Regras de Negócio Críticas

1. **Acesso ao banco é SOMENTE LEITURA** — jamais executar INSERT/UPDATE/DELETE no banco do eSUS PEC
2. **Usar schema `dw`** do PEC para relatórios, não as tabelas operacionais brutas
3. **Período de avaliação**: quadrimestral (jan-abr, mai-ago, set-dez)
4. **Classificação**: ótimo/bom/suficiente/regular — cada indicador tem threshold específico
5. **Bloqueio financeiro**: o sistema deve alertar quando equipe atinge critérios de suspensão (Anexo C da Portaria 6.907/2025)
6. **Multi-equipe**: o dashboard deve mostrar resultados individuais por INE (Identificador Nacional de Equipe) e consolidado municipal

---

## Ambiente de Desenvolvimento

O banco de dados usado em **desenvolvimento** é um **PostgreSQL em Docker** com dados fictícios, estruturalmente idêntico ao banco real do eSUS PEC. Nenhuma instalação manual é necessária além do Docker Desktop.

```bash
# Subir o banco de desenvolvimento
cd modules/monitor-aps
docker compose -f docker/docker-compose.yml up -d

# Credenciais de dev:
# Host: localhost | Porta: 5432 | Banco: esus
# Usuário: monitor_aps | Senha: monitor123
```

Em **produção** (SMS Ilicínea), basta preencher `.env.production` com as credenciais reais do servidor PostgreSQL do eSUS PEC. Nenhuma linha de código muda.

Ver detalhes completos em: `agents/05-docker-dev-agent.md`
**Executar sempre a Task 0 (Docker setup) antes de qualquer outra task.**

---

## Documentação de Referência

- DW PEC: https://integracao.esusaps.bridge.ufsc.tech/dw/index.html
- LEDI APS: https://integracao.esusaps.bridge.ufsc.tech/ledi/index.html
- Portaria 3.493/2024: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html
- Portaria 6.907/2025: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt6907_08_05_2025.html
- FAQ MS: https://www.gov.br/saude/pt-br/composicao/saps/esf/faq-novo-modelo-de-cofinanciamento-federal-da-aps
- Fichas técnicas indicadores: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
