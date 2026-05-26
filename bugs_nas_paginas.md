# Catálogo de Bugs - Páginas e Modais

Data da varredura: 2026-05-21
Escopo: `pages/` e `src/components/modal/` (com pontos correlatos em `src/components/queue` e `src/components/messagesModal` quando impactam o fluxo de páginas/modais).
Status: somente catalogação. Nenhuma correção aplicada nesta etapa.

## Prioridade Alta

- [ ] **[BUG-001] Fechamento de modal baseado em `toggle` (`turnModal`) em vez de `closeModal` explícito**
  - Risco: comportamento não determinístico (fecha/reabre, estado invertido, regressões semelhantes ao bug da `/queue`).
  - Evidências:
    - [categoriaExame/index.js](C:\Users\dougl\workspace\src\components\modal\categoriaExame\index.js:32)
    - [client/index.js](C:\Users\dougl\workspace\src\components\modal\client\index.js:113)
    - [exame/index.js](C:\Users\dougl\workspace\src\components\modal\exame\index.js:41)
    - [exame/index.js](C:\Users\dougl\workspace\src\components\modal\exame\index.js:52)
    - [letter/index.js](C:\Users\dougl\workspace\src\components\modal\letter\index.js:66)
    - [medicoSolicitante/index.js](C:\Users\dougl\workspace\src\components\modal\medicoSolicitante\index.js:32)
    - [ordinance/index.js](C:\Users\dougl\workspace\src\components\modal\ordinance\index.js:94)
    - [pedido/index.js](C:\Users\dougl\workspace\src\components\modal\pedido\index.js:106)
    - [queue/index.js](C:\Users\dougl\workspace\src\components\modal\queue\index.js:128)
    - [routes/index.js](C:\Users\dougl\workspace\src\components\modal\routes\index.js:64)
    - [specialities/index.js](C:\Users\dougl\workspace\src\components\modal\specialities\index.js:57)
    - [vehicles/index.js](C:\Users\dougl\workspace\src\components\modal\vehicles\index.js:65)

- [ ] **[BUG-002] Controle de estado inconsistente de tipo (`string` vs `number`) em flags de negócio**
  - Risco: botões habilitados/desabilitados errado, filtros inconsistentes.
  - Evidências:
    - [queue/index.js](C:\Users\dougl\workspace\src\components\queue\index.js:655) `queue.done == '1'`
    - [queue/index.js](C:\Users\dougl\workspace\src\components\queue\index.js:764) `viewQueue.done == 1`
    - [user/index.js](C:\Users\dougl\workspace\src\components\modal\user\index.js:128)
    - [user/index.js](C:\Users\dougl\workspace\src\components\modal\user\index.js:129)

- [ ] **[BUG-003] Dependência ausente em `useEffect` no fluxo de filtros da fila**
  - Risco: lista não reage a mudanças de urgência em todos os caminhos de filtro.
  - Evidência:
    - [queue/index.js](C:\Users\dougl\workspace\src\components\queue\index.js:180) usa `urgency` no corpo do efeito, mas `urgency` não está no array de dependências.

## Prioridade Média

- [ ] **[BUG-004] Estado de formulário com chave indevida `setClient` dentro de `setForm`**
  - Risco: estado poluído e comportamento imprevisível em reset.
  - Evidência:
    - [modal/queue/index.js](C:\Users\dougl\workspace\src\components\modal\queue\index.js:124)

- [ ] **[BUG-005] Uso de chave instável em renderização de mensagens (`Math.random`)**
  - Risco: re-renderizações desnecessárias, perda de estado de componentes filhos.
  - Evidência:
    - [messagesModal/index.js](C:\Users\dougl\workspace\src\components\messagesModal\index.js:11)

- [ ] **[BUG-006] `mt={2}` aplicado diretamente em `Button` (prop não padrão em vários pontos)**
  - Risco: inconsistência visual e warnings dependendo da versão/configuração do MUI.
  - Evidências (amostra):
    - [modal/outcomequeue/index.js](C:\Users\dougl\workspace\src\components\modal\outcomequeue\index.js:188)
    - [modal/queue/index.js](C:\Users\dougl\workspace\src\components\modal\queue\index.js:552)
    - [modal/specialities/index.js](C:\Users\dougl\workspace\src\components\modal\specialities\index.js:135)
    - [modal/trips/index.js](C:\Users\dougl\workspace\src\components\modal\trips\index.js:243)
    - [modal/trips/clients/index.js](C:\Users\dougl\workspace\src\components\modal\trips\clients\index.js:355)

## Prioridade Baixa / Padronização

- [ ] **[BUG-007] Uso recorrente de igualdade frouxa (`==`)**
  - Risco: coerção implícita mascarando erros de tipo.
  - Evidências (amostra):
    - [queue/index.js](C:\Users\dougl\workspace\src\components\queue\index.js:514)
    - [showqueue/[[...uuid]].js](C:\Users\dougl\workspace\pages\showqueue\[[...uuid]].js:156)
    - [modal/trips/index.js](C:\Users\dougl\workspace\src\components\modal\trips\index.js:121)
    - [modal/trips/clients/index.js](C:\Users\dougl\workspace\src\components\modal\trips\clients\index.js:506)

- [ ] **[BUG-008] Possível acoplamento excessivo ao `isOpenModal` global em modais diferentes**
  - Risco: concorrência de estado quando múltiplas páginas/modais compartilham a mesma flag global.
  - Evidências:
    - Padrão identificado em múltiplos modais com `open={isOpenModal}` e fechamento por toggle.

## Páginas analisadas sem erro crítico imediato de modal

- `pages/queue.js` (container simples para componente de fila)
- `pages/showqueue/[[...uuid]].js` (detectado ponto de padronização de comparação de tipo, sem quebra crítica imediata)
- Demais páginas em `pages/` não apresentaram, na varredura estática rápida, erro crítico equivalente ao de fechamento de modal.

## TODO de execução futura (após aprovação)

- [ ] Substituir `turnModal()` por `openModal()`/`closeModal()` nos modais listados em BUG-001.
- [ ] Padronizar tipos numéricos/booleanos de flags (`done`, `urgency`, `is_driver`) e trocar `==` por `===`.
- [ ] Corrigir dependências de `useEffect` no componente de fila.
- [ ] Remover chave indevida `setClient` do estado de formulário do modal da fila.
- [ ] Corrigir chaves de lista em mensagens (substituir `Math.random()`).
- [ ] Padronizar espaçamento MUI via `sx` (substituir `mt={2}` em `Button`).
- [ ] Revalidar manualmente fluxos de abrir/fechar/cancelar em todos os modais após ajustes.
