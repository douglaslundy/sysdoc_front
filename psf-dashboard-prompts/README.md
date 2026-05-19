# README — Monitor APS: Prompts para Claude Code

## O que é este pacote de prompts

Este diretório contém a estrutura completa de prompts, contextos e agentes para desenvolver o módulo **Monitor APS** usando o **Claude Code**. O módulo é um dashboard de acompanhamento de metas e indicadores do novo cofinanciamento federal da APS (Portaria GM/MS 3.493/2024).

---

## Como usar no Claude Code

### Passo 1: Copiar para o projeto
Copie o conteúdo deste diretório para a raiz do projeto existente onde o módulo será acoplado.

### Passo 2: Iniciar o Claude Code
```bash
cd /caminho/do/seu/projeto
claude
```

### Passo 3: O CLAUDE.md é lido automaticamente
O Claude Code lê automaticamente o arquivo `CLAUDE.md` na raiz do projeto. Este arquivo já contém todo o contexto normativo e as instruções do projeto.

### Passo 4: Executar a Task 0 PRIMEIRO (Docker)
```
Leia o arquivo tasks/task-0-docker-setup.md e execute.
```
Isso sobe o PostgreSQL local com dados de teste. Confirme que o banco está com ~300 registros antes de continuar.

### Passo 5: Executar as tasks em sequência
No Claude Code, diga:

```
Leia o arquivo tasks/execution-plan.md e execute a Task 1.1.
Confirme o que foi criado antes de continuar para a próxima task.
```

Depois:
```
Task 1.1 concluída. Execute a Task 1.2.
```

E assim por diante.

### Comandos úteis no Claude Code

```bash
# Ver estrutura criada até agora
ls -la modules/monitor-aps/

# Testar conexão ao banco (após Task 1.2)
node modules/monitor-aps/backend/src/scripts/test-connection.js

# Explorar schema do banco (Task 2.1)
node modules/monitor-aps/backend/src/scripts/explore-schema.js

# Iniciar servidor do módulo em dev
cd modules/monitor-aps/backend && npm run dev
```

---

## Estrutura dos Arquivos de Prompt

```
psf-dashboard-prompts/
├── CLAUDE.md                    ← Lido automaticamente pelo Claude Code
│                                  Contém: contexto normativo, indicadores, stack
│
├── context/
│   ├── project.md               ← Detalhes do município, comportamento esperado
│   └── esus-pec-database.md     ← Schema DW PEC, queries de exemplo
│
├── agents/
│   ├── 01-database-config-agent.md   ← Conexão ao banco, página de config
│   ├── 02-indicators-service-agent.md ← Cálculo dos 15 indicadores
│   ├── 03-frontend-dashboard-agent.md ← Interface React, dashboards
│   └── 04-integration-agent.md       ← Integração ao sistema existente
│
├── tasks/
│   └── execution-plan.md        ← Plano sequencial de 20 tasks
│
├── memory/
│   └── project-state.md         ← Estado atual, decisões, progresso
│
└── README.md                    ← Este arquivo
```

---

## Resumo do que será desenvolvido

### Contexto Normativo
O novo modelo de cofinanciamento federal da APS (**Portaria GM/MS 3.493/2024**) substituiu o Previne Brasil e o PMAQ. O município precisa acompanhar 3 componentes principais que impactam o repasse financeiro:

1. **Componente de Vínculo e Acompanhamento Territorial** — qualidade dos cadastros e acompanhamento de grupos prioritários
2. **Componente de Qualidade** — 15 indicadores de boas práticas clínicas
3. **Componente Fixo** — baseado no estrato IED do município

### Módulo que será criado

| Página | Conteúdo |
|--------|----------|
| Dashboard | Visão geral: repasse estimado, alertas, mapa de calor dos indicadores |
| Vínculo Territorial | Cadastros, grupos prioritários, pontuação por equipe |
| Indicadores de Qualidade | 15 indicadores com gauge, subindicadores, histórico |
| Por Equipe | Radar chart + histórico por equipe específica |
| Configurações | Conexão ao banco do eSUS PEC, seleção de equipes |

### Fonte dos dados
Acesso direto (somente leitura) ao **banco PostgreSQL do eSUS APS PEC** instalado localmente, usando o schema de Data Warehouse (tabelas `fat_`, `dim_`, `vw_`).

---

## Links de Referência Importantes

Durante o desenvolvimento, o Claude Code deve consultar:

| Recurso | URL |
|---------|-----|
| DW PEC (schema banco) | https://integracao.esusaps.bridge.ufsc.tech/dw/ |
| LEDI APS (integração) | https://integracao.esusaps.bridge.ufsc.tech/ledi/ |
| Portaria 3.493/2024 | https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html |
| Portaria 6.907/2025 | https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt6907_08_05_2025.html |
| FAQ Cofinanciamento MS | https://www.gov.br/saude/pt-br/composicao/saps/esf/faq-novo-modelo-de-cofinanciamento-federal-da-aps |
| Fichas técnicas indicadores | https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas |

---

## Aviso sobre Thresholds dos Indicadores

⚠️ **Os valores de meta (thresholds) para classificação ótimo/bom/suficiente/regular de cada indicador devem ser verificados nas fichas técnicas oficiais do Ministério da Saúde** (link acima). Os valores presentes nos arquivos de agente são estimativas baseadas em informações disponíveis até maio/2025, mas as fichas técnicas são a fonte oficial.

---

## Adaptação para outros municípios

Para usar este projeto em outro município, alterar em `context/project.md`:
- Nome e IBGE do município
- CNES da(s) UBS
- Estrato IED (verificar no SISAB)
- INEs das equipes

O resto do código é genérico e reutilizável.
