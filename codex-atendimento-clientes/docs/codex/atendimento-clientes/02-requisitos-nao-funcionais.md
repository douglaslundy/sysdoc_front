# 02 — Requisitos não funcionais

## RNF01 — Integração com o sistema existente

A implementação deve seguir os padrões já utilizados no projeto.

Reutilizar, quando existirem:

- autenticação;
- autorização;
- perfis de usuário;
- layout base;
- componentes visuais;
- serviços de API;
- camada de acesso a dados;
- sistema de migrations;
- tratamento de erros;
- validações;
- logs;
- testes automatizados.

Critério de aceite:

- o módulo deve parecer parte nativa do sistema existente, sem estilo visual ou arquitetura divergente.

## RNF02 — Concorrência e consistência

O sistema deve impedir que dois atendentes chamem a mesma senha simultaneamente.

Implementar proteção usando a estratégia mais adequada ao stack existente:

- transação no banco;
- lock otimista;
- lock pessimista;
- atualização condicional por status;
- constraint de integridade;
- controle transacional em camada de service.

Critério de aceite:

- duas chamadas simultâneas não podem atribuir a mesma senha a dois atendentes diferentes.

## RNF03 — Atualização em tempo real

O painel deve receber atualizações automaticamente.

Prioridade técnica:

1. Reutilizar mecanismo de tempo real já existente no sistema.
2. Caso exista WebSocket, usar WebSocket.
3. Caso exista Server-Sent Events, usar SSE.
4. Caso não exista infraestrutura adequada, implementar polling com intervalo configurável.

Critérios de aceite:

- o painel não deve exigir atualização manual;
- nova chamada deve aparecer automaticamente;
- a solução deve ser compatível com navegador de TV ou desktop;
- falhas de conexão devem ser toleradas, com nova tentativa ou nova consulta posterior.

## RNF04 — Auditoria e rastreabilidade

Registrar eventos importantes:

- emissão da senha;
- chamada da senha;
- início do atendimento;
- salvamento de observações;
- finalização do atendimento;
- cancelamento;
- não comparecimento;
- usuário responsável;
- data e hora de cada evento.

Critério de aceite:

- deve ser possível rastrear quem chamou, quando chamou, para qual sala e qual cliente foi atendido.

## RNF05 — Segurança e privacidade

O painel público deve exibir apenas informações necessárias ao encaminhamento do cliente.

Evitar no painel:

- documentos pessoais;
- telefones;
- endereços;
- informações clínicas ou sensíveis;
- descrição de solicitações internas.

Critério de aceite:

- o painel deve exibir somente senha, nome do cliente, sala e atendente, salvo decisão explícita do produto.

## RNF06 — Performance

A fila e o painel devem responder rapidamente mesmo com volume moderado de senhas.

Adicionar índices apropriados para consultas por:

- status;
- cliente;
- usuário;
- sala;
- data de emissão;
- data de chamada.

Critério de aceite:

- consultas principais do painel e fila devem usar ordenação e filtros indexáveis.

## RNF07 — Compatibilidade de navegador

O painel deve ser compatível com navegadores modernos de desktop e, na medida do possível, navegadores de Smart TV.

Evitar dependências de recursos muito recentes sem fallback.

Critério de aceite:

- o painel deve funcionar por polling mesmo que WebSocket ou SSE não esteja disponível no navegador.
