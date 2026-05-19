# 01 — Requisitos funcionais

## RF01 — Gerar senha de atendimento

Criar funcionalidade para geração de senha de atendimento para um cliente.

A senha deverá:

- possuir identificador único;
- possuir número sequencial legível;
- estar vinculada ao cliente;
- possuir data e hora de emissão;
- possuir status inicial `aguardando`;
- ser inserida automaticamente na fila de atendimento.

Status sugeridos:

```text
aguardando
chamada
em_atendimento
finalizada
cancelada
nao_compareceu
```

Critérios de aceite:

- ao gerar uma senha, ela deve aparecer na fila de atendimento;
- a numeração deve ser sequencial por dia ou conforme padrão existente no sistema;
- o sistema não deve gerar duas senhas iguais para o mesmo contexto operacional;
- a senha deve registrar data, hora, cliente e status;
- a geração deve validar a existência do cliente.

## RF02 — Gerenciar fila de atendimento

Criar tela para usuários responsáveis pelo atendimento visualizarem a fila.

A tela deverá exibir:

- senhas aguardando atendimento;
- nome do cliente;
- horário de chegada ou emissão da senha;
- tempo de espera, se tecnicamente simples;
- status da senha;
- ação para chamar o próximo cliente;
- ação para chamar uma senha específica, se permitido pela regra do sistema.

Critérios de aceite:

- o atendente deve conseguir chamar o próximo cliente da fila;
- o sistema deve impedir chamada duplicada da mesma senha por dois usuários simultaneamente;
- a fila deve ser ordenada por data/hora de emissão, salvo regra de prioridade já existente;
- o status da senha deve ser atualizado ao ser chamada;
- a tela deve refletir alterações sem exigir navegação manual excessiva.

## RF03 — Chamar senha para atendimento

Ao chamar uma senha, o sistema deverá:

- alterar o status da senha para `chamada` ou `em_atendimento`, conforme aderência ao fluxo existente;
- vincular a chamada ao usuário atendente;
- vincular a chamada a uma sala de atendimento;
- registrar data e hora da chamada;
- criar registro no histórico de chamadas;
- enviar a informação para o painel público;
- abrir ou disponibilizar a tela de atendimento para o usuário responsável.

Dados mínimos da chamada:

```text
Senha: [número/código da senha]
Cliente: [nome do cliente]
Sala: [nome ou número da sala]
Atendente: [nome do usuário]
```

Critérios de aceite:

- ao chamar uma senha, o painel deve ser atualizado;
- o painel deve mostrar senha, cliente, sala e atendente;
- a chamada deve ser persistida no banco;
- a operação deve ser transacional ou protegida contra concorrência;
- senha em status finalizado, cancelado ou não compareceu não pode ser chamada novamente.

## RF04 — Painel público de chamadas

Criar tela pública ou protegida conforme padrão do sistema para exibição em TV, Smart TV ou navegador.

A tela deverá exibir:

- senha atual chamada em destaque;
- nome do cliente chamado;
- sala de atendimento;
- usuário/atendente responsável;
- clientes atualmente em atendimento;
- últimas 3 senhas chamadas.

Requisitos visuais:

- fonte grande e legível;
- layout limpo;
- contraste adequado;
- atualização automática sem recarregar a página;
- compatibilidade com navegador moderno de Smart TV ou desktop;
- preferência por tela que funcione por longos períodos;
- evitar controles administrativos no painel público.

Critérios de aceite:

- o painel deve atualizar quando uma nova senha for chamada;
- o painel deve exibir a senha atual em destaque;
- o painel deve manter histórico das últimas 3 chamadas;
- o painel deve funcionar em navegador sem interação constante do usuário;
- caso não exista WebSocket/SSE, implementar polling com intervalo configurável e seguro.

## RF05 — Tela de atendimento

Após chamar o cliente, o atendente deverá acessar uma tela de atendimento vinculada à senha.

Essa tela deverá conter:

- dados da senha;
- dados do cliente;
- sala;
- atendente;
- status do atendimento;
- campo `textarea` para registro do que foi realizado;
- botão para salvar observações;
- botão para finalizar atendimento;
- botão para cancelar ou marcar como não compareceu, se aplicável.

Critérios de aceite:

- o sistema deve salvar o texto digitado pelo atendente;
- o atendimento deve poder ser finalizado;
- ao finalizar, o status deve mudar para `finalizada`;
- o atendimento deve manter vínculo com cliente, senha, atendente e sala;
- o registro deve ficar disponível para consulta posterior, se existir tela de histórico ou API equivalente.

## RF06 — Resumo de pendências do cliente

Na tela de atendimento, quando tecnicamente possível, exibir resumo das pendências vinculadas ao cliente.

O resumo poderá incluir:

- procedimentos ou exames em fila de espera;
- viagens agendadas e ainda não realizadas;
- solicitações pendentes;
- outros processos relacionados ao cliente, caso já existam no sistema.

A implementação deve primeiro verificar se essas informações já existem no banco ou em módulos existentes.

Critérios de aceite:

- caso existam entidades/módulos de procedimentos, exames, viagens ou solicitações, exibir resumo filtrado pelo cliente;
- caso não existam, criar componente ou service preparado para futura integração, sem inventar entidades complexas fora do escopo;
- a ausência de pendências deve ser exibida de forma clara, por exemplo: `Nenhuma pendência encontrada`;
- não exibir dados sensíveis desnecessários no painel público.

## RF07 — Histórico de chamadas

O sistema deve manter histórico de chamadas realizadas.

O histórico deve registrar:

- senha;
- cliente;
- usuário atendente;
- sala;
- data e hora da chamada.

Critérios de aceite:

- o painel deve conseguir obter as últimas 3 chamadas a partir do histórico;
- o histórico não deve ser apagado ao finalizar atendimento;
- o histórico deve permitir auditoria mínima da operação.
