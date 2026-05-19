# 04 — Rotas e API sugeridas

Adapte nomes, verbos, controllers e estrutura ao padrão existente no projeto.

## Senhas

### Criar senha

```http
POST /attendance/tickets
```

Payload sugerido:

```json
{
  "clientId": "string"
}
```

Resposta sugerida:

```json
{
  "id": "string",
  "number": 1,
  "displayCode": "A001",
  "clientId": "string",
  "clientName": "Maria Silva",
  "status": "aguardando",
  "issuedAt": "2026-05-19T10:00:00"
}
```

### Listar senhas

```http
GET /attendance/tickets
```

Filtros sugeridos:

```text
status
clientId
issuedFrom
issuedTo
```

### Obter senha

```http
GET /attendance/tickets/:id
```

### Cancelar senha

```http
PATCH /attendance/tickets/:id/cancel
```

### Marcar não comparecimento

```http
PATCH /attendance/tickets/:id/no-show
```

## Fila

### Obter fila

```http
GET /attendance/queue
```

Resposta sugerida:

```json
[
  {
    "id": "string",
    "displayCode": "A001",
    "clientName": "Maria Silva",
    "status": "aguardando",
    "issuedAt": "2026-05-19T10:00:00",
    "waitingMinutes": 12
  }
]
```

### Chamar próximo

```http
POST /attendance/queue/call-next
```

Payload sugerido:

```json
{
  "roomId": "string"
}
```

Resposta sugerida:

```json
{
  "ticketId": "string",
  "displayCode": "A001",
  "clientName": "Maria Silva",
  "roomName": "Sala 02",
  "userName": "João Atendente",
  "calledAt": "2026-05-19T10:30:00"
}
```

### Chamar senha específica

```http
POST /attendance/queue/:ticketId/call
```

Payload sugerido:

```json
{
  "roomId": "string"
}
```

## Atendimento

### Obter tela/dados do atendimento

```http
GET /attendance/service/:ticketId
```

Resposta sugerida:

```json
{
  "ticket": {
    "id": "string",
    "displayCode": "A001",
    "status": "em_atendimento",
    "issuedAt": "2026-05-19T10:00:00",
    "calledAt": "2026-05-19T10:30:00"
  },
  "client": {
    "id": "string",
    "name": "Maria Silva"
  },
  "room": {
    "id": "string",
    "name": "Sala 02"
  },
  "attendant": {
    "id": "string",
    "name": "João Atendente"
  },
  "record": {
    "notes": ""
  },
  "pendingSummary": []
}
```

### Iniciar atendimento

```http
POST /attendance/service/:ticketId/start
```

### Salvar observações

```http
PATCH /attendance/service/:ticketId/notes
```

Payload sugerido:

```json
{
  "notes": "Texto do atendimento realizado."
}
```

### Finalizar atendimento

```http
POST /attendance/service/:ticketId/finish
```

Payload sugerido:

```json
{
  "notes": "Texto final do atendimento realizado."
}
```

## Painel

### Tela do painel

```http
GET /attendance/panel
```

### Estado atual do painel

```http
GET /attendance/panel/state
```

Resposta sugerida:

```json
{
  "currentCall": {
    "ticketCode": "A001",
    "clientName": "Maria Silva",
    "roomName": "Sala 02",
    "userName": "João Atendente",
    "calledAt": "2026-05-19T10:30:00"
  },
  "currentInService": [
    {
      "ticketCode": "A000",
      "clientName": "Carlos Souza",
      "roomName": "Sala 01",
      "userName": "Ana Atendente",
      "startedAt": "2026-05-19T10:20:00"
    }
  ],
  "lastCalls": [
    {
      "ticketCode": "A999",
      "clientName": "Paulo Lima",
      "roomName": "Sala 03",
      "userName": "Roberto Atendente",
      "calledAt": "2026-05-19T10:10:00"
    }
  ]
}
```

### Eventos do painel via SSE, se aplicável

```http
GET /attendance/panel/events
```

## Autorização sugerida

Adequar ao modelo existente.

Sugestão:

- emissão de senha: usuário administrativo, recepção ou perfil equivalente;
- fila e chamada: atendente ou perfil autorizado;
- atendimento: usuário autenticado responsável pela chamada ou perfil superior;
- painel: público interno ou rota protegida com token/configuração, conforme padrão do sistema.
