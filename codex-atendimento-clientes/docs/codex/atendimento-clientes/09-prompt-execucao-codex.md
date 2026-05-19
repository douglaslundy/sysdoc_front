# 09 — Prompt de execução para Codex CLI

Implemente o módulo de atendimento ao cliente descrito nos arquivos desta pasta:

`docs/codex/atendimento-clientes/`

Antes de alterar código:

1. Leia o `AGENTS.md` da raiz do repositório.
2. Analise a arquitetura existente.
3. Identifique backend, frontend, banco, migrations, autenticação, autorização e padrões de testes.
4. Localize entidades existentes de cliente, usuário, sala, procedimentos, exames, viagens e solicitações.
5. Verifique se existe mecanismo de tempo real: WebSocket, SSE ou polling.
6. Identifique os comandos reais de lint, teste e build.
7. Planeje a implementação incremental.

Depois implemente:

1. Modelo de dados necessário.
2. Serviços de domínio.
3. Endpoints/rotas.
4. Tela de emissão de senha.
5. Tela de fila do atendente.
6. Tela de atendimento com campo `textarea`.
7. Painel público para TV/navegador.
8. Estado do painel com senha atual, clientes em atendimento e últimas 3 chamadas.
9. Proteção contra chamada duplicada.
10. Testes mínimos.

Regras obrigatórias:

- Respeite a arquitetura existente.
- Reutilize entidades, services e componentes já existentes quando possível.
- Não crie domínio desnecessário para procedimentos, exames, viagens ou solicitações; apenas integre se já existirem.
- Trate concorrência na chamada de senha.
- Não exponha dados sensíveis no painel público.
- Mantenha o painel compatível com navegador moderno de TV ou desktop.
- Use WebSocket/SSE somente se aderente ao projeto; caso contrário, use polling.

Ao final, entregue um resumo com:

- arquivos criados;
- arquivos alterados;
- migrations criadas;
- endpoints adicionados;
- telas criadas;
- serviços criados;
- testes adicionados;
- comandos executados;
- resultado dos comandos;
- limitações ou pontos pendentes.

## Comando sugerido no Codex CLI

Depois de copiar estes arquivos para a raiz do repositório, abra o Codex CLI e envie:

```text
Leia o AGENTS.md e implemente integralmente o módulo descrito em docs/codex/atendimento-clientes/09-prompt-execucao-codex.md. Antes de alterar código, analise a arquitetura existente e apresente um plano técnico curto.
```
