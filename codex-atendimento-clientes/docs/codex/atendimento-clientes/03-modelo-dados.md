# 03 — Modelo de dados sugerido

Adapte os nomes, tipos e relacionamentos ao padrão do projeto.

Antes de criar qualquer tabela, verifique se já existem entidades equivalentes.

## Entidade: `attendance_tickets`

Representa a senha retirada pelo cliente.

Campos sugeridos:

```text
id
number
display_code
client_id
status
issued_at
called_at
started_at
finished_at
cancelled_at
no_show_at
assigned_user_id
room_id
created_at
updated_at
```

Descrição dos campos:

- `id`: identificador primário.
- `number`: número sequencial numérico.
- `display_code`: código legível da senha, por exemplo `A001`, `G023`, `P010` ou formato equivalente.
- `client_id`: referência para cliente/pessoa atendida.
- `status`: status atual da senha.
- `issued_at`: data e hora de emissão.
- `called_at`: data e hora da chamada.
- `started_at`: data e hora de início do atendimento, se separado da chamada.
- `finished_at`: data e hora de finalização.
- `cancelled_at`: data e hora de cancelamento.
- `no_show_at`: data e hora em que foi marcado não comparecimento.
- `assigned_user_id`: usuário atendente responsável.
- `room_id`: sala, guichê ou local de atendimento.

Status sugeridos:

```text
aguardando
chamada
em_atendimento
finalizada
cancelada
nao_compareceu
```

Índices sugeridos:

```text
status
client_id
assigned_user_id
room_id
issued_at
called_at
status + issued_at
status + called_at
```

Constraints sugeridas:

- impedir duplicidade de `display_code` no mesmo dia ou contexto operacional;
- validar status permitido, se o banco ou ORM suportar enum/check constraint;
- garantir integridade referencial com cliente, usuário e sala quando aplicável.

## Entidade: `attendance_records`

Representa o registro textual do atendimento.

Campos sugeridos:

```text
id
attendance_ticket_id
client_id
user_id
room_id
notes
started_at
finished_at
created_at
updated_at
```

Descrição dos campos:

- `attendance_ticket_id`: referência para a senha.
- `client_id`: cliente atendido.
- `user_id`: atendente responsável.
- `room_id`: sala do atendimento.
- `notes`: texto digitado pelo atendente no `textarea`.
- `started_at`: início do atendimento.
- `finished_at`: finalização do atendimento.

Observações:

- Se o projeto já possuir entidade de atendimento, protocolo ou ocorrência, avaliar reutilização.
- Se a aplicação preferir armazenar `notes` diretamente na senha, isso pode ser aceito desde que preserve rastreabilidade.

## Entidade: `attendance_calls`

Representa o histórico de chamadas exibidas no painel.

Campos sugeridos:

```text
id
attendance_ticket_id
client_id
user_id
room_id
called_at
created_at
updated_at
```

Finalidade:

- manter histórico independente da senha;
- facilitar exibição das últimas chamadas;
- apoiar auditoria;
- evitar depender apenas do status atual da senha.

Índices sugeridos:

```text
called_at
client_id
user_id
room_id
attendance_ticket_id
```

## Entidade: `rooms`

Criar somente se não existir entidade equivalente.

Campos sugeridos:

```text
id
name
description
active
created_at
updated_at
```

Exemplos:

```text
Sala 01
Sala 02
Consultório 03
Guichê 04
```

Observações:

- Se o sistema já possuir setor, sala, guichê, unidade, consultório ou local de atendimento, reutilizar.
- Se a sala for fixa por usuário, verificar se já existe configuração semelhante no cadastro de usuário.

## Sequência de senha

A numeração deve ser sequencial por dia, salvo se o sistema já possuir regra diferente.

Exemplo:

```text
A001
A002
A003
```

Estratégias possíveis:

- buscar maior número do dia e incrementar dentro de transação;
- usar tabela de sequência diária;
- usar sequence do banco combinada com data;
- usar mecanismo já existente no projeto.

A estratégia escolhida deve evitar duplicidade em concorrência.
