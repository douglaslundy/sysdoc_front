# 05 — Telas e UX

## Tela 1 — Emissão de senha

Finalidade: registrar a chegada do cliente e gerar uma senha.

Componentes esperados:

- busca ou seleção de cliente;
- botão para gerar senha;
- exibição da senha gerada;
- horário de emissão;
- feedback visual de sucesso ou erro;
- opção de impressão apenas se já existir suporte simples no projeto.

Fluxo:

1. Usuário busca ou seleciona cliente.
2. Usuário confirma geração da senha.
3. Sistema cria senha com status `aguardando`.
4. Sistema mostra o código da senha.
5. Senha passa a aparecer na fila.

## Tela 2 — Fila do atendente

Finalidade: permitir que o usuário responsável pelo atendimento visualize e gerencie a fila.

Componentes esperados:

- lista de senhas aguardando;
- código da senha;
- nome do cliente;
- horário de chegada;
- tempo de espera, se possível;
- status;
- botão `Chamar próximo`;
- botão `Chamar` em uma senha específica, se permitido;
- seleção ou identificação da sala.

Cuidados:

- bloquear múltiplos cliques durante chamada;
- exibir mensagem caso a senha já tenha sido chamada por outro usuário;
- atualizar lista após chamada;
- manter ordenação por chegada, salvo regra de prioridade existente.

## Tela 3 — Atendimento

Finalidade: registrar o que foi realizado durante o atendimento.

Componentes esperados:

- código da senha;
- dados principais do cliente;
- sala;
- atendente;
- status;
- resumo de pendências do cliente;
- campo `textarea` para observações;
- botão `Salvar`;
- botão `Finalizar atendimento`;
- botão `Não compareceu`, se aplicável;
- feedback de salvamento.

Campo de observações:

- deve aceitar texto livre;
- deve persistir o conteúdo;
- deve ser carregado novamente se o atendente retornar à tela;
- deve ser salvo ao finalizar atendimento.

Resumo de pendências:

Exibir quando existirem dados no sistema:

- procedimentos pendentes;
- exames em espera;
- viagens agendadas ainda não realizadas;
- solicitações pendentes.

Se não houver dados:

```text
Nenhuma pendência encontrada.
```

## Tela 4 — Painel público

Finalidade: exibir chamadas em TV ou navegador.

O painel deve ser visualmente simples, com fonte grande e alto contraste.

Layout recomendado:

```text
-------------------------------------------------
|              SENHA CHAMADA                    |
|                                               |
|                  A001                         |
|              MARIA SILVA                      |
|                                               |
|              SALA 02                          |
|              Atendente: João                  |
-------------------------------------------------
| Em atendimento                                |
| A000 - Carlos Souza - Sala 01                 |
-------------------------------------------------
| Últimas chamadas                              |
| A999 - Paulo Lima - Sala 03                   |
| A998 - Ana Costa - Sala 02                    |
| A997 - José Santos - Sala 01                  |
-------------------------------------------------
```

Requisitos visuais:

- senha atual em destaque;
- nome do cliente legível;
- sala destacada;
- últimas chamadas em lista secundária;
- ausência de botões administrativos;
- layout responsivo para tela grande;
- compatibilidade com tela cheia do navegador;
- tolerância a longos períodos aberto.

Atualização:

- usar WebSocket se o sistema já possuir;
- usar SSE se for aderente ao stack;
- usar polling como fallback;
- em polling, usar intervalo configurável, por exemplo entre 5 e 15 segundos, conforme padrão do projeto.

## Estados vazios

### Fila vazia

```text
Nenhum cliente aguardando atendimento.
```

### Painel sem chamada

```text
Aguardando próxima chamada.
```

### Pendências vazias

```text
Nenhuma pendência encontrada.
```

## Acessibilidade mínima

- textos legíveis;
- botões com rótulos claros;
- evitar depender apenas de cor para indicar status;
- manter contraste adequado;
- evitar animações excessivas no painel.
