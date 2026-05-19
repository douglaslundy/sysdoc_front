# 07 — Tasks de implementação

## Task 1 — Analisar arquitetura existente

Inspecione o projeto e identifique:

- stack backend;
- stack frontend;
- padrão de banco/migrations;
- autenticação;
- autorização;
- entidades existentes;
- telas similares;
- serviços de tempo real;
- padrões de testes;
- comandos de desenvolvimento, lint, teste e build.

Não implemente nada antes dessa análise.

Entregável esperado:

- plano técnico de implementação aderente ao repositório.

## Task 2 — Localizar entidades existentes

Verifique se já existem entidades ou tabelas para:

- clientes/pessoas;
- usuários;
- salas/guichês/setores;
- procedimentos;
- exames;
- viagens;
- solicitações;
- atendimentos;
- filas;
- protocolos ou ocorrências.

Decisão:

- reutilizar entidades existentes quando possível;
- criar apenas o mínimo necessário quando não houver equivalente.

## Task 3 — Criar ou adaptar modelos de dados

Criar migrations/models necessários para:

- senha de atendimento;
- registro de atendimento;
- histórico de chamadas;
- salas, somente se não existir entidade equivalente.

Garantir índices para:

```text
status
client_id
assigned_user_id
room_id
issued_at
called_at
```

Adicionar constraints quando possível.

## Task 4 — Implementar serviços de domínio

Criar camada de serviço para:

- gerar senha;
- listar fila;
- chamar próxima senha;
- chamar senha específica;
- iniciar atendimento;
- salvar observações;
- finalizar atendimento;
- marcar não comparecimento;
- cancelar senha;
- obter estado do painel;
- obter pendências do cliente.

A lógica de negócio não deve ficar espalhada diretamente em controllers ou componentes de tela.

## Task 5 — Implementar endpoints

Criar rotas/controllers conforme padrão do projeto.

Validar:

- cliente obrigatório;
- sala obrigatória ao chamar;
- usuário autenticado obrigatório;
- status permitido para cada transição;
- atendimento não pode ser finalizado sem senha válida;
- senha finalizada não pode ser chamada novamente;
- senha cancelada não pode ser chamada novamente;
- senha marcada como não compareceu não pode ser chamada novamente.

## Task 6 — Implementar atualização do painel

Implementar uma das estratégias:

1. WebSocket, se já existir.
2. SSE, se já existir ou for adequado ao stack.
3. Polling, caso não exista infraestrutura de tempo real.

O painel deve consultar ou receber:

- chamada atual;
- clientes em atendimento;
- últimas 3 chamadas.

## Task 7 — Implementar tela de emissão de senha

Criar tela para gerar senha vinculada ao cliente.

Reutilizar componentes existentes de busca/seleção de cliente.

A tela deve:

- selecionar cliente;
- gerar senha;
- exibir código gerado;
- tratar erros;
- atualizar estado após criação.

## Task 8 — Implementar tela da fila do atendente

Criar tela operacional para visualizar fila e chamar clientes.

A tela deve:

- listar senhas aguardando;
- exibir cliente, horário e status;
- permitir chamar próximo;
- permitir chamar senha específica, se permitido;
- selecionar ou inferir sala;
- bloquear múltiplos cliques durante chamada;
- atualizar a lista após chamada.

## Task 9 — Implementar tela de atendimento

Criar tela de atendimento com:

- dados do cliente;
- dados da senha;
- sala;
- atendente;
- resumo de pendências;
- campo `textarea`;
- ação de salvar;
- ação de finalizar;
- ação de não comparecimento, se aplicável.

## Task 10 — Implementar painel público

Criar tela responsiva para TV/navegador.

A tela deve:

- destacar senha atual;
- exibir cliente, sala e atendente;
- exibir clientes em atendimento;
- exibir últimas 3 chamadas;
- atualizar automaticamente;
- funcionar por longos períodos;
- evitar controles administrativos.

## Task 11 — Criar testes

Criar testes conforme padrão existente.

Cobrir, no mínimo:

- geração de senha;
- inserção na fila;
- chamada da próxima senha;
- chamada de senha específica, se implementada;
- impedimento de chamada duplicada;
- alteração de status;
- registro de atendimento;
- finalização de atendimento;
- marcação de não comparecimento, se implementada;
- retorno do estado do painel;
- últimas 3 chamadas.

## Task 12 — Validar comandos finais

Executar comandos reais do projeto.

Exemplos, se aplicáveis:

```bash
npm test
npm run lint
npm run build
```

ou equivalentes:

```bash
pnpm test
pnpm lint
pnpm build
```

```bash
yarn test
yarn lint
yarn build
```

```bash
php artisan test
composer test
```

```bash
pytest
ruff check .
```

Documentar exatamente os comandos executados e seus resultados.
