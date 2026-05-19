# 06 — Regras de negócio

## RB01 — Ordem da fila

A fila deve seguir a ordem de emissão da senha, salvo se o sistema já possuir regra de prioridade.

Regra padrão:

1. selecionar senhas com status `aguardando`;
2. ordenar por `issued_at` ascendente;
3. chamar a primeira senha da lista.

Se houver prioridade no sistema, respeitar prioridade antes da ordem cronológica.

## RB02 — Geração de senha

Ao gerar uma senha:

- validar cliente;
- gerar número sequencial;
- gerar código de exibição;
- definir status como `aguardando`;
- registrar data/hora de emissão;
- persistir de forma segura contra duplicidade.

A numeração deve ser preferencialmente diária, salvo regra diferente existente.

## RB03 — Chamada de senha

Ao chamar uma senha:

- a senha deixa de estar apenas como `aguardando`;
- deve ser vinculada ao atendente;
- deve ser vinculada à sala;
- deve registrar `called_at`;
- deve gerar registro em `attendance_calls` ou entidade equivalente;
- deve atualizar o painel;
- deve abrir ou habilitar a tela de atendimento.

## RB04 — Atendimento

O atendimento começa quando:

- a senha é chamada; ou
- o atendente aciona início formal de atendimento.

A escolha deve seguir o fluxo mais aderente ao sistema existente.

Durante o atendimento:

- o atendente pode registrar observações;
- as observações devem ser salvas;
- o atendimento deve manter vínculo com senha, cliente, atendente e sala.

Ao finalizar:

- salvar observações finais;
- alterar status para `finalizada`;
- registrar data/hora de finalização;
- impedir alterações indevidas, salvo se o sistema permitir edição posterior por perfil autorizado.

## RB05 — Não comparecimento

O sistema deve permitir marcar uma senha chamada como `nao_compareceu`, se isso for compatível com o fluxo.

Ao marcar não comparecimento:

- registrar data/hora;
- atualizar status para `nao_compareceu`;
- manter histórico da chamada;
- liberar atendente para chamar outro cliente;
- não remover o registro do histórico.

## RB06 — Cancelamento

O cancelamento deve ser permitido quando a senha ainda não foi finalizada.

Ao cancelar:

- atualizar status para `cancelada`;
- registrar data/hora do cancelamento;
- manter rastreabilidade.

## RB07 — Histórico do painel

O painel deve exibir as últimas 3 senhas chamadas, ordenadas da mais recente para a mais antiga.

A implementação deve decidir de forma consistente se a senha atual também aparece na lista de últimas chamadas.

Recomendação:

- `currentCall`: última chamada em destaque;
- `lastCalls`: três chamadas anteriores à atual.

Se for mais simples no projeto incluir a atual também em `lastCalls`, documentar essa decisão no código e manter consistência visual.

## RB08 — Transições de status

Transições recomendadas:

```text
aguardando -> chamada
chamada -> em_atendimento
em_atendimento -> finalizada
chamada -> nao_compareceu
aguardando -> cancelada
chamada -> cancelada
em_atendimento -> cancelada, somente se a regra do sistema permitir
```

Transições proibidas:

```text
finalizada -> chamada
cancelada -> chamada
nao_compareceu -> chamada
finalizada -> aguardando
```

## RB09 — Sala de atendimento

A chamada deve estar vinculada a uma sala.

A sala pode ser:

- selecionada manualmente pelo atendente;
- vinculada ao usuário autenticado;
- inferida de configuração existente no sistema.

Se nenhuma configuração existir, implementar seleção simples de sala ao chamar.

## RB10 — Pendências do cliente

O resumo de pendências deve consultar entidades já existentes.

Não criar módulos complexos de procedimentos, exames, viagens ou solicitações apenas para preencher o resumo.

Caso as entidades não existam:

- exibir estado vazio;
- isolar a lógica em service ou função própria para futura integração.
