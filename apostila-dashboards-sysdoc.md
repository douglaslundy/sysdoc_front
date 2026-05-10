# Apostila: Segurança e Performance em Dashboards — Sysdoc

**Projeto:** Sysdoc (Jr Ferragens)
**Stack:** Laravel 10 (backend) + Next.js 12 / React 17 (frontend)
**Data:** Maio 2026

---

## Introdução

Esta apostila documenta as melhorias aplicadas nos dashboards analíticos do Sysdoc. O sistema possui 4 dashboards (Laboratório, Fila, TFD e Logs/QR), cada um consumindo um endpoint do backend que executa múltiplas queries de agregação no banco de dados.

Os problemas encontrados se dividem em três categorias:
- **Segurança** — quem pode acessar o quê, e com que frequência
- **Performance** — como as queries impactam o banco de dados
- **Confiabilidade e código** — o que acontece quando algo falha

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
- TFD: 300s (5 min)
- Logs: 600s (10 min) — dados de acesso, mudam menos

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

Além de duplicação, havia inconsistência: o `TfdDashboard` tinha estado de erro mas os outros não.

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
// Antes (em cada arquivo)
import { Grid, Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';

// Depois
import { Grid, Box, Typography, Card, CardContent } from '@mui/material';
import { DashboardLoading, DashboardErro } from './DashboardStatus';
```

```jsx
// Antes (12 linhas duplicadas)
if (loading) {
    return (
        <Box display="flex" ...>
            <CircularProgress />
        </Box>
    );
}
if (erro || !dados || !chart) {
    return (
        <Box p={4} ...>
            <Typography>Dados não disponíveis.</Typography>
        </Box>
    );
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

Se qualquer motorista vier sem nome do banco, o `useMemo` inteiro falha e o dashboard não renderiza nada — nem os gráficos que funcionavam.

#### Como ficou

```jsx
const motoristaNomes = (motoristas || [])
    .map(m => (m.nome ?? '').split(' ').slice(0, 2).join(' '))  // ?? '' protege o null
    .reverse();
```

O operador `??` (nullish coalescing) retorna o lado direito apenas quando o lado esquerdo é `null` ou `undefined`. Diferente do `||`, ele não ativa para string vazia ou zero — é mais preciso.

---

## Parte 4 — UX / Frontend

### 4.1 Dashboards Sempre Montados (Sem Re-fetch por Aba)

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

Cada troca de aba = uma nova chamada de API.

#### Como ficou

```jsx
{abas.map((item, idx) => (
    <Box key={idx} hidden={aba !== idx}>
        {item.component}
    </Box>
))}
```

Com `hidden`, o componente **permanece montado** mas é ocultado via CSS (`display: none`). O estado é preservado. Trocar de aba é instantâneo, sem novas requisições.

**Por que `hidden` e não `display: none` manual?** O atributo HTML `hidden` aplica `display: none` nativamente, o componente React não renderiza seus filhos visualmente, mas permanece na árvore de componentes com estado intacto.

**Comparação:**

| Abordagem | Troca de aba | Re-fetch | Memória |
|---|---|---|---|
| `&&` (antes) | Remonta componente | Sim, sempre | Baixa (apenas 1 montado) |
| `hidden` (depois) | Apenas CSS | Não | Levemente maior (todos montados) |

Para 4 dashboards com dados leves, o consumo extra de memória é irrelevante frente ao ganho de UX.

---

## Resumo das Melhorias

| # | Problema | Tipo | Solução |
|---|---|---|---|
| 1 | Sem rate limiting | Segurança | `throttle:20,1` nas rotas |
| 2 | Sem controle de acesso | Segurança | Gates + middleware `can:` |
| 3 | COUNT sem WHERE em logs | Performance | Cache de 10 min no endpoint |
| 4 | 14 queries por requisição | Performance | `Cache::remember` no servidor |
| 5 | Re-fetch ao trocar aba | UX | `hidden` em vez de `&&` |
| 6 | Sem try/catch em Lab/Logs | Confiabilidade | Try/catch por seção + `Log::error` |
| 7 | DATE_FORMAT impede índice | Performance | `whereBetween` com datas explícitas |
| 8 | Colunas sem índice | Performance | Migration com `$table->index()` |
| 9 | `.split()` sem null guard | Confiabilidade | Operador `??` antes do split |
| 10 | Sem Cache-Control | Performance | Header `private, max-age=300` |
| 11 | Loading/erro duplicado | Código | Componente `DashboardStatus` |
| 12 | Helper fora do useMemo | Código | Função movida para escopo de módulo |
| 13 | Magic numbers | Manutenção | Constantes de classe `private const` |

---

## Commits de Referência

### Backend (`sysdoc_back`)
| Commit | Tarefa |
|---|---|
| `ffcd50b` | try/catch com fallback em laboratorio() e logs() |
| `f92a6ff` | Cache::remember nos 4 endpoints (2–10min TTL) |
| `1c08aa7` | Cache-Control: private, max-age=300 |
| `d070b6c` | Migration de índices nas colunas dos dashboards |
| `3f68eb9` | whereBetween em vez de DATE_FORMAT |
| `669d4d1` | Gates de permissão por perfil |
| `ffcd50b` | throttle:20,1 nas rotas de dashboard |
| `d5d2032` | Constantes de classe (TOP_EXAMES etc.) |

### Frontend (`sysdoc_front`)
| Commit | Tarefa |
|---|---|
| `62d7b43` | Rate limiting — tratamento de 429 no frontend |
| `6387f33` | Null guard em nome.split() |
| `bcb8c8c` | hidden em vez de && (sem re-fetch ao trocar aba) |
| `a959297` | DashboardStatus.js + LabDashboard atualizado |
| `aa004d8` | DashboardStatus aplicado em Fila, Logs e TFD |
