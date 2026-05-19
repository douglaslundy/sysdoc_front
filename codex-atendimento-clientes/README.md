# Pacote de especificação para Codex CLI — Atendimento de clientes

Este pacote contém uma estrutura de arquivos Markdown para orientar o Codex CLI na implementação de um módulo de atendimento por senha, fila, painel público e registro de atendimento.

## Como usar

1. Copie o arquivo `AGENTS.md` para a raiz do repositório do sistema.
2. Copie a pasta `docs/codex/atendimento-clientes/` para a mesma raiz do repositório.
3. Abra o Codex CLI na raiz do repositório.
4. Envie o comando abaixo:

```text
Leia o AGENTS.md e implemente integralmente o módulo descrito em docs/codex/atendimento-clientes/09-prompt-execucao-codex.md. Antes de alterar código, analise a arquitetura existente e apresente um plano técnico curto.
```

## Estrutura

```text
/
├── AGENTS.md
└── docs/
    └── codex/
        └── atendimento-clientes/
            ├── 00-contexto.md
            ├── 01-requisitos-funcionais.md
            ├── 02-requisitos-nao-funcionais.md
            ├── 03-modelo-dados.md
            ├── 04-rotas-api.md
            ├── 05-telas-ux.md
            ├── 06-regras-negocio.md
            ├── 07-tasks-implementacao.md
            ├── 08-criterios-aceite.md
            └── 09-prompt-execucao-codex.md
```
