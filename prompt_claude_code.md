# PROMPT — Módulo de Laboratório (Claude Code)

## FASE 1 — LEITURA E ANÁLISE DO PROJETO

Antes de escrever qualquer código, execute as seguintes ações em ordem:

### 1.1 Leitura do Backend (Laravel)
- Leia a estrutura completa de pastas do projeto Laravel
- Analise as migrations existentes para entender convenções de nomenclatura, tipos de campo, uso de softDeletes, timestamps, índices e foreign keys
- Analise pelo menos 3 Models existentes para entender: uso de $fillable, $casts, $hidden, relacionamentos (hasMany, belongsTo, etc.), Scopes e traits utilizadas
- Analise pelo menos 3 Controllers existentes para entender: padrão de resposta JSON (estrutura de sucesso e erro), uso de Form Requests, injeção de dependência, tratamento de exceções, paginação e filtros
- Analise os arquivos de rotas (routes/api.php) para entender agrupamentos, middlewares, nomenclatura e versionamento
- Identifique os Services existentes (se houver pasta app/Services) e analise o padrão utilizado
- Verifique como estão configurados: autenticação (Sanctum/Passport), log de acesso, upload de arquivos e envio de e-mails
- Leia o arquivo .env.example para entender variáveis de ambiente disponíveis
- Identifique a estrutura de respostas de erro (Handler.php ou similar)

### 1.2 Leitura do Frontend (Next.js)
- Leia a estrutura completa de pastas do projeto Next.js
- Analise o sistema de layout/template existente: identifique o layout principal, sidebar, header, breadcrumbs e como são compostos
- Analise pelo menos 3 páginas completas para entender: padrão de fetch de dados (SWR, React Query, useEffect+axios), estrutura de componentes de página, tratamento de loading e error states
- Analise os componentes de UI reutilizáveis existentes: tabelas, formulários, modais, botões, badges, inputs — nomes, props e como são importados
- Identifique o sistema de design: biblioteca de componentes (shadcn, MUI, Ant Design, etc.), sistema de cores, tipografia e espaçamento
- Analise como o cliente HTTP está configurado (instância axios, interceptors, baseURL, headers de autenticação)
- Identifique o padrão de rotas/páginas (App Router ou Pages Router)
- Verifique como são feitas notificações/toasts de sucesso e erro
- Leia pelo menos 1 formulário complexo existente para entender validação e submit

### 1.3 Síntese
Após a leitura, gere internamente um resumo de:
- Convenções adotadas no projeto (nomes, estruturas, padrões)
- Componentes e utilitários já existentes que serão reutilizados
- Inconsistências ou melhorias que devem ser aplicadas no novo módulo

---

## FASE 2 — IMPLEMENTAÇÃO DO BACKEND (Laravel)

Implemente seguindo EXATAMENTE os padrões identificados no projeto. Aplique as seguintes melhorias de segurança e desempenho onde ainda não existirem:

### 2.1 Migrations
Crie as migrations na seguinte ordem (respeite as foreign keys):

1. `create_exames_table`
   - id, nome (string), codigo (string, unique), categoria (string, nullable), descricao (text, nullable), ativo (boolean, default true), timestamps

2. `create_exame_campos_table`
   - id, exame_id (FK → exames, cascadeOnDelete), nome (string), descricao (string, nullable), tipo_valor (enum: numerico|texto|booleano|selecao, default numerico), unidade (string, nullable), opcoes_selecao (json, nullable), ordem (integer, default 0), obrigatorio (boolean, default true), ativo (boolean, default true), timestamps
   - Índice: [exame_id, ordem]

3. `create_campo_referencias_table`
   - id, exame_campo_id (FK → exame_campos, cascadeOnDelete), perfil (enum: geral|adulto_m|adulto_f|crianca|idoso|gestante, default geral), valor_min (decimal 10,3, nullable), valor_max (decimal 10,3, nullable), valor_texto (string, nullable), descricao (string, nullable), timestamps
   - Índice único: [exame_campo_id, perfil]

4. `create_pedidos_exame_table`
   - id, cliente_id (FK → clientes, cascadeOnDelete), criado_por (FK → users), medico_solicitante (string, nullable), data_pedido (date), data_coleta (date, nullable), status (enum: solicitado|coletado|em_analise|liberado|cancelado, default solicitado), observacoes (text, nullable), timestamps, softDeletes
   - Índices: [cliente_id], [status], [data_pedido]

5. `create_pedido_exame_itens_table`
   - id, pedido_exame_id (FK → pedidos_exame, cascadeOnDelete), exame_id (FK → exames), timestamps
   - Índice único: [pedido_exame_id, exame_id]

6. `create_resultado_exames_table`
   - id, pedido_exame_id (FK → pedidos_exame, cascadeOnDelete, unique — 1 resultado por pedido), liberado_por (FK → users, nullable), protocolo (string, unique, nullable), senha_hash (string, nullable), pdf_path (string, nullable), data_liberacao (timestamp, nullable), data_validade (timestamp, nullable), ativo (boolean, default true), timestamps
   - Índices: [protocolo], [pedido_exame_id]

7. `create_resultado_campos_table`
   - id, resultado_exame_id (FK → resultado_exames, cascadeOnDelete), exame_campo_id (FK → exame_campos), exame_id (FK → exames), valor_numerico (decimal 10,3, nullable), valor_texto (text, nullable), status_referencia (enum: normal|baixo|alto|critico|indefinido, default indefinido), observacao (text, nullable), timestamps
   - Índices: [resultado_exame_id], [exame_id]

### 2.2 Models
Crie os Models com os relacionamentos corretos, seguindo o padrão do projeto:
- `Exame` com scope ativo(), relações campos(), camposAtivos()
- `ExameCampo` com relação referencias() e método referenciaParaPerfil(string $perfil)
- `CampoReferencia`
- `PedidoExame` com SoftDeletes, relações cliente(), itens(), exames() (belongsToMany), resultado(), criadoPor()
- `PedidoExameItem`
- `ResultadoExame` com $hidden = ['senha_hash'], métodos verificarSenha(), estaValido(), static gerarProtocolo()
- `ResultadoCampo` com relações resultado(), campo()

### 2.3 Form Requests
Crie Form Requests para cada operação, seguindo o padrão existente no projeto:
- `StoreExameRequest` — validação de nome, codigo único, categoria, campos obrigatórios
- `StoreExameCampoRequest` — validação de tipo_valor, opcoes_selecao obrigatório quando tipo=selecao
- `StoreCampoReferenciaRequest` — validação de perfil único por campo, valor_min < valor_max
- `StorePedidoExameRequest` — validação de cliente_id existente, exames (array, min 1, cada um existe)
- `SalvarCamposResultadoRequest` — validação de array de campos com exame_campo_id e valor

### 2.4 Services
Crie em `app/Services/Laboratorio/`:

**`ResultadoExameService`**
- `salvarCampos(ResultadoExame $resultado, array $campos): void`
  - Executa em DB::transaction
  - Deleta campos anteriores (rascunho)
  - Detecta perfil do cliente (idade + sexo)
  - Para cada campo: calcula status_referencia automaticamente comparando com campo_referencias
  - Cria os ResultadoCampo

- `liberar(ResultadoExame $resultado, int $userId): ResultadoExame`
  - Valida que ainda não foi liberado
  - Executa em DB::transaction
  - Gera protocolo único (não sequencial, não adivinhável)
  - Gera senha de 6 dígitos numéricos
  - Armazena senha_hash com Hash::make()
  - Chama LaudoPdfService::gerar() e salva pdf_path
  - Envia e-mail via Queue (não bloqueia a resposta)
  - Atualiza status do pedido para 'liberado'
  - Retorna o resultado atualizado

- `consultarPublico(string $protocolo, string $senha): ?ResultadoExame`
  - Busca por protocolo
  - Verifica estaValido()
  - Verifica senha com Hash::check()
  - Retorna resultado com relacionamentos carregados ou null

**`LaudoPdfService`**
- `gerar(ResultadoExame $resultado): string`
  - Carrega relacionamentos necessários
  - Agrupa campos por exame
  - Gera PDF com barryvdh/laravel-dompdf usando view `pdf.laudo`
  - Salva em `storage/app/lab/resultados/{protocolo}.pdf`
  - Retorna o path relativo

### 2.5 Mailable
Crie `app/Mail/ResultadoLiberadoMail` implementando `ShouldQueue`:
- Recebe ResultadoExame e senha (string, texto puro, apenas neste momento)
- View em `resources/views/emails/resultado-liberado.blade.php`
- Subject: "Seu resultado de exame está disponível"

### 2.6 Views
Crie duas views Blade:
- `resources/views/pdf/laudo.blade.php` — layout A4 profissional com CSS inline (DejaVu Sans para DomPDF), cabeçalho, dados do paciente, tabela de resultados agrupada por exame, badge colorido por status (normal=verde, baixo=azul, alto=vermelho, crítico=roxo), rodapé com protocolo e validade
- `resources/views/emails/resultado-liberado.blade.php` — e-mail HTML responsivo com protocolo, senha e link de acesso

### 2.7 Controllers
Crie na pasta padrão de controllers de API do projeto:

**`ExameController`** — CRUD completo com paginação, filtro por ativo e busca por nome/codigo

**`ExameCampoController`** — CRUD de campos vinculados a um exame, com reordenação (PATCH /reordenar)

**`CampoReferenciaController`** — CRUD de referências vinculadas a um campo

**`PedidoExameController`**
- index (com filtros: status, cliente_id, data_de, data_ate, paginação)
- store (cria pedido + itens em transaction)
- show (com todos os relacionamentos)
- atualizarStatus (PATCH — valida transição de status)
- destroy (soft delete)

**`ResultadoExameController`**
- store (cria rascunho para um pedido — idempotente com firstOrCreate)
- show
- salvarCampos (POST /{resultado}/campos)
- liberar (POST /{resultado}/liberar)
- downloadPdf (GET /{resultado}/pdf — streaming do arquivo)

**`ConsultaPublicaController`**
- consultar (POST — sem auth, com throttle, registra no log_acessos existente)

### 2.8 Rotas
No arquivo de rotas API do projeto, adicione:
```
// Pública — throttle agressivo
Route::middleware('throttle:10,1')->post('/consulta-exame', ...)

// Autenticadas — group com middleware existente no projeto
Route::prefix('laboratorio')->group(function() {
    Route::apiResource('exames', ExameController::class)
    Route::get('exames/{exame}/campos', ...)
    Route::post('exames/{exame}/campos', ...)
    Route::put('exames/{exame}/campos/{campo}', ...)
    Route::delete('exames/{exame}/campos/{campo}', ...)
    Route::patch('exames/{exame}/campos/reordenar', ...)
    Route::apiResource('campos/{campo}/referencias', CampoReferenciaController::class)
    Route::apiResource('pedidos', PedidoExameController::class)
    Route::patch('pedidos/{pedido}/status', ...)
    Route::post('resultados', ResultadoExameController@store)
    Route::get('resultados/{resultado}', ...)
    Route::post('resultados/{resultado}/campos', ...)
    Route::post('resultados/{resultado}/liberar', ...)
    Route::get('resultados/{resultado}/pdf', ...)
})
```

### 2.9 Melhorias de Segurança e Performance
Aplique as seguintes melhorias (se ainda não existirem no projeto):
- **Rate limiting** no endpoint público (throttle:10,1 por IP)
- **Eager loading** em todos os relacionamentos consultados (evitar N+1)
- **Índices de banco** — garantir que todas as FKs e campos de busca frequente têm índice
- **PDF em storage privado** — nunca expor o path diretamente; servir via controller autenticado
- **Senha nunca em log** — garantir que $hidden cobre senha_hash e que o Mailable não loga a senha
- **Protocolo não enumerável** — usar Str::random(8) + prefixo, nunca ID sequencial
- **DB::transaction** em todas as operações multi-tabela
- **Queue para e-mail** — Mailable implementa ShouldQueue

---

## FASE 3 — IMPLEMENTAÇÃO DO FRONTEND (Next.js)

Use EXATAMENTE o mesmo layout, componentes, biblioteca de UI, padrão de fetch e sistema de design identificados na leitura do projeto. Não crie novos componentes de UI se já existirem equivalentes no projeto.

### 3.1 Client API
Crie `lib/api/laboratorio.ts` (ou `.js`) com funções tipadas para todos os endpoints, usando a mesma instância de cliente HTTP já existente no projeto.

### 3.2 Páginas do Backoffice
Crie as seguintes páginas dentro da estrutura de rotas do projeto:

**Catálogo de Exames** (`/laboratorio/exames`)
- Listagem com busca, filtro por categoria, toggle ativo/inativo
- Botão "Novo Exame"
- Tabela usando o componente de tabela existente no projeto
- Ação: editar, gerenciar campos, ativar/desativar

**Novo/Editar Exame** (`/laboratorio/exames/novo` e `/laboratorio/exames/[id]/editar`)
- Formulário com nome, código, categoria, descrição, ativo
- Após salvar, redireciona para gerenciar campos

**Gerenciar Campos do Exame** (`/laboratorio/exames/[id]/campos`)
- Lista de campos com drag-and-drop para reordenar (ou botões ↑↓)
- Formulário inline ou modal para adicionar/editar campo
- Para cada campo: botão para gerenciar valores de referência
- Modal de referências: adicionar perfis (geral, adulto_m, adulto_f, criança, idoso, gestante) com valor_min e valor_max

**Lista de Pedidos** (`/laboratorio/pedidos`)
- Tabela com filtros: status, cliente, período
- Paginação
- Badge colorido por status
- Ação: ver detalhes, ir para resultado

**Novo Pedido** (`/laboratorio/pedidos/novo`)
- Busca e seleção de cliente (autocomplete ou select)
- Campo médico solicitante, data pedido, data coleta, observações
- Seleção múltipla de exames (checkbox ou multi-select)
- Preview dos exames selecionados

**Preencher Resultado** (`/laboratorio/resultados/[resultadoId]`)
- Cabeçalho com dados do paciente e do pedido
- Para cada exame do pedido: seção com nome do exame e campos dinâmicos
- Cada campo renderiza input adequado ao tipo (number, text, select, boolean)
- Exibição do valor de referência ao lado do input (ao focar o campo)
- Botão "Salvar Rascunho" — salva sem liberar
- Botão "Liberar Resultado" — confirmation modal, depois libera e mostra protocolo gerado
- Se já liberado: exibe protocolo, data de liberação e botão "Baixar PDF"

### 3.3 Página Pública de Consulta (`/consulta-exame`)
- Página sem autenticação, fora do layout do backoffice
- Formulário simples: Protocolo + Senha
- Validação client-side (campos obrigatórios, protocolo uppercase automático)
- Loading state durante consulta
- Exibição do resultado: dados do paciente (sem informações sensíveis desnecessárias), exames agrupados, tabela com nome do campo | valor | unidade | status (badge colorido)
- Botão "Nova Consulta" para limpar
- Mensagem de erro clara em caso de protocolo/senha inválidos

### 3.4 Qualidade do Frontend
- Todos os estados de loading devem usar os mesmos skeletons/spinners do projeto
- Tratamento de erro usando o mesmo padrão de toast/notification existente
- Formulários com validação client-side antes de chamar a API
- Confirmação modal para ações destrutivas ou irreversíveis (liberar resultado)
- Feedback visual imediato após cada ação

---

## FASE 4 — FINALIZAÇÃO

Após implementar tudo:

1. Execute `php artisan migrate` (ou instrua o usuário a fazer)
2. Verifique se a dependência `barryvdh/laravel-dompdf` está no composer.json; se não, instrua: `composer require barryvdh/laravel-dompdf`
3. Verifique se a queue está configurada para e-mails; se não, instrua: `php artisan queue:table && php artisan migrate`
4. Gere um arquivo `LABORATORIO_README.md` na raiz do projeto com:
   - Resumo do que foi implementado
   - Variáveis de ambiente necessárias (MAIL_*, QUEUE_CONNECTION)
   - Comando para rodar as migrations
   - Endpoints documentados (método, rota, autenticação, body esperado, resposta)
   - Fluxo operacional passo a passo

---

## FASE 5 — MELHORIAS E REQUISITOS ADICIONAIS DO MÓDULO DE LABORATÓRIO

### 5.1 Testes após cada implementação
Após concluir cada item das fases anteriores e cada novo requisito abaixo:
- **Teste funcional:** chame o endpoint via HTTP (Tinker ou curl) e verifique a resposta. No frontend, abra a tela, realize a operação e confirme que o dado persiste no banco.
- **Teste de segurança:** tente acessar o endpoint sem token (`401`), com token de perfil sem permissão (`403`), com payload inválido (`422`), com IDs inexistentes (`404`) e com campos fora dos limites (`422`). Verifique que nenhum stack trace vaza na resposta em produção.
- Documente o resultado de cada teste no `LABORATORIO_README.md`.

### 5.2 Valores de referência — modelagem completa por perfil fisiológico
Pesquise em fontes técnicas (SBPC/ML, ANVISA, literatura de bioquímica clínica, GitHub de sistemas LIS, HL7 FHIR ReferenceRange) quais dimensões de perfil são necessárias para cobrir os valores de referência de exames laboratoriais no Brasil. Implemente conforme o resultado da pesquisa, garantindo no mínimo:
- Separação por **sexo** (masculino / feminino / não aplicável)
- Separação por **faixa etária** (recém-nascido / criança / adolescente / adulto / idoso)
- Condição especial: **gestante** (por trimestre se relevante)
- Considere também: unidade de medida pode variar por laboratório — permitir override de unidade por referência
- A tabela `campo_referencias` deve refletir todas essas dimensões de forma que um único campo possa ter múltiplas referências sem ambiguidade (índice único composto)
- Crie ou atualize a migration, o model e o controller conforme necessário, mantendo retrocompatibilidade com dados já inseridos

### 5.3 Seed completo de exames laboratoriais com campos e valores de referência
Pesquise fontes abertas (GitHub de sistemas LIS/HIS open source, APIs públicas de laboratório como LOINC, Tabela TUSS/CBHPM, publicações SBPC/ML, ANVISA RDC 302/2005 e similares) para obter:
- Lista completa de exames laboratoriais mais realizados no Brasil (mínimo 80 exames)
- Para cada exame: nome, código TUSS ou LOINC quando disponível, categoria, campos/analitos com tipo de valor e unidade
- Para cada campo: valores de referência por perfil (adulto M, adulto F, criança, idoso, gestante) quando disponíveis
Crie um seeder (`ExamesCompletosSeeder`) que persista todos os dados em ordem correta de FK. Execute com `php artisan db:seed --class=ExamesCompletosSeeder`. O seeder deve ser idempotente (usar `firstOrCreate` ou `insertOrIgnore`).

### 5.4 Padronização visual dos modais
Antes de criar qualquer novo modal, leia os modais existentes no projeto (`src/components/modal/client/index.js`, `src/components/modal/specialities/index.js` e pelo menos mais um) e extraia:
- Dimensões exatas do `style` object (width, maxWidth, height, maxHeight, p, overflow)
- Estrutura interna (Box > Grid > BaseCard)
- Padrão de botões (Gravar / Cancelar com `sx={{ '& button': { mx: 1 } }}`)
Aplique **exatamente** as mesmas dimensões e estrutura em todos os modais do módulo de laboratório já criados e nos novos que forem criados.

### 5.5 Padronização de componentes de formulário
Antes de criar qualquer campo de formulário, verifique os componentes em `src/components/inputs/` e os campos usados nos modais existentes. Use:
- Os mesmos componentes de TextField, Select, Switch, FormControl/InputLabel do MUI que o restante do projeto usa
- A mesma prop `inputProps` com `style: { textTransform: 'uppercase' }` e `autoComplete: 'off'` onde o projeto já aplica
- O mesmo padrão de mascaramento para CPF, telefone e datas (componentes existentes em `src/components/inputs/`)
- O mesmo `AlertModal` para feedback e o mesmo `ConfirmDialog` para confirmações destrutivas

### 5.6 CRUD de Médico Solicitante
O campo `medico_solicitante` no pedido de exame deve ser um `<Select>` populado a partir de um cadastro no banco de dados. Implemente:

**Backend:**
- Migration `create_medicos_solicitantes_table`: `id`, `nome` (string 100, unique), `crm` (string 20, nullable, unique), `especialidade` (string 80, nullable), `ativo` (boolean, default true), timestamps
- Model `MedicoSolicitante` seguindo o padrão do projeto
- `StoreMedicoSolicitanteRequest` com validação de CRM único
- `MedicoSolicitanteController` com CRUD completo (index com busca/filtro ativo, store, update, destroy)
- Rota: `Route::apiResource('laboratorio/medicos-solicitantes', MedicoSolicitanteController::class)` dentro do grupo auth
- No `PedidoExame`: adicionar FK `medico_solicitante_id` (nullable) → `medicos_solicitantes`, manter campo `medico_solicitante` string como fallback

**Frontend:**
- Redux duck `medicosSolicitantes` + fetchActions (padrão do projeto)
- Modal `src/components/modal/medicoSolicitante/index.js` (mesmas dimensões dos outros modais)
- Listagem `src/components/laboratorio/medicos/index.js` com tabela + Fab + modal
- Página `pages/laboratorio/medicos.js`
- Menu item "Lab — Médicos" abaixo de "Lab — Categorias" (mesmos perfis de admin/manager)
- No modal de Novo Pedido: substituir o campo texto de médico solicitante por `<Select>` populado de `/laboratorio/medicos-solicitantes?ativo=true`

### 5.7 Busca de paciente por CPF ou CNS no pedido de exame
No modal/formulário de "Novo Pedido de Exame", substituir o `<Select>` de clientes (que carrega todos os registros) por um fluxo de busca sob demanda:
- Exibir dois campos de texto lado a lado: **CPF** e **CNS** (com máscara nos inputs já existentes no projeto)
- Botão "Buscar Paciente" ao lado
- Ao clicar, chamar `GET /clients?cpf={cpf}` ou `GET /clients?cns={cns}` (verificar endpoint existente no projeto)
- Se encontrado: exibir card com nome, data de nascimento e CPF do paciente; armazenar `client_id` no form state
- Se não encontrado: exibir mensagem de erro clara e permitir nova busca
- Enquanto nenhum paciente estiver selecionado, o botão "Criar Pedido" deve estar desabilitado
- O `client_id` enviado na requisição é o mesmo de antes; apenas a UX muda

### 5.8 Agenda de coleta por data
Implemente uma tela de agenda que exibe os pedidos de exame agendados para coleta organizados por data:

**Backend:**
- Novo endpoint: `GET /laboratorio/agenda?data={YYYY-MM-DD}` (ou intervalo `data_de` / `data_ate`)
- Retorna pedidos com `data_coleta = {data}`, status diferente de `cancelado`, com eager loading de `cliente`, `exames`, `medico` (se FK implementada)
- Ordena por `data_coleta` ASC, depois por `created_at` ASC
- Inclua paginação (per_page padrão 50)

**Frontend:**
- Página `pages/laboratorio/agenda.js`
- Componente `src/components/laboratorio/agenda/index.js`
- Seletor de data (DatePicker ou input type="date" conforme padrão do projeto)
- Exibição em formato de lista por data: para cada pedido exibir nome do paciente, exames solicitados (chips), médico solicitante e status (badge)
- Botão para ir direto ao resultado do pedido
- Menu item "Lab — Agenda" abaixo de "Lab — Médicos" (perfis: admin, manager, user)
- Ao abrir a página, carregar automaticamente os pedidos do dia atual

---

## RESTRIÇÕES IMPORTANTES

- **Não altere** código existente fora do escopo deste módulo, exceto para adicionar rotas no arquivo de rotas
- **Não crie** componentes de UI que já existem no projeto
- **Não invente** padrões — use exatamente o que foi identificado na leitura
- **Siga** as convenções de nomenclatura do projeto (snake_case, camelCase, etc.)
- Se encontrar ambiguidade ou decisão arquitetural relevante, aplique a melhor prática e documente no README
