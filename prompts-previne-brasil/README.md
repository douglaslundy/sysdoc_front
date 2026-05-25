# 🏥 Sistema de Prompts — Previne Brasil / Cofinanciamento da Atenção Básica

## Estrutura de Arquivos

```
prompts-previne-brasil/
├── README.md                        ← Este arquivo (navegação geral)
├── 01-contexto/
│   └── PROMPT_MASTER.md             ← Prompt principal de inicialização do projeto
├── 02-banco-dados/
│   └── PROMPT_MAPEAMENTO_BD.md      ← Engenharia reversa e documentação do banco
├── 03-financiamento/
│   └── PROMPT_DOCUMENTACAO_PREV.md  ← Estudo dos indicadores e regras do Previne Brasil
├── 04-dashboard/
│   └── PROMPT_DASHBOARD.md          ← Construção do dashboard de indicadores
└── 05-agentes-teste/
    └── PROMPT_AGENTES_TESTE.md      ← Agentes Claude Code para testes e QA
```

## Como Usar

### Passo 1 — Inicialização do Projeto
Copie e cole o conteúdo de `01-contexto/PROMPT_MASTER.md` no Claude Code.
Isso configura o agente com todo o contexto necessário.

### Passo 2 — Mapeamento do Banco de Dados
Use `02-banco-dados/PROMPT_MAPEAMENTO_BD.md` para o agente estudar o banco PostgreSQL.

### Passo 3 — Documentação do Previne Brasil
Use `03-financiamento/PROMPT_DOCUMENTACAO_PREV.md` para o agente aprender os indicadores.

### Passo 4 — Construção do Dashboard
Use `04-dashboard/PROMPT_DASHBOARD.md` para construir a interface de visualização.

### Passo 5 — Agentes de Teste
Use `05-agentes-teste/PROMPT_AGENTES_TESTE.md` para validar e corrigir o sistema.

---

> **Ambiente:** PostgreSQL (banco do e-SUS AB / PEC)
> **Sistema:** Cofinanciamento Federal da Atenção Básica (substituto do PMAQ + Previne Brasil)
> **Objetivo Final:** Dashboard completo de monitoramento de indicadores com nome individual de cidadãos
