# Módulo de Laboratório — Documentação

## O que foi implementado

Sistema completo de gestão de exames laboratoriais integrado ao projeto Sysdoc, com:

- **Catálogo de exames** com campos dinâmicos e valores de referência por perfil de paciente
- **Pedidos de exame** vinculados a clientes, com seleção múltipla de exames
- **Preenchimento de resultados** com cálculo automático de status (normal / baixo / alto / crítico)
- **Liberação de laudos** com geração de protocolo não sequencial, senha hasheada e PDF
- **Envio de e-mail** com protocolo e senha para o paciente (via Queue)
- **Consulta pública** de resultado por protocolo + senha (endpoint com throttle de 10 req/min)

---

## Dependências a instalar

```bash
# DomPDF para geração de PDF (obrigatório)
composer require barryvdh/laravel-dompdf

# Configurar fila para e-mails (se QUEUE_CONNECTION=sync, o mail é enviado sincronamente)
# Para processamento assíncrono:
php artisan queue:table
php artisan migrate
# E no .env: QUEUE_CONNECTION=database
```

---

## Variáveis de ambiente necessárias (backend)

```
# E-mail (obrigatório para envio do laudo)
MAIL_MAILER=smtp
MAIL_HOST=seu-smtp.host.com
MAIL_PORT=587
MAIL_USERNAME=usuario@dominio.com
MAIL_PASSWORD=senha
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=lab@dominio.com
MAIL_FROM_NAME="Laboratório"

# Fila (opcional — sync dispara no mesmo request)
QUEUE_CONNECTION=sync
```

---

## Migrations

```bash
php artisan migrate
```

Tabelas criadas (em ordem de FK):

| Tabela | Descrição |
|--------|-----------|
| `exames` | Catálogo de exames |
| `exame_campos` | Campos de cada exame |
| `campo_referencias` | Valores de referência por perfil |
| `pedidos_exame` | Pedido de exames para um cliente (soft delete) |
| `pedido_exame_itens` | Relação pedido ↔ exame (pivot) |
| `resultado_exames` | Resultado de um pedido (1:1) |
| `resultado_campos` | Valores preenchidos por campo |

---

## Endpoints

### Público (sem autenticação)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| POST | `/api/consulta-exame` | `{ protocolo, senha }` | Consulta resultado por protocolo e senha. Throttle: 10/min por IP. |

### Autenticados (`Authorization: Bearer {token}`)

#### Exames

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/laboratorio/exames` | Lista exames. Params: `busca`, `ativo`, `categoria`, `per_page` |
| POST | `/api/laboratorio/exames` | Cria exame |
| GET | `/api/laboratorio/exames/{id}` | Detalha exame com campos |
| PUT | `/api/laboratorio/exames/{id}` | Atualiza exame |
| DELETE | `/api/laboratorio/exames/{id}` | Remove exame |

#### Campos do Exame

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/laboratorio/exames/{exame}/campos` | Lista campos |
| POST | `/api/laboratorio/exames/{exame}/campos` | Cria campo |
| PUT | `/api/laboratorio/exames/{exame}/campos/{campo}` | Atualiza campo |
| DELETE | `/api/laboratorio/exames/{exame}/campos/{campo}` | Remove campo |
| PATCH | `/api/laboratorio/exames/{exame}/campos/reordenar` | Reordena campos. Body: `{ ordem: [id1, id2, ...] }` |

#### Referências por Campo

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/laboratorio/campos/{campo}/referencias` | Lista referências |
| POST | `/api/laboratorio/campos/{campo}/referencias` | Cria referência |
| PUT | `/api/laboratorio/campos/{campo}/referencias/{referencia}` | Atualiza referência |
| DELETE | `/api/laboratorio/campos/{campo}/referencias/{referencia}` | Remove referência |

Perfis disponíveis: `geral`, `adulto_m`, `adulto_f`, `crianca`, `idoso`, `gestante`

#### Pedidos de Exame

| Método | Rota | Body / Params | Descrição |
|--------|------|---------------|-----------|
| GET | `/api/laboratorio/pedidos` | `status`, `client_id`, `data_de`, `data_ate`, `per_page` | Lista pedidos paginados |
| POST | `/api/laboratorio/pedidos` | `{ client_id, exames[], data_pedido, medico_solicitante?, data_coleta?, observacoes? }` | Cria pedido |
| GET | `/api/laboratorio/pedidos/{id}` | — | Detalha pedido completo |
| DELETE | `/api/laboratorio/pedidos/{id}` | — | Soft delete |
| PATCH | `/api/laboratorio/pedidos/{id}/status` | `{ status }` | Atualiza status com validação de transição |

Fluxo de status: `solicitado → coletado → em_analise → liberado` (ou `cancelado` de qualquer estado antes de `liberado`)

#### Resultados

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| POST | `/api/laboratorio/pedidos/{pedido}/resultado` | — | Cria rascunho (idempotente) |
| GET | `/api/laboratorio/resultados/{id}` | — | Detalha resultado |
| POST | `/api/laboratorio/resultados/{id}/campos` | `{ campos: [{ exame_campo_id, exame_id, valor_numerico?, valor_texto?, observacao? }] }` | Salva/sobrescreve campos (rascunho) |
| POST | `/api/laboratorio/resultados/{id}/liberar` | — | Libera resultado, gera protocolo, PDF e envia e-mail |
| GET | `/api/laboratorio/resultados/{id}/pdf` | — | Download do PDF (stream autenticado) |

---

## Fluxo operacional

```
1. Cadastrar exame         → /laboratorio/exames → Novo Exame
2. Adicionar campos        → /laboratorio/exames/{id}/campos
3. Configurar referências  → botão "Referências" em cada campo
4. Criar pedido            → /laboratorio/pedidos → Novo Pedido (selecionar cliente + exames)
5. Preencher resultado     → /laboratorio/pedidos → ícone de laudo no pedido
6. Salvar rascunho         → botão "Salvar Rascunho" (pode repetir quantas vezes quiser)
7. Liberar                 → botão "Liberar Resultado" → confirmar
   - Gera protocolo (ex: LAB-ABCD1234)
   - Gera senha de 6 dígitos, armazena hash
   - Gera PDF e salva em storage/app/lab/resultados/
   - Envia e-mail com protocolo e senha (se e-mail do cliente cadastrado)
   - Atualiza status do pedido para "liberado"
8. Paciente acessa         → /consulta-exame (URL pública, sem login)
   - Informa protocolo + senha
   - Visualiza resultado agrupado por exame
```

---

## Arquivos criados

### Backend (`sysdoc_back/`)

```
database/migrations/
  2026_05_03_000001_create_exames_table.php
  2026_05_03_000002_create_exame_campos_table.php
  2026_05_03_000003_create_campo_referencias_table.php
  2026_05_03_000004_create_pedidos_exame_table.php
  2026_05_03_000005_create_pedido_exame_itens_table.php
  2026_05_03_000006_create_resultado_exames_table.php
  2026_05_03_000007_create_resultado_campos_table.php

app/Models/
  Exame.php, ExameCampo.php, CampoReferencia.php
  PedidoExame.php, PedidoExameItem.php
  ResultadoExame.php, ResultadoCampo.php

app/Http/Requests/
  StoreExameRequest.php, StoreExameCampoRequest.php
  StoreCampoReferenciaRequest.php, StorePedidoExameRequest.php
  SalvarCamposResultadoRequest.php

app/Services/Laboratorio/
  ResultadoExameService.php
  LaudoPdfService.php

app/Mail/ResultadoLiberadoMail.php

app/Http/Controllers/
  ExameController.php, ExameCampoController.php
  CampoReferenciaController.php, PedidoExameController.php
  ResultadoExameController.php, ConsultaPublicaController.php

resources/views/
  pdf/laudo.blade.php
  emails/resultado-liberado.blade.php
```

### Frontend (`sysdoc_front/`)

```
pages/
  consulta-exame.js                         (pública)
  laboratorio/exames/index.js
  laboratorio/exames/novo.js
  laboratorio/exames/[id]/editar.js
  laboratorio/exames/[id]/campos.js
  laboratorio/pedidos/index.js
  laboratorio/pedidos/novo.js
  laboratorio/resultados/[resultadoId].js

src/components/laboratorio/
  exames/index.js (catálogo)
  exames/ExameForm.js
  exames/GerenciarCampos.js
  pedidos/index.js
  pedidos/NovoPedido.js
  resultados/index.js

src/store/ducks/
  exames/, exameCampos/, pedidosExame/, resultadoExames/

src/store/fetchActions/
  exames/, exameCampos/, pedidosExame/, resultadoExames/
```

### Arquivos modificados

- `routes/api.php` — rotas do laboratório
- `src/store/index.js` — registro dos reducers
- `src/layouts/sidebar/MenuItems.js` — itens de menu
- `pages/_app.js` — whitelist de rotas públicas (`/consulta-exame`)
