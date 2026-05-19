# 00 — Contexto do módulo

## Objetivo

Implementar um módulo de gerenciamento de atendimento ao cliente em um sistema já existente.

O fluxo desejado é:

1. O cliente chega ao local de atendimento.
2. O cliente retira uma senha.
3. A senha insere o cliente em uma fila.
4. Um usuário responsável pelo atendimento chama o cliente da fila.
5. A senha chamada aparece em um painel público exibido em uma TV ou navegador.
6. O painel informa a senha, o nome do cliente, a sala de atendimento e o usuário responsável.
7. O atendente registra o que foi realizado durante o atendimento.
8. O atendimento é finalizado, cancelado ou marcado como não comparecimento, conforme o caso.

## Contexto operacional

O painel público deverá ser aberto em:

- navegador de Smart TV; ou
- navegador de computador conectado a uma TV; ou
- qualquer navegador moderno usado como tela pública de chamadas.

A tela do painel deverá ser adequada para exibição contínua em tela grande.

## Personas principais

### Cliente

Pessoa que chega ao atendimento e recebe uma senha.

### Atendente

Usuário autenticado no sistema que visualiza a fila, chama clientes, registra atendimento e finaliza o atendimento.

### Operador administrativo

Usuário que pode gerar senhas, configurar salas ou consultar histórico, caso o sistema já possua esse perfil.

### Público do painel

Usuários que visualizam a TV ou tela pública para saber qual senha foi chamada e para qual sala devem se dirigir.

## Premissas

- O sistema já possui alguma entidade de cliente ou pessoa atendida.
- O sistema já possui usuários autenticados.
- O sistema pode já possuir entidades de procedimentos, exames, viagens, solicitações ou filas relacionadas ao cliente.
- O Codex deverá procurar e reutilizar essas entidades antes de criar novas.
- O módulo deve respeitar a arquitetura atual do sistema.
- Faça um commit a cada tarefa realizada

## Restrições

- Não criar uma arquitetura independente da aplicação existente.
- Não duplicar entidades já existentes.
- Não criar regras complexas de prioridade se o sistema atual não possuir essa regra.
- Não criar impressão de senha se isso exigir integração complexa não existente. A impressão pode ser deixada como ponto futuro, salvo se for simples e alinhada ao stack.
- Não expor dados sensíveis desnecessários no painel público.
- Não faça push sem antes perguntar e receber a aprovação

## Resultado esperado

Ao final da implementação, o sistema deve permitir:

- gerar senha de atendimento para um cliente;
- listar a fila de senhas aguardando;
- chamar uma senha para uma sala e atendente;
- atualizar o painel automaticamente;
- visualizar a senha atual e últimas chamadas;
- registrar o atendimento realizado;
- finalizar ou encerrar o atendimento conforme status permitido;
- impedir chamada duplicada da mesma senha por concorrência.
