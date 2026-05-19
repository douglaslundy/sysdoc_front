# 08 — Critérios de aceite

## Critérios gerais

A implementação será considerada concluída quando:

- for possível gerar uma senha para um cliente;
- a senha aparecer automaticamente na fila;
- o atendente conseguir visualizar a fila;
- o atendente conseguir chamar a próxima senha;
- o painel público atualizar automaticamente;
- o painel exibir senha, cliente, sala e atendente;
- o painel exibir a senha atual em destaque;
- o painel exibir clientes em atendimento;
- o painel exibir as últimas 3 chamadas;
- a tela de atendimento permitir registrar o que foi feito;
- o atendimento puder ser salvo;
- o atendimento puder ser finalizado;
- o sistema impedir duplicidade de chamada da mesma senha;
- o código seguir a arquitetura existente;
- houver testes mínimos para as regras principais.

## Critérios por funcionalidade

### Geração de senha

- Dado um cliente válido, quando o usuário gerar uma senha, então o sistema deve criar uma senha com status `aguardando`.
- A senha deve possuir código legível.
- A senha deve registrar data/hora de emissão.
- A senha deve estar vinculada ao cliente.

### Fila

- Dadas senhas aguardando, quando o atendente acessar a fila, então as senhas devem aparecer ordenadas por emissão.
- Dada uma fila vazia, a tela deve exibir mensagem clara.
- A fila deve ser atualizada após uma chamada.

### Chamada

- Dada uma senha aguardando, quando o atendente chamar, então a senha deve ser vinculada ao usuário e à sala.
- A chamada deve registrar data/hora.
- A chamada deve criar histórico.
- A chamada deve atualizar o painel.
- Duas chamadas concorrentes não podem chamar a mesma senha.

### Painel

- Dada uma nova chamada, o painel deve exibir a senha chamada.
- O painel deve exibir cliente, sala e atendente.
- O painel deve exibir últimas 3 chamadas.
- O painel deve funcionar sem atualização manual.
- O painel não deve expor dados sensíveis.

### Atendimento

- Dada uma senha chamada, o atendente deve conseguir abrir a tela de atendimento.
- O atendente deve conseguir digitar observações em `textarea`.
- O sistema deve salvar as observações.
- O sistema deve finalizar o atendimento.
- Ao finalizar, a senha deve mudar para `finalizada`.

### Pendências do cliente

- Se existirem módulos de pendências no sistema, o atendimento deve exibir resumo filtrado pelo cliente.
- Se não existirem pendências, deve exibir estado vazio.
- Se não existirem entidades relacionadas, a implementação deve ficar preparada para futura integração sem criar domínio desnecessário.

## Critérios técnicos

- Código aderente ao padrão do projeto.
- Nomes consistentes com convenções existentes.
- Migrations reversíveis quando o stack suportar.
- Índices aplicados às consultas principais.
- Validações de entrada implementadas.
- Tratamento de erro consistente com o sistema.
- Autorização respeitada.
- Testes cobrindo fluxo principal.
- Comandos finais executados ou justificativa clara em caso de impossibilidade.

## Relatório final esperado do Codex

Ao final, o Codex deve entregar resumo contendo:

- arquivos criados;
- arquivos alterados;
- migrations adicionadas;
- endpoints criados;
- telas criadas;
- serviços criados;
- testes criados ou alterados;
- comandos executados;
- resultado dos comandos;
- limitações;
- próximos passos recomendados.
