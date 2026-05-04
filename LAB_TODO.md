# TODO — Módulo de Laboratório

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluído

---

## Implementados (base)

- [x] Migrations: exames, exame_campos, campo_referencias, pedidos_exame, pedido_exame_itens, resultado_exames, resultado_campos
- [x] Models: Exame, ExameCampo, CampoReferencia, PedidoExame, PedidoExameItem, ResultadoExame, ResultadoCampo
- [x] Controllers: ExameController, ExameCampoController, CampoReferenciaController, PedidoExameController, ResultadoExameController, ConsultaPublicaController
- [x] Services: ResultadoExameService, LaudoPdfService
- [x] Mailable: ResultadoLiberadoMail (ShouldQueue)
- [x] Views Blade: pdf/laudo.blade.php, emails/resultado-liberado.blade.php
- [x] Rotas API: laboratório completo + consulta pública com throttle
- [x] Redux: ducks + fetchActions para exames, exameCampos, pedidosExame, resultadoExames
- [x] Páginas: /laboratorio/exames, /laboratorio/pedidos, /laboratorio/resultados/[id], /consulta-exame
- [x] Bug fix: StoreExameRequest linha 28 ([] operator on string)
- [x] Bug fix: PedidoExame e PedidoExameItem com $table explícito (nome de tabela divergente)
- [x] Cadastro via modal: ExameModal, PedidoModal (padrão do projeto)
- [x] Menu: Lab — Exames e Lab — Pedidos abaixo de Cliente Report
- [x] CRUD Categorias: migration, model, controller, seed (35 categorias), modal, página, menu
- [x] Campo categoria no ExameModal virou <Select> populado de categoria_exames

---

## Pendentes

### 5.1 — Testes funcionais e de segurança
- [ ] Testar todos os endpoints autenticados sem token (espera 401)
- [ ] Testar com token de perfil sem permissão (espera 403)
- [ ] Testar payloads inválidos em cada endpoint (espera 422 com mensagens em pt-BR)
- [ ] Testar IDs inexistentes em show/update/destroy (espera 404)
- [ ] Testar endpoint público /consulta-exame com protocolo inválido e senha errada
- [ ] Testar throttle do endpoint público (> 10 req/min)
- [ ] Verificar que stack trace não vaza em respostas de erro (APP_DEBUG=false)
- [ ] Testar fluxo completo no frontend: criar exame → criar pedido → preencher resultado → liberar
- [ ] Documentar resultados dos testes no LABORATORIO_README.md

### 5.2 — Valores de referência: modelagem completa por perfil fisiológico
- [ ] Pesquisar SBPC/ML, ANVISA RDC 302, HL7 FHIR ReferenceRange, literatura de bioquímica clínica
- [ ] Definir dimensões de perfil necessárias: sexo (M/F/N/A), faixa etária (RN/criança/adolescente/adulto/idoso), gestante (por trimestre)
- [ ] Avaliar se a tabela campo_referencias atual (enum de 6 perfis) é suficiente ou precisa ser expandida
- [ ] Criar/atualizar migration para refletir os perfis completos (retrocompatível)
- [ ] Atualizar Model, Controller e Request conforme nova estrutura
- [ ] Atualizar frontend: modal de referências deve exibir todos os perfis disponíveis
- [ ] Validar que o cálculo de status_referencia em ResultadoExameService detecta o perfil correto

### 5.3 — Seed completo de exames (mínimo 80) com campos e valores de referência
- [ ] Pesquisar fontes: LOINC, TUSS/CBHPM, SBPC/ML, GitHub de sistemas LIS open source, ANVISA RDC 302/2005
- [ ] Montar lista de exames com: nome, código (TUSS/LOINC), categoria, campos/analitos, unidade
- [ ] Mapear valores de referência por perfil para cada campo (adulto M/F, criança, idoso, gestante)
- [ ] Criar ExamesCompletosSeeder (idempotente com firstOrCreate/insertOrIgnore)
- [ ] Testar com php artisan db:seed --class=ExamesCompletosSeeder
- [ ] Verificar integridade das FKs após seed

### 5.4 — Padronização visual dos modais
- [ ] Ler src/components/modal/client/index.js e extrair dimensões exatas (width, maxWidth, height, p, overflow)
- [ ] Comparar com ExameModal, PedidoModal e CategoriaExameModal já criados
- [ ] Corrigir dimensões nos modais do laboratório que divergirem
- [ ] Garantir estrutura interna idêntica: Box > Grid > BaseCard com botões no padrão

### 5.5 — Padronização de componentes de formulário
- [ ] Auditar src/components/inputs/ — identificar componentes de CPF, telefone, data já existentes
- [ ] Verificar uso de autoComplete="off" e textTransform="uppercase" nos inputs dos modais do laboratório
- [ ] Substituir qualquer input de data raw por componente do projeto (se houver DatePicker)
- [ ] Garantir uso de AlertModal para feedback e ConfirmDialog para ações destrutivas em todos os CRUDs do laboratório

### 5.6 — CRUD de Médico Solicitante
**Backend:**
- [ ] Migration: create_medicos_solicitantes_table (nome, crm unique, especialidade, ativo)
- [ ] Migration: add_medico_solicitante_id_to_pedidos_exame_table (FK nullable, onDelete set null)
- [ ] Model MedicoSolicitante com relacionamento pedidos()
- [ ] StoreMedicoSolicitanteRequest (CRM unique, validação de nome)
- [ ] MedicoSolicitanteController (index com busca/filtro ativo, store, update, destroy)
- [ ] Rotas: GET/POST /laboratorio/medicos-solicitantes, PUT/DELETE /{medico}
- [ ] Atualizar PedidoExame model: adicionar medico_solicitante_id ao fillable + relacionamento medicoSolicitante()
- [ ] Atualizar PedidoExameController: usar medico_solicitante_id, incluir relacionamento no show/index

**Frontend:**
- [ ] Redux duck: src/store/ducks/medicosSolicitantes/index.js
- [ ] fetchActions: src/store/fetchActions/medicosSolicitantes/index.js
- [ ] Registrar reducer em src/store/index.js
- [ ] Modal: src/components/modal/medicoSolicitante/index.js (mesmas dimensões)
- [ ] Listagem: src/components/laboratorio/medicos/index.js
- [ ] Página: pages/laboratorio/medicos.js
- [ ] Menu: "Lab — Médicos" abaixo de "Lab — Categorias" (admin, manager)
- [ ] PedidoModal: substituir campo texto por <Select> de /laboratorio/medicos-solicitantes?ativo=true

### 5.7 — Busca de paciente por CPF/CNS no pedido de exame
- [ ] Verificar endpoint existente para busca de cliente por CPF/CNS (GET /clients?cpf= ou similar)
- [ ] Remover <Select> de clientes do PedidoModal
- [ ] Adicionar inputs de CPF (com máscara) e CNS lado a lado
- [ ] Botão "Buscar Paciente" → chama API → exibe card com dados do paciente encontrado
- [ ] Armazenar client_id no form state após busca bem-sucedida
- [ ] Exibir mensagem de erro se não encontrado
- [ ] Desabilitar botão "Criar Pedido" enquanto nenhum paciente estiver selecionado
- [ ] Testar fluxo completo

### 5.8 — Agenda de coleta por data
**Backend:**
- [ ] Novo endpoint: GET /laboratorio/agenda?data= (ou data_de/data_ate)
- [ ] Filtrar pedidos por data_coleta, excluindo cancelados
- [ ] Eager loading: cliente, exames, medicoSolicitante
- [ ] Ordenar por data_coleta ASC, created_at ASC
- [ ] Paginação (per_page padrão 50)
- [ ] Adicionar rota em routes/api.php dentro do grupo laboratorio

**Frontend:**
- [ ] Página: pages/laboratorio/agenda.js
- [ ] Componente: src/components/laboratorio/agenda/index.js
- [ ] Redux duck + fetchActions para agenda (ou reutilizar pedidosExame com params)
- [ ] Seletor de data (input type="date" conforme padrão do projeto)
- [ ] Carregar automaticamente o dia atual ao abrir
- [ ] Exibir lista: nome do paciente, exames (chips), médico, status (badge colorido)
- [ ] Botão para ir direto ao resultado do pedido
- [ ] Menu: "Lab — Agenda" abaixo de "Lab — Médicos" (admin, manager, user)

---

## Ordem sugerida de execução

1. `[5.4]` Padronização visual dos modais — sem risco, só ajuste de estilo
2. `[5.5]` Padronização de componentes — idem
3. `[5.1]` Testes dos endpoints já implementados — identifica bugs antes de prosseguir
4. `[5.6]` CRUD Médico Solicitante — bloqueia 5.7 (campo no pedido)
5. `[5.7]` Busca por CPF/CNS — depende de 5.6
6. `[5.2]` Pesquisa e modelagem de referências — pode ser feita em paralelo com 5.6
7. `[5.3]` Seed completo — depende de 5.2 estar estável
8. `[5.8]` Agenda — independente, pode ser feita a qualquer momento após 5.6
