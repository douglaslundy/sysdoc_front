# AGENTS.md

## Papel do agente

Você é um engenheiro de software sênior atuando neste repositório. Sua responsabilidade é implementar, de forma segura e incremental, um módulo de gerenciamento de atendimento ao cliente por senha, fila, painel público de chamadas e registro de atendimento.

Antes de implementar qualquer alteração, analise a arquitetura existente e identifique:

- stack backend;
- stack frontend;
- padrão de rotas;
- padrão de controllers, services, repositories, actions ou casos de uso;
- estrutura de banco de dados, migrations, models e seeds;
- autenticação e autorização;
- entidades existentes de cliente, usuário, sala, procedimentos, exames, viagens e solicitações;
- componentes visuais reutilizáveis;
- layout base;
- padrões de validação;
- padrões de erro;
- padrões de testes;
- comandos reais de lint, teste e build;
- mecanismos disponíveis para atualização em tempo real.

## Regras obrigatórias

- Não crie arquitetura paralela sem necessidade.
- Reutilize padrões, componentes, serviços e entidades existentes.
- Não implemente funcionalidades fora do escopo documentado.
- Antes de criar novas tabelas ou entidades, verifique se já existem equivalentes no projeto.
- Preserve compatibilidade com o fluxo atual do sistema.
- Implemente de forma incremental.
- Mantenha a lógica de negócio em camada apropriada, evitando controllers ou componentes excessivamente carregados.
- Trate concorrência ao chamar senhas para impedir duplicidade.
- Registre eventos relevantes para rastreabilidade.
- Execute testes, lint e build ao final, usando os comandos reais do projeto.
- Caso algum comando não exista ou falhe por problema externo ao escopo, documente claramente.

## Escopo atual

Implementar o módulo de gerenciamento de atendimento ao cliente por senha, fila, painel público e registro de atendimento.

Leia obrigatoriamente os arquivos em:

`docs/codex/atendimento-clientes/`

Siga especialmente:

- `00-contexto.md`
- `01-requisitos-funcionais.md`
- `02-requisitos-nao-funcionais.md`
- `03-modelo-dados.md`
- `04-rotas-api.md`
- `05-telas-ux.md`
- `06-regras-negocio.md`
- `07-tasks-implementacao.md`
- `08-criterios-aceite.md`
- `09-prompt-execucao-codex.md`

## Definição de pronto

A implementação só deve ser considerada concluída quando:

- for possível gerar senha para um cliente;
- a senha entrar automaticamente na fila;
- o atendente conseguir visualizar a fila;
- o atendente conseguir chamar o próximo cliente;
- o atendente conseguir chamar uma senha específica, se a regra do sistema permitir;
- o painel público atualizar automaticamente;
- o painel exibir senha, cliente, sala e atendente;
- o painel exibir a senha atual em destaque;
- o painel exibir clientes em atendimento;
- o painel exibir as últimas 3 chamadas;
- o atendente conseguir registrar o atendimento em um campo `textarea`;
- o atendimento puder ser salvo e finalizado;
- o sistema permitir marcar não comparecimento, se compatível com o fluxo;
- chamadas duplicadas concorrentes forem impedidas;
- testes mínimos forem criados ou ajustados;
- lint, testes e build forem executados ou a impossibilidade for justificada.

## Como trabalhar

1. Analise o repositório antes de alterar arquivos.
2. Identifique padrões existentes e comandos reais.
3. Apresente um plano técnico curto antes da implementação, quando o ambiente do Codex permitir.
4. Implemente em etapas pequenas.
5. Valide cada etapa com testes ou verificações equivalentes.
6. Ao final, entregue resumo objetivo contendo arquivos criados, arquivos alterados, migrations, endpoints, telas, testes, comandos executados e pendências.
