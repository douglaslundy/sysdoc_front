# Apostila: Segurança, Performance e Auditoria — Sysdoc

**Projeto:** Sysdoc (Jr Ferragens)
**Stack:** Laravel 10 (backend) + Next.js 12 / React 17 (frontend)
**Última atualização:** Maio 2026 — Fases A–N concluídas

---

## Introdução

Esta apostila documenta as melhorias aplicadas no Sysdoc ao longo de seis sessões de implementação (fases A a N). O sistema possui 4 dashboards analíticos, um módulo de laboratório completo, sistema de auditoria de ações, gestão de filas, TFD, atendimento e documentos.

Os tópicos se dividem em quatro categorias:
- **Segurança** — quem pode acessar o quê, rastreabilidade e proteção de endpoints
- **Performance** — como as queries impactam o banco de dados
- **Confiabilidade e código** — o que acontece quando algo falha
- **Auditoria** — registro completo de ações no sistema (LGPD)

---

## Parte 1 — Segurança

### 1.1 Rate Limiting (Limitação de Taxa)

#### O que é

Rate limiting é uma técnica que limita quantas vezes um usuário pode chamar um endpoint em um período de tempo. Sem isso, um usuário autenticado — ou um script automatizado — pode fazer centenas de requisições por minuto ao mesmo endpoint, forçando o banco a executar queries pesadas repetidamente.

#### Como estava

Os endpoints de dashboard não tinham nenhum rate limiting. Outros endpoints do sistema já tinham:

```php
// routes/api.php — endpoints já protegidos
Route::middleware('throttle:5,1')->post('/register', ...);
Route::middleware('throttle:10,1')->post('/consulta-exame', ...);
Route::middleware('throttle:3,1')->post('/forgot-password', ...);

// Dashboards — SEM proteção
Route::get('/dashboard/laboratorio', [DashboardController::class, 'laboratorio']);
Route::get('/dashboard/fila',        [DashboardController::class, 'fila']);
Route::get('/dashboard/tfd',         [DashboardController::class, 'tfd']);
Route::get('/dashboard/logs',        [DashboardController::class, 'logs']);
```

O endpoint `/dashboard/laboratorio` executa ~14 queries por requisição. Sem throttle, um bot poderia forçar 140 queries por segundo ao banco.

#### Como ficou

```php
// routes/api.php
// throttle:20,1 = máximo 20 requisições por minuto, por usuário autenticado
Route::middleware('throttle:20,1')->group(function () {
    Route::get('/dashboard/laboratorio', ...);
    Route::get('/dashboard/fila',        ...);
    Route::get('/dashboard/tfd',         ...);
    Route::get('/dashboard/logs',        ...);
});
```

Quando o limite é atingido, o Laravel retorna automaticamente `HTTP 429 Too Many Requests`. O valor 20/min foi escolhido porque um usuário humano nunca abrirá um dashboard 20 vezes em um minuto — mas um script automatizado sim.

**Analogia:** É como um porteiro de clube que deixa você entrar à vontade, mas se você tentar entrar e sair 20 vezes em 1 minuto, ele bloqueia você por um tempo.

---

### 1.2 Controle de Acesso por Perfil (Gates)

#### O que é

Autenticação verifica *quem você é*. Autorização verifica *o que você pode fazer*. Um usuário com perfil de atendente estar autenticado não significa que ele deve ver o dashboard de Logs administrativos.

O Laravel oferece o sistema de **Gates** — funções que recebem o usuário e retornam `true` ou `false` para uma determinada ação.

#### Como estava

Todos os usuários autenticados podiam acessar todos os dashboards, independente do perfil. Não havia nenhuma verificação de papel:

```php
// Qualquer usuário autenticado chegava aqui
Route::get('/dashboard/logs', [DashboardController::class, 'logs']);
```

#### Como ficou

**Passo 1 — Definir os Gates** em `AuthServiceProvider.php`:

```php
// app/Providers/AuthServiceProvider.php
Gate::define('dashboard-laboratorio', fn($user) => in_array($user->profile, ['admin', 'user']));
Gate::define('dashboard-fila',        fn($user) => in_array($user->profile, ['admin', 'user']));
Gate::define('dashboard-tfd',         fn($user) => in_array($user->profile, ['admin', 'user']));
Gate::define('dashboard-logs',        fn($user) => $user->profile === 'admin'); // restrito ao admin
```

**Passo 2 — Aplicar nas rotas** via middleware `can:`:

```php
Route::get('/dashboard/logs', [DashboardController::class, 'logs'])
    ->middleware('can:dashboard-logs');
```

Se o usuário não tiver permissão, o Laravel retorna `HTTP 403 Forbidden` automaticamente. Nenhuma lógica de permissão entra no controller — o middleware intercepta antes.

**Por que não colocar a verificação no controller?**

Porque violar o princípio de responsabilidade única. O controller deve processar dados. A autorização é uma preocupação transversal — ela deve viver na camada de middleware/rota, onde é executada antes de qualquer lógica de negócio.

---

### 1.3 Exclusão com Cascata — `forceDelete()` vs Soft Delete

#### O que é

O Laravel tem soft delete — em vez de deletar fisicamente, ele marca o registro com `deleted_at`. Isso permite "lixeira" e recuperação de dados. No banco, as foreign keys com `ON DELETE CASCADE` **não disparam** em soft delete, pois o SQL nunca executa um `DELETE` real.

#### O problema encontrado

O `PedidoExame` usava `SoftDeletes`. Seus filhos (`pedido_exame_itens`, `resultado_exames`, `resultado_campos`) não têm soft delete. A situação criada era contraditória:

```php
// O que acontecia com delete() simples:
$pedido->delete();
// → Marca pedido com deleted_at (recuperável)
// → NÃO aciona CASCADE do banco
// → Filhos ficam órfãos no banco para sempre

// Tentativa 1: deletar filhos manualmente antes:
$pedido->resultado?->campos()->delete();
$pedido->resultado?->delete();
$pedido->itens()->delete();
$pedido->delete(); // soft delete
// → Filhos são deletados fisicamente (irrecuperável)
// → Pai fica com deleted_at (teóricamente recuperável, mas filhos não existem mais)
// → Contradição: recuperar o pai nunca funcionaria
```

#### A solução correta: `forceDelete()`

```php
// PedidoExameController::destroy()
public function destroy(PedidoExame $pedido)
{
    // ...verificações de status...
    $pedido->forceDelete(); // DELETE físico → aciona ON DELETE CASCADE do banco
}
```

`forceDelete()` emite um `DELETE` SQL real, que aciona o `ON DELETE CASCADE` definido nas migrations filhas. O banco cuida de todo o cascade automaticamente, de forma atômica.

**Consequência importante:** `forceDelete()` dispara o evento `forceDeleted` do Eloquent, **não** `deleted`. Isso significa que observers registrados em `deleted()` não são chamados:

```php
// PedidoExameObserver — situação anterior (bug silencioso)
public function deleted(PedidoExame $pedido): void
{
    AuditService::record('DELETE', $pedido, $pedido->toArray(), null);
    // Este método NUNCA era chamado para forceDelete()!
}

// Correção: adicionar forceDeleted()
public function forceDeleted(PedidoExame $pedido): void
{
    AuditService::record('DELETE', $pedido, $pedido->toArray(), null);
}
```

**Regra prática:** Se um modelo usa `forceDelete()`, o observer precisa implementar `forceDeleted()`. Os dois eventos são independentes.

---

## Parte 2 — Performance

### 2.1 Cache no Servidor

#### O que é

Dados de dashboard são agregações históricas — top exames, viagens por mês, totais de fila. Esses números mudam com baixa frequência. Se 10 usuários abrirem o dashboard ao mesmo tempo, não faz sentido executar 14 queries 10 vezes — basta executar uma vez e servir o resultado armazenado em memória para os demais.

O Laravel oferece `Cache::remember()` — que executa a query apenas se o cache estiver vazio, e retorna o valor armazenado nas chamadas seguintes.

#### Como estava

```php
// Toda requisição executava todas as queries
public function laboratorio()
{
    $totais           = $this->service->getTotais();
    $pedidosPorStatus = $this->service->getPedidosPorStatus();
    $pedidosPorMes    = $this->service->getPedidosPorMes();
    // ... +5 queries
    return response()->json([...]);
}
```

10 usuários = 140 queries simultâneas ao banco.

#### Como ficou

```php
public function laboratorio()
{
    $data = Cache::remember('dashboard.laboratorio', 300, function () {
        // Esse bloco só executa se o cache estiver vazio
        // As próximas requisições nos 5 min recebem o valor armazenado
        return [
            'totais'           => $this->service->getTotais(),
            'pedidos_por_mes'  => $this->service->getPedidosPorMes(),
            // ...
        ];
    });

    return response()->json($data);
}
```

**TTLs escolhidos por endpoint:**
- Laboratório: 300s (5 min) — dados históricos, mudam pouco
- Fila: 120s (2 min) — mais dinâmica
- TFD: 300s (5 min) — inclui `periodo` na cache key (cada período tem seu cache)
- Logs: 600s (10 min) — dados de acesso, mudam menos

**Cache key dinâmica para TFD:**

```php
// Errado — um único cache para todos os períodos
Cache::remember('dashboard.tfd', 300, fn() => ...);

// Correto — cache separado por período e por mês de referência
$key = 'dashboard.tfd.' . $periodo . '.' . now()->format('Y-m');
Cache::remember($key, 300, fn() => ...);
```

Sem o `now()->format('Y-m')`, o dashboard do dia 1 de junho poderia ainda mostrar os dados de maio.

**Analogia:** É como uma fotocopiadora. Na primeira vez, você tira a cópia do original (a query). Nas próximas, você copia a cópia — muito mais rápido.

---

### 2.2 Cache-Control no HTTP

#### O que é

Além do cache no servidor, existe o cache no navegador. O header HTTP `Cache-Control` instrui o browser a não repetir a requisição se o mesmo usuário navegar para outra tela e voltar dentro do período definido.

#### Como estava

Nenhum response dos dashboards definia `Cache-Control`. O browser sempre fazia uma nova requisição ao abrir o dashboard.

#### Como ficou

```php
return response()->json($data)
    ->header('Cache-Control', 'private, max-age=300');
```

- `private` — apenas o browser do usuário cacheia (não CDN pública)
- `max-age=300` — válido por 5 minutos

Combinado com o `Cache::remember` do servidor, o fluxo completo fica:
1. Primeira abertura → browser pede ao servidor → servidor executa queries → guarda em cache → responde
2. Segunda abertura (mesmo usuário, dentro de 5 min) → browser usa cache local → zero requisições
3. Outro usuário (dentro de 5 min) → browser pede ao servidor → servidor serve do cache → zero queries ao banco

---

### 2.3 Full Table Scan — COUNT sem WHERE

#### O que é

Um `COUNT(*)` sem `WHERE` em uma tabela grande percorre **todos os registros** da tabela. Conforme os dados crescem (meses, anos de uso), essa operação fica progressivamente mais lenta.

#### Como estava

```php
// DashboardService.php
'total_qr'           => DB::table('qrcode_logs')->count(),
'total_link_publico' => DB::table('public_queue_logs')->count(),
```

Esses dois `count()` percorrem toda a tabela histórica de logs — potencialmente milhões de linhas — sem nenhum filtro.

#### Como ficou

O `Cache::remember` com TTL longo (10 minutos) no endpoint de Logs resolve o impacto prático desse problema: a query pesada só roda uma vez a cada 10 minutos, não a cada requisição.

A solução definitiva de longo prazo seria adicionar um índice e filtrar por período recente, mas para o volume atual do sistema o cache é suficiente.

---

### 2.4 DATE_FORMAT() impedindo uso de índice

#### O que é

No MySQL, quando você aplica uma função sobre uma coluna em um `WHERE`, o banco não consegue usar o índice daquela coluna. Ele é obrigado a ler cada linha, aplicar a função, e só então comparar.

#### Como estava

```php
// Padrão usado nas queries mensais
->select(DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mes'))
->groupBy('mes')
->where(DB::raw('YEAR(created_at)'), '>=', now()->subYear()->year)
```

A coluna `created_at` estava dentro de `YEAR()` — índice inutilizado.

#### Como ficou

```php
// Filtra por range explícito — o índice em created_at é usado
->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
->where('created_at', '<=', now()->endOfMonth())
```

O `DATE_FORMAT` no `SELECT` pode permanecer (serve apenas para formatar o resultado), o problema era apenas no `WHERE`.

**Analogia:** Imagine um dicionário ordenado por nome. Encontrar "Carlos" é rápido (índice). Mas se você precisar de "todo mundo cujo nome tem 6 letras", você tem que ler cada página — o índice não ajuda porque a condição é sobre o conteúdo transformado, não sobre o valor original.

---

### 2.5 Índices nas Colunas de Query

#### O que é

Um índice de banco de dados é uma estrutura auxiliar que permite localizar registros sem varrer a tabela inteira — como o índice de um livro.

#### Como estava

As queries dos dashboards filtram e agrupam frequentemente por colunas como `departure_date`, `driver_id`, `route_id`, `done`, `status`, `accessed_at`. Sem índices nessas colunas, cada query faz varredura completa da tabela.

#### Como ficou

Foi criada uma migration dedicada de otimização (não altera estrutura de dados, só adiciona índices):

```php
// Migration: add_dashboard_indexes
Schema::table('trips', function (Blueprint $table) {
    $table->index('departure_date');
    $table->index('driver_id');
    $table->index('route_id');
});

Schema::table('queues', function (Blueprint $table) {
    $table->index('done');
    $table->index('created_at');
});

// e assim por diante para qrcode_logs, pedidos_exame, etc.
```

**Regra prática:** Toda coluna usada em `WHERE`, `JOIN ON`, `GROUP BY` ou `ORDER BY` em tabelas que crescem ao longo do tempo merece um índice.

---

### 2.6 Magic Numbers → Constantes de Classe

#### O que é

"Magic numbers" são valores literais no código sem explicação do seu significado. `->limit(8)` no meio de uma query não comunica por que são 8 e não 10, ou qual é a regra de negócio por trás disso.

#### Como estava

```php
->limit(10)  // top exames
->limit(8)   // categorias — por que 8 e não 10?
->limit(5)   // médicos
->limit(10)  // motoristas
->limit(10)  // rotas
```

#### Como ficou

```php
class DashboardService
{
    private const TOP_EXAMES     = 10;
    private const TOP_CATEGORIAS = 8;
    private const TOP_MEDICOS    = 5;
    private const TOP_MOTORISTAS = 10;
    private const TOP_ROTAS      = 10;

    public function getTopExames()
    {
        return DB::table('pedido_exame_itens')
            ->limit(self::TOP_EXAMES)  // legível, alterável em um lugar
            ->get();
    }
}
```

Agora se o cliente pedir "quero ver os top 15 exames", há exatamente um lugar para alterar.

---

## Parte 3 — Confiabilidade

### 3.1 Try/Catch com Fallback

#### O que é

Quando um endpoint executa múltiplas queries independentes, uma falha em uma delas não deve derrubar o dashboard inteiro. O padrão correto é tratar cada chamada individualmente, registrar o erro, e retornar um valor padrão (zero ou lista vazia) para a seção afetada.

#### Como estava

Os métodos `laboratorio()` e `logs()` não tinham nenhum tratamento de erro:

```php
public function laboratorio()
{
    // Se getTotais() lançar exceção, o endpoint inteiro retorna 500
    $totais           = $this->service->getTotais();
    $pedidosPorStatus = $this->service->getPedidosPorStatus();
    // ...
    return response()->json([...]);
}
```

Os métodos `fila()` e `tfd()` já tinham try/catch — havia inconsistência no mesmo projeto.

#### Como ficou

```php
public function laboratorio()
{
    $data = Cache::remember('dashboard.laboratorio', 300, function () {
        try {
            $totais = $this->service->getTotais();
        } catch (\Throwable $e) {
            Log::error('DashboardLab totais: ' . $e->getMessage());
            $totais = ['exames' => 0, 'pedidos' => 0, 'clientes' => 0, ...];
        }

        try {
            $pedidosPorStatus = $this->service->getPedidosPorStatus();
        } catch (\Throwable $e) {
            Log::error('DashboardLab pedidos_por_status: ' . $e->getMessage());
            $pedidosPorStatus = [];
        }

        // ... mesmo padrão para cada seção
        return [...];
    });

    return response()->json($data);
}
```

**Ponto crítico:** o `Log::error()` em cada catch é essencial. Sem ele, o erro é silenciado — o dashboard mostra zeros, mas você nunca sabe que algo está errado em produção.

**Por que `\Throwable` e não `\Exception`?** `\Throwable` captura tanto `Exception` quanto `Error` (erros fatais do PHP). Em queries de banco, podem ocorrer `PDOException`, `QueryException`, e outros que herdam de diferentes ramos. `\Throwable` garante que tudo é capturado.

---

### 3.2 Componente Compartilhado de Loading/Erro

#### O que é

Os 4 dashboards tinham o mesmo JSX de loading e erro duplicado em cada arquivo. Duplicação de código viola o princípio DRY (Don't Repeat Yourself) — se você precisar alterar o texto de "Dados não disponíveis", precisaria alterar em 4 lugares.

#### Como estava

Em cada um dos 4 arquivos (`LabDashboard.js`, `FilaDashboard.js`, `LogsDashboard.js`, `TfdDashboard.js`):

```jsx
// Duplicado 4 vezes — cada arquivo tinha exatamente isso
if (loading) {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
        </Box>
    );
}

if (erro || !dados || !chart) {
    return (
        <Box p={4} textAlign="center">
            <Typography color="textSecondary">Dados não disponíveis.</Typography>
        </Box>
    );
}
```

#### Como ficou

**Passo 1 — Criar componente compartilhado** `src/components/dashboard/DashboardStatus.js`:

```jsx
import { Box, CircularProgress, Typography } from '@mui/material';

export function DashboardLoading() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
        </Box>
    );
}

export function DashboardErro() {
    return (
        <Box p={4} textAlign="center">
            <Typography color="textSecondary">Dados não disponíveis.</Typography>
        </Box>
    );
}
```

**Passo 2 — Usar em todos os dashboards**:

```jsx
// Antes (12 linhas duplicadas)
if (loading) {
    return (<Box display="flex" ...><CircularProgress /></Box>);
}
if (erro || !dados || !chart) {
    return (<Box p={4} ...><Typography>Dados não disponíveis.</Typography></Box>);
}

// Depois (2 linhas)
if (loading) return <DashboardLoading />;
if (erro || !dados || !chart) return <DashboardErro />;
```

**Benefício:** Agora alterações de UX (cor, texto, ícone de erro) precisam ser feitas em um único arquivo.

---

### 3.3 Null Guard em Dados do Backend

#### O que é

Quando o backend retorna dados que podem ser `null` ou `undefined`, o frontend precisa proteger operações que assumem que o dado existe. `.split()` em `null` lança `TypeError` e quebra o componente inteiro.

#### Como estava

```jsx
// TfdDashboard.js
const motoristaNomes = (motoristas || [])
    .map(m => m.nome.split(' ').slice(0, 2).join(' '))  // crash se nome for null
    .reverse();
```

#### Como ficou

```jsx
const motoristaNomes = (motoristas || [])
    .map(m => (m.nome ?? '').split(' ').slice(0, 2).join(' '))  // ?? '' protege o null
    .reverse();
```

O operador `??` (nullish coalescing) retorna o lado direito apenas quando o lado esquerdo é `null` ou `undefined`. Diferente do `||`, ele não ativa para string vazia ou zero — é mais preciso.

---

### 3.4 Datas: `split('-')` vs `new Date()`

#### O problema

```js
// Bug silencioso de timezone
const d = new Date('2026-05-10'); // interpreta como UTC midnight
d.toLocaleDateString('pt-BR');    // em UTC-3 retorna "09/05/2026" ← dia errado!
```

Strings ISO sem horário (`2026-05-10`) são interpretadas como UTC. Ao converter para o timezone local (UTC-3), a meia-noite de UTC vira 21h do dia anterior — a data volta um dia.

#### A solução

```js
// Correto — ignora timezone completamente
const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};
```

Extraindo diretamente da string ISO sem criar um objeto `Date`, o offset de fuso nunca entra no processo. Aplicado em todas as exibições de data do módulo de pedidos de exame.

---

## Parte 4 — Sistema de Auditoria

### 4.1 Visão Geral do Sistema

O Sysdoc implementa auditoria completa de ações via `AuditService::record()`. Cada ação relevante gera um registro na tabela `audit_logs` com:

- `user_id`, `user_name` — quem executou
- `action` — o que fez (CREATE, UPDATE, DELETE, VIEW, etc.)
- `model_type`, `model_id` — sobre qual registro
- `endpoint`, `method` — de qual rota
- `ip_address` — de onde
- `old_values`, `new_values` — o que mudou (JSON)

```php
// Assinatura do método
AuditService::record(
    string $action,
    ?Model $model,
    ?array $oldValues = null,
    ?array $newValues = null,
    ?User $actingUser = null  // opcional: usuário explícito (ex: no login)
): void
```

**Importante:** `AuditService::record()` silencia todas as exceções internamente com `catch (\Throwable)`. O audit nunca quebra a operação principal — se falhar, o usuário não percebe e a operação continua.

---

### 4.2 Bug Crítico: ENUM Silenciando Auditorias

#### O problema

A coluna `audit_logs.action` foi criada como `ENUM`:

```sql
-- Migration original
action ENUM('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE') NOT NULL
```

Quando novos tipos de ação foram introduzidos (`VIEW`, `VIEW_REPORT`, `LIBERAR`, `DOWNLOAD`), o MySQL rejeitava a inserção com um erro de constraint — mas esse erro era engolido pelo `catch (\Throwable)` do `AuditService`. **Zero logs foram gravados para essas ações desde o início, sem qualquer alerta.**

#### Como foi detectado

Ao verificar a tabela `audit_logs` em produção: nenhum registro com `action = 'VIEW'` ou `'LIBERAR'` existia, mesmo após semanas de uso. O `catch` silenciador escondia um erro estrutural.

#### A correção

```php
// Migration: 2026_05_10_400000_alter_audit_logs_action_to_varchar
DB::statement("ALTER TABLE audit_logs MODIFY COLUMN action VARCHAR(30) NOT NULL");
```

`VARCHAR(30)` aceita qualquer string de até 30 caracteres. Novas ações podem ser adicionadas sem migration. O ENUM era uma restrição sem valor real — o código já controla quais strings são usadas.

**Lição:** Nunca use ENUM para campos que representam estados extensíveis do domínio. Use VARCHAR com validação na camada de aplicação.

---

### 4.3 Auditoria de Visualização — Padrão `view*Fetch`

#### O problema de auditar GETs via store Redux

O frontend usava um padrão comum no Redux: ao carregar uma listagem, os dados ficam no store. Ao clicar em um registro para abrir o modal, o dado era extraído diretamente do store — sem fazer nenhuma nova requisição HTTP:

```js
// Padrão anterior — sem audit
const handleVerCliente = (cliente) => {
    setClienteModal(cliente); // dados vêm do store, não do backend
};
// → QueueController::show() NUNCA é chamado → AuditService::record('VIEW') NUNCA dispara
```

#### A solução: `view*Fetch`

```js
// fetchActions/queues/index.js
export const viewQueueFetch = (id, onSuccess) => (dispatch) => {
    api.get(`/queues/${id}`)
        .then((res) => { onSuccess && onSuccess(res.data); })
        .catch(() => {});
};

// queue/index.js — ao clicar no botão de visualizar
dispatch(viewQueueFetch(queue.id, setViewQueue));
// → Chama GET /queues/{id} → QueueController::show() → AuditService::record('VIEW') ✓
```

**Contrato do padrão:**
1. Thunk chama `GET /resource/{id}` ao backend
2. Backend tem `AuditService::record('VIEW', $model)` no `show()`
3. Callback `onSuccess(res.data)` seta o estado local que abre o modal

**Recursos cobertos:** `viewClientFetch`, `viewPedidoFetch`, `viewQueueFetch`.

**Benefício adicional:** O modal sempre exibe dados frescos do banco, não dados que podem ter sido modificados desde que a listagem foi carregada.

---

### 4.4 Cobertura Completa de Auditoria

Após a Fase N, todos os controllers relevantes do sistema registram auditoria para CREATE, UPDATE e DELETE:

| Controller | CREATE | UPDATE | DELETE |
|---|---|---|---|
| LetterController | ✓ | ✓ | ✓ |
| OrdinanceController | ✓ | ✓ | ✓ |
| QueueController | ✓ | ✓ | ✓ |
| ExameController | ✓ | ✓ | ✓ |
| CategoriaExameController | ✓ | ✓ | ✓ |
| ExameCampoController | ✓ | ✓ | ✓ |
| CampoReferenciaController | ✓ | ✓ | ✓ |
| MedicoSolicitanteController | ✓ | ✓ | ✓ |
| VehicleController | ✓ | ✓ | ✓ (active=false) |
| RouteController | ✓ | ✓ | ✓ (active=false) |
| RoomController | ✓ | ✓ | ✓ |
| CallController | ✓ | ✓ | — |
| CallServiceController | ✓ | ✓ | ✓ |
| SystemPageController | ✓ | ✓ | ✓ |
| SectorController | ✓ | ✓ | ✓ |
| PedidoExameController | ✓ via observer | ✓ | ✓ via forceDeleted() |
| ResultadoExameController | — | ✓ LIBERAR | ✓ DOWNLOAD |
| ClientController | — | ✓ | ✓ |
| AuthController | LOGIN | — | — |

**Padrão aplicado em todos:**

```php
// store()
$model = Model::create($data);
AuditService::record('CREATE', $model, null, $model->toArray());

// update()
$old = $model->toArray();           // captura ANTES da alteração
$model->update($data);              // ou $model->save()
AuditService::record('UPDATE', $model, $old, $model->toArray());

// destroy()
AuditService::record('DELETE', $model, $model->toArray(), null);
$model->delete();                   // DEPOIS do audit — garante que o dado ainda existe
```

**Por que auditar ANTES do delete?** Após `$model->delete()`, `$model->toArray()` pode retornar dados incompletos dependendo do tipo de delete. Capturar antes garante que `old_values` estará completo no log.

---

### 4.5 Página de Auditoria — Filtros e Exibição

#### Filtro de usuário inoperante (bug corrigido)

```js
// Frontend enviava:
params: { user_name: 'Douglas' }

// Backend verificava apenas:
if ($request->filled('user_id')) { ... }  // user_name era ignorado
```

Fix: o backend passou a filtrar por `user_name` (exact match). Mais robusto que `user_id` — um usuário deletado perde o ID, mas o nome permanece nos logs históricos.

#### Select de usuários via API

```php
// Novo endpoint: GET /audit-logs/users
public function users()
{
    return AuditLog::select('user_id', 'user_name')
        ->whereNotNull('user_id')
        ->distinct()
        ->orderBy('user_name')
        ->get();
}
```

O frontend popula o select dinamicamente com os usuários que já têm logs — não exige acesso à tabela de usuários.

#### Exibição de endpoint nas ações VIEW

```js
// Helper que transforma a URL em nome legível
const endpointLabel = (endpoint) => {
    if (!endpoint) return null;
    return endpoint
        .replace(/^api\//, '')        // remove prefixo 'api/'
        .replace(/\/\d+$/, '')        // remove ID numérico no final
        .replace(/\/\d+\//, '/')      // remove ID numérico no meio
        .replace(/-/g, ' ');          // hífens viram espaços
};

// 'api/queues/42'              → 'queues'
// 'api/clients/7'              → 'clients'
// 'api/detailed-client-report' → 'detailed client report'
```

Exibido após o chip da ação VIEW/VIEW_REPORT:

```
[VIEW] / clients
[VIEW_REPORT] / detailed client report
```

---

## Parte 5 — UX / Frontend

### 5.1 Dashboards Sempre Montados (Sem Re-fetch por Aba)

#### O que é

No React, quando um componente é desmontado (removido do DOM), seu estado é perdido. Se você usar `{condicao && <Componente />}`, o componente é destruído quando a condição vira `false` e recriado quando volta a `true` — disparando o `useEffect` de fetch novamente.

#### Como estava

```jsx
// pages/dashboard.js
{abas.map((item, idx) => (
    aba === idx && item.component  // && desmonta o componente ao trocar de aba
))}
```

Fluxo problemático:
1. Usuário abre aba "Fila" → FilaDashboard monta → API chamada → dados carregados
2. Usuário vai para aba "TFD" → FilaDashboard é **desmontado** (estado perdido)
3. Usuário volta para "Fila" → FilaDashboard monta **de novo** → API chamada **de novo**

#### Como ficou

```jsx
{abas.map((item, idx) => (
    <Box key={idx} hidden={aba !== idx}>
        {item.component}
    </Box>
))}
```

Com `hidden`, o componente **permanece montado** mas é ocultado via CSS (`display: none`). O estado é preservado. Trocar de aba é instantâneo, sem novas requisições.

| Abordagem | Troca de aba | Re-fetch | Memória |
|---|---|---|---|
| `&&` (antes) | Remonta componente | Sim, sempre | Baixa (apenas 1 montado) |
| `hidden` (depois) | Apenas CSS | Não | Levemente maior (todos montados) |

Para 4 dashboards com dados leves, o consumo extra de memória é irrelevante frente ao ganho de UX.

---

### 5.2 PDF Download Autenticado

#### O problema

Links `<a href={url}>` não enviam headers HTTP. O backend protege o endpoint de download com `middleware('auth:sanctum')` — o token Bearer é necessário. Um link simples sempre retorna `401 Unauthorized`.

#### A solução

```js
const handleDownloadPdf = async (pedidoId) => {
    try {
        const response = await api.get(`/laboratorio/pedidos/${pedidoId}/pdf`, {
            responseType: 'blob',  // recebe bytes, não JSON
        });
        const url = URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `laudo-${pedidoId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);  // libera memória
    } catch (err) {
        // tratar erro
    }
};
```

A instância `api` (Axios) já inclui `Authorization: Bearer {token}` em todas as requisições. O arquivo é recebido como blob em memória e convertido em URL temporária para download.

---

## Resumo das Melhorias (Estado Atual — Fase N)

### Segurança

| # | Problema | Solução |
|---|---|---|
| 1 | Sem rate limiting nos dashboards | `throttle:20,1` nas rotas |
| 2 | Sem controle de acesso por perfil | Gates + middleware `can:` |
| 3 | ENUM em audit_logs silenciava ações VIEW/LIBERAR/DOWNLOAD | Migration para `VARCHAR(30)` |
| 4 | Audit de VIEW não disparava (dados do Redux store) | Padrão `view*Fetch` com GET real |
| 5 | forceDelete() não auditado (observer `deleted` não chamado) | Método `forceDeleted()` no observer |
| 6 | Cascade deletion inconsistente (soft delete + hard delete filhos) | `forceDelete()` com DB CASCADE |

### Performance

| # | Problema | Solução |
|---|---|---|
| 7 | 14 queries por requisição ao dashboard | `Cache::remember` servidor (2–10 min) |
| 8 | Re-fetch ao trocar de aba no dashboard | `hidden` em vez de `&&` |
| 9 | Sem Cache-Control no browser | Header `private, max-age=300` |
| 10 | `DATE_FORMAT()` impedindo uso de índice no WHERE | `whereBetween` com datas explícitas |
| 11 | Colunas sem índice em tabelas de crescimento contínuo | Migration com `$table->index()` |
| 12 | COUNT sem WHERE em tabela de logs | Cache de 10 min resolve o impacto prático |
| 13 | Cache TFD sem diferenciação de período e mês | Cache key dinâmica `tfd.{periodo}.{Y-m}` |

### Confiabilidade e Código

| # | Problema | Solução |
|---|---|---|
| 14 | Sem try/catch nos endpoints Lab e Logs | Try/catch por seção + `Log::error` |
| 15 | Loading/erro duplicado 4× nos dashboards | Componente `DashboardStatus.js` |
| 16 | `.split()` sem null guard crashava o dashboard | Operador `??` antes do split |
| 17 | Magic numbers em limits de queries | Constantes `private const TOP_EXAMES = 10` |
| 18 | `new Date(str)` retornava dia errado (UTC offset) | `s.substring(0,10).split('-')` |
| 19 | `catch (Exception)` não capturava `\Error` | `catch (\Throwable)` em controllers críticos |

### Auditoria

| # | Problema | Solução |
|---|---|---|
| 20 | Login não auditado | `AuditService::record('LOGIN', ..., $user)` em `AuthController::login()` |
| 21 | ~30% dos controllers sem audit CREATE/UPDATE/DELETE | Fase N: cobertura 100% em 15 controllers |
| 22 | Filtro de usuário na auditoria não funcionava | Filtro por `user_name` + endpoint `/audit-logs/users` |
| 23 | Recurso exibido com casing original (`PedidoExame`) | Uppercase com espaços na página de auditoria |
| 24 | Ações VIEW/VIEW_REPORT sem contexto do recurso acessado | Helper `endpointLabel()` exibindo `/ resource-name` |

---

## Commits de Referência (Backend)

| Fase | Hash | Descrição |
|---|---|---|
| A–E | `5b8113c` | fix: bugs críticos laboratório |
| A–E | `498868a` | fix: auditoria, consulta pública, validações |
| A–E | `2f34714` | feat: pesquisa pedidos, LabConfig, dashboards |
| A–E | `9fb30b9` | fix: inputs duplicados no modal resultado |
| A–E | `580975b` | chore: remove sistema de logs antigo |
| A–E | `7c1de27` | feat: editar pedido de exame |
| F–I | `3909151` | fix: cache key mensal TFD, limits dashboard |
| F–I | `386682b` | fix: laudo PDF médico solicitante, catch Throwable |
| F–I | `5d73b2a` | feat: busca por protocolo em pedidos |
| F–I | `500734c` | feat: download laudo PDF na consulta pública |
| J–K | `e39e1bc` | fix: confirmação ao excluir pedido |
| K | `ff6744b` | feat: audit VIEW ficha de cliente |
| L | `e9ea87a` | feat: audit VIEW pedido de exame individual |
| L | `afedfce` | feat: audit VIEW registro de fila |
| M | `b727d85` | fix: forceDelete() ao excluir pedido |
| M | `c619d20` | feat: bloco Exames no relatório de cliente |
| M | `0d82c3e` | fix: remove show() duplicado no QueueController |
| M | `acbcd4e` | **fix: ENUM → VARCHAR(30) em audit_logs.action** |
| M | `970c534` | feat: filtro user_name + endpoint /audit-logs/users |
| N | `845a784` | feat: AuditService CREATE/UPDATE/DELETE em todos os controllers |

## Commits de Referência (Frontend)

| Fase | Hash | Descrição |
|---|---|---|
| A–E | `b0bcfdc` | fix: LabDashboard nome exame + dark mode |
| A–E | `38285f3` | fix: dashboards, PDF blob, validação numérica |
| A–E | `79a420f` | feat: pesquisa, labConfig, TFD período, gráficos |
| A–E | `b489219` | chore: remove logs antigo |
| A–E | `0a7d075` | feat: editar pedido (frontend) |
| F–I | `c0260e3` | fix: dark mode, cache TFD, limits dashboard |
| F–I | `17fa822` | fix: mensagens de erro em salvar/liberar |
| F–I | `56fa175` | feat: fila — visualizar registro completo |
| F–I | `6a3ed9a` | feat: protocolo, datas formatadas, busca protocolo |
| F–I | `d58ab67` | feat: botão baixar laudo PDF na consulta pública |
| F–I | `e875362` | feat: gauge charts no dashboard lab |
| J | `e39e1bc` | fix: confirmação antes de excluir pedido |
| L | `87f3e05` | feat: viewPedidoFetch chama GET antes de abrir dialog |
| L | `132b309` | feat: viewQueueFetch chama GET antes de abrir dialog |
| M | `3d4c478` | feat: bloco Exames + contadores no client_report |
| M | `3c8ca9f` | feat: select usuários, recurso uppercase, auditoria |
| M | `b74e89a` | feat: endpoint após ação VIEW/VIEW_REPORT |
