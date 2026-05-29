# Permissão por Equipe APS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar controle de acesso por equipe nas 7 páginas do Monitor APS, de forma que usuários marcados como RT PSF vejam apenas as equipes autorizadas a eles — filtro aplicado no servidor.

**Architecture:** Duas migrations adicionam flags em `users` e criam a tabela pivot `user_equipe_aps`. Um middleware `EnsureEquipeAps` injeta os INEs permitidos no request antes de qualquer controller. Todos os controllers do monitor-aps chamam helpers em `MonitorApsBaseController` para construir o filtro INE no SQL. O frontend substitui a chamada direta a `/config/equipes` por um hook `useEquipesPermitidas` que respeita as restrições do usuário.

**Tech Stack:** Laravel 10 (PHP 8.1), PHPUnit, MySQL + PostgreSQL eSUS, Next.js 12, React 17, MUI v5, Jest

**Spec:** `docs/superpowers/specs/2026-05-29-permissao-equipe-aps-design.md`

---

## File Map

### Backend (sysdoc_back)

| Ação | Arquivo |
|------|---------|
| Criar | `database/migrations/2026_05_29_100000_add_rt_psf_to_users_table.php` |
| Criar | `database/migrations/2026_05_29_100001_create_user_equipe_aps_table.php` |
| Criar | `app/Models/UserEquipeAps.php` |
| Modificar | `app/Models/User.php` |
| Criar | `app/Http/Middleware/EnsureEquipeAps.php` |
| Modificar | `app/Http/Kernel.php` |
| Criar | `app/Http/Controllers/UserEquipeApsController.php` |
| Modificar | `app/Http/Controllers/MonitorApsBaseController.php` |
| Modificar | `app/Http/Controllers/MonitorApsController.php` |
| Modificar | `app/Http/Controllers/VisitaAcsController.php` |
| Modificar | `app/Http/Controllers/CidadaoAcsController.php` |
| Modificar | `app/Http/Controllers/MonitorApsConfigController.php` |
| Modificar | `app/Http/Requests/UserRequest.php` |
| Modificar | `routes/api.php` |

### Frontend (sysdoc_front)

| Ação | Arquivo |
|------|---------|
| Criar | `src/hooks/useEquipesPermitidas.js` |
| Modificar | `src/services/monitorApsApi.js` |
| Modificar | `src/components/modal/user/index.js` |
| Modificar | `src/components/monitor-aps/VinculoTerritorial.js` |
| Modificar | `src/components/monitor-aps/IndicadoresQualidade.js` |
| Modificar | `src/components/monitor-aps/PorEquipe.js` |
| Modificar | `src/components/monitor-aps/VisitasAcs.js` |
| Modificar | `src/components/monitor-aps/MapaVisitasPage.js` |
| Modificar | `src/components/monitor-aps/VisitasEvolucao.js` |
| Modificar | `src/components/monitor-aps/CidadaosPage.js` |

---

## Task 1: Migrations — Banco de Dados

**Files:**
- Criar: `sysdoc_back/database/migrations/2026_05_29_100000_add_rt_psf_to_users_table.php`
- Criar: `sysdoc_back/database/migrations/2026_05_29_100001_create_user_equipe_aps_table.php`

- [ ] **Step 1: Criar migration 1 — colunas em users**

```bash
cd sysdoc_back
php artisan make:migration add_rt_psf_to_users_table
```

Editar o arquivo gerado em `database/migrations/`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_rt_psf')->default(false)->after('is_driver');
            $table->boolean('rt_all_teams')->default(false)->after('is_rt_psf');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_rt_psf', 'rt_all_teams']);
        });
    }
};
```

- [ ] **Step 2: Criar migration 2 — tabela user_equipe_aps**

```bash
php artisan make:migration create_user_equipe_aps_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_equipe_aps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('nu_ine', 10);
            $table->string('no_equipe', 100);
            $table->unique(['user_id', 'nu_ine']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_equipe_aps');
    }
};
```

- [ ] **Step 3: Rodar as migrations**

```bash
php artisan migrate
```

Resultado esperado: duas linhas "Migrating: ..." seguidas de "Migrated: ..."

- [ ] **Step 4: Verificar schema**

```bash
php artisan tinker
>>> Schema::hasColumn('users', 'is_rt_psf')  # deve retornar true
>>> Schema::hasTable('user_equipe_aps')       # deve retornar true
>>> exit
```

- [ ] **Step 5: Commit**

```bash
git add database/migrations/
git commit -m "feat: migrations — is_rt_psf em users e tabela user_equipe_aps"
```

---

## Task 2: Models — UserEquipeAps e User

**Files:**
- Criar: `sysdoc_back/app/Models/UserEquipeAps.php`
- Modificar: `sysdoc_back/app/Models/User.php`

- [ ] **Step 1: Criar modelo UserEquipeAps**

Criar `sysdoc_back/app/Models/UserEquipeAps.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserEquipeAps extends Model
{
    protected $table = 'user_equipe_aps';

    protected $fillable = ['user_id', 'nu_ine', 'no_equipe'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

- [ ] **Step 2: Atualizar modelo User**

Em `sysdoc_back/app/Models/User.php`, alterar `$fillable` e adicionar o relacionamento:

```php
protected $fillable = ['profile', 'name', 'email', 'cpf', 'is_driver', 'is_rt_psf', 'rt_all_teams', 'password', 'active', 'inactive_date'];
```

E adicionar o método ao final da classe (antes do `}`):

```php
public function equipeAps()
{
    return $this->hasMany(UserEquipeAps::class, 'user_id');
}
```

- [ ] **Step 3: Verificar no tinker**

```bash
php artisan tinker
>>> $u = App\Models\User::first()
>>> $u->is_rt_psf          # false
>>> $u->equipeAps->count() # 0
>>> exit
```

- [ ] **Step 4: Commit**

```bash
git add app/Models/UserEquipeAps.php app/Models/User.php
git commit -m "feat: modelo UserEquipeAps e relacionamento em User"
```

---

## Task 3: Middleware EnsureEquipeAps

**Files:**
- Criar: `sysdoc_back/app/Http/Middleware/EnsureEquipeAps.php`
- Modificar: `sysdoc_back/app/Http/Kernel.php`

- [ ] **Step 1: Criar middleware**

```bash
php artisan make:middleware EnsureEquipeAps
```

Substituir o conteúdo de `sysdoc_back/app/Http/Middleware/EnsureEquipeAps.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEquipeAps
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_rt_psf || $user->rt_all_teams) {
            $request->attributes->set('_ines_permitidos', null);
            return $next($request);
        }

        $ines = $user->equipeAps->pluck('nu_ine')->toArray();
        $request->attributes->set('_ines_permitidos', $ines);

        return $next($request);
    }
}
```

Regra: `null` em `_ines_permitidos` = sem restrição. Array vazio = sem equipes = sem resultados.

- [ ] **Step 2: Registrar middleware no Kernel**

Em `sysdoc_back/app/Http/Kernel.php`, adicionar ao array `$routeMiddleware`:

```php
'equipe.aps' => \App\Http\Middleware\EnsureEquipeAps::class,
```

Resultado final do trecho de `$routeMiddleware`:

```php
protected $routeMiddleware = [
    'auth'        => \App\Http\Middleware\Authenticate::class,
    'admin'       => \App\Http\Middleware\AdminOnly::class,
    'audit.read'  => \App\Http\Middleware\AuditReadAccess::class,
    'equipe.aps'  => \App\Http\Middleware\EnsureEquipeAps::class,
    // ...restante sem alteração
];
```

- [ ] **Step 3: Commit**

```bash
git add app/Http/Middleware/EnsureEquipeAps.php app/Http/Kernel.php
git commit -m "feat: middleware EnsureEquipeAps injeta INEs permitidos no request"
```

---

## Task 4: Helpers em MonitorApsBaseController

**Files:**
- Modificar: `sysdoc_back/app/Http/Controllers/MonitorApsBaseController.php`

Os helpers centralizam toda a lógica de filtro INE. Controllers nunca lêem `_ines_permitidos` diretamente.

- [ ] **Step 1: Adicionar métodos helpers**

Em `sysdoc_back/app/Http/Controllers/MonitorApsBaseController.php`, adicionar após o método `hasColumn()` (antes do `}`):

```php
/**
 * Retorna null (sem restrição) ou array de INEs permitidos para o usuário.
 * Definido pelo middleware EnsureEquipeAps.
 */
protected function resolveAllowedInes(Request $request): ?array
{
    return $request->attributes->get('_ines_permitidos');
}

/**
 * Aborta com 403 se o INE requisitado não estiver na lista de INEs permitidos.
 * Não faz nada se a lista for null (sem restrição) ou se $ine for null.
 */
protected function assertIneAllowed(Request $request, ?string $ine): void
{
    if ($ine === null) return;
    $allowed = $this->resolveAllowedInes($request);
    if ($allowed !== null && !in_array($ine, $allowed, true)) {
        abort(403, 'Equipe não autorizada.');
    }
}

/**
 * Retorna o fragmento WHERE + bindings para filtrar por INE(s).
 *
 * Casos:
 *   - $ine preenchido: filtra exatamente por esse INE (já validado por assertIneAllowed).
 *   - $ine null + $allowedInes null: sem filtro.
 *   - $ine null + $allowedInes []: WHERE 1=0 (usuário RT sem equipes = sem resultados).
 *   - $ine null + $allowedInes ['A','B']: WHERE nu_ine IN ('A','B').
 *
 * @param string $column  Nome da coluna INE na query (ex: 'e.nu_ine' ou 'nu_ine').
 */
protected function buildIneWhere(?string $ine, ?array $allowedInes, string $column = 'nu_ine'): array
{
    if ($ine !== null) {
        return ["{$column} = ?", [$ine]];
    }

    if ($allowedInes === null) {
        return ['', []];
    }

    if (empty($allowedInes)) {
        return ['1=0', []];
    }

    $placeholders = implode(',', array_fill(0, count($allowedInes), '?'));
    return ["{$column} IN ({$placeholders})", $allowedInes];
}

/**
 * Retorna um sufixo para chave de cache que previne colisão entre
 * usuários com restrições diferentes de equipe.
 */
protected function cacheRestrictSuffix(?array $allowedInes): string
{
    if ($allowedInes === null) return '';
    if (empty($allowedInes)) return '_r_empty';
    return '_r' . substr(md5(implode(',', $allowedInes)), 0, 8);
}
```

Adicionar o `use Illuminate\Http\Request;` ao topo do arquivo se ainda não estiver presente.

- [ ] **Step 2: Verificar sintaxe**

```bash
cd sysdoc_back
php artisan route:list --path=monitor-aps 2>&1 | head -5
```

Deve listar rotas sem erros de sintaxe.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/MonitorApsBaseController.php
git commit -m "feat: helpers resolveAllowedInes, assertIneAllowed, buildIneWhere em MonitorApsBaseController"
```

---

## Task 5: UserEquipeApsController — CRUD de equipes por usuário

**Files:**
- Criar: `sysdoc_back/app/Http/Controllers/UserEquipeApsController.php`

- [ ] **Step 1: Criar o controller**

Criar `sysdoc_back/app/Http/Controllers/UserEquipeApsController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserEquipeAps;
use Illuminate\Http\Request;

class UserEquipeApsController extends Controller
{
    /**
     * GET /users/{id}/equipe-aps
     * Retorna a config RT + equipes de um usuário específico (admin).
     */
    public function show(User $user)
    {
        return response()->json([
            'is_rt_psf'   => (bool) $user->is_rt_psf,
            'rt_all_teams' => (bool) $user->rt_all_teams,
            'equipes'     => $user->equipeAps->map(fn($e) => [
                'nu_ine'    => $e->nu_ine,
                'no_equipe' => $e->no_equipe,
            ])->values(),
        ]);
    }

    /**
     * PUT /users/{id}/equipe-aps
     * Salva is_rt_psf, rt_all_teams e sincroniza equipes (admin).
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'is_rt_psf'    => 'required|boolean',
            'rt_all_teams' => 'required|boolean',
            'equipes'      => 'nullable|array',
            'equipes.*.nu_ine'    => 'required_with:equipes|string|max:10',
            'equipes.*.no_equipe' => 'required_with:equipes|string|max:100',
        ]);

        $user->update([
            'is_rt_psf'    => $data['is_rt_psf'],
            'rt_all_teams' => $data['rt_all_teams'],
        ]);

        // Sincronizar equipes: deletar as removidas, inserir as novas.
        UserEquipeAps::where('user_id', $user->id)->delete();

        if (!empty($data['equipes']) && $data['is_rt_psf'] && !$data['rt_all_teams']) {
            foreach ($data['equipes'] as $eq) {
                UserEquipeAps::create([
                    'user_id'   => $user->id,
                    'nu_ine'    => $eq['nu_ine'],
                    'no_equipe' => $eq['no_equipe'],
                ]);
            }
        }

        return response()->json([
            'is_rt_psf'    => (bool) $user->is_rt_psf,
            'rt_all_teams' => (bool) $user->rt_all_teams,
            'equipes'      => $user->fresh()->equipeAps->map(fn($e) => [
                'nu_ine'    => $e->nu_ine,
                'no_equipe' => $e->no_equipe,
            ])->values(),
        ]);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/UserEquipeApsController.php
git commit -m "feat: UserEquipeApsController — GET/PUT equipes por usuário"
```

---

## Task 6: Endpoint minhasEquipes em MonitorApsController

**Files:**
- Modificar: `sysdoc_back/app/Http/Controllers/MonitorApsController.php`

- [ ] **Step 1: Adicionar método minhasEquipes**

Em `MonitorApsController.php`, adicionar após o método `resumo()` (ou no final da seção de endpoints públicos):

```php
/**
 * GET /monitor-aps/minhas-equipes
 * Retorna as equipes que o usuário logado pode visualizar.
 * Se irrestrito: equipes vazias + flags indicando acesso total.
 * Se restrito: lista de equipes do user_equipe_aps.
 */
public function minhasEquipes(Request $request)
{
    $user = $request->user();

    $isRt      = (bool) $user->is_rt_psf;
    $allTeams  = (bool) $user->rt_all_teams;
    $restrito  = $isRt && !$allTeams;

    return response()->json([
        'is_rt'     => $isRt,
        'all_teams' => $allTeams,
        'equipes'   => $restrito
            ? $user->equipeAps->map(fn($e) => [
                'nu_ine'    => $e->nu_ine,
                'no_equipe' => $e->no_equipe,
              ])->values()
            : [],
    ]);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/MonitorApsController.php
git commit -m "feat: endpoint GET /monitor-aps/minhas-equipes"
```

---

## Task 7: Aplicar filtro em MonitorApsController (vinculo, qualidade, resumo, historico)

**Files:**
- Modificar: `sysdoc_back/app/Http/Controllers/MonitorApsController.php`

O padrão em todos os métodos abaixo é:
1. Resolver `$allowedInes` e `$ine`
2. Chamar `assertIneAllowed($request, $ine)`
3. Usar `buildIneWhere($ine, $allowedInes, 'nu_ine')` para construir o WHERE
4. Incluir `cacheRestrictSuffix($allowedInes)` na chave de cache

- [ ] **Step 1: Atualizar params() para retornar o ine com mais segurança**

Localizar o método `params(Request $request)` no controller. Ele deve retornar `ine` nos parâmetros. Se não retornar, adicionar:

```php
private function params(Request $request): array
{
    return [
        'ano'          => (int) ($request->query('ano') ?? date('Y')),
        'quadrimestre' => (int) ($request->query('quadrimestre') ?? ceil(date('n') / 4)),
        'ine'          => $request->query('ine') ?: null,
        'bloco'        => $request->query('bloco') ?: null,
    ];
}
```

- [ ] **Step 2: Atualizar vinculo()**

Localizar `public function vinculo(Request $request)` e substituir:

```php
public function vinculo(Request $request)
{
    ['ano' => $ano, 'quadrimestre' => $quad, 'ine' => $ine] = $this->params($request);
    $this->assertIneAllowed($request, $ine);
    $allowedInes = $this->resolveAllowedInes($request);

    try {
        $restrictSuffix = $this->cacheRestrictSuffix($allowedInes);
        $cacheKey = 'aps_vinculo_' . $ano . '_' . $quad . '_' . ($ine ?? 'all') . $restrictSuffix;
        $data = Cache::remember($cacheKey, 600, fn() => $this->calcularVinculo($ano, $quad, $ine, $allowedInes));
        return response()->json(['periodo' => ['ano' => $ano, 'quadrimestre' => $quad], 'equipes' => $data]);
    } catch (\Throwable $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
```

- [ ] **Step 3: Atualizar calcularVinculo() para aceitar allowedInes**

Localizar `private function calcularVinculo(...)` e adicionar `?array $allowedInes = null` na assinatura. Dentro do método, ao construir a query das equipes, usar `buildIneWhere`:

```php
private function calcularVinculo(int $ano, int $quad, ?string $ine = null, ?array $allowedInes = null): array
{
    // ... código existente antes da query de equipes

    $sql = 'SELECT nu_ine, no_equipe FROM tb_dim_equipe WHERE st_registro_valido = 1 AND nu_ine != \'-\'';
    $bindings = [];

    [$ineWhere, $ineBindings] = $this->buildIneWhere($ine, $allowedInes, 'nu_ine');
    if ($ineWhere) {
        $sql .= ' AND ' . $ineWhere;
        $bindings = array_merge($bindings, $ineBindings);
    }

    // Se lista resultante for vazia por restrição, retornar cedo
    if ($ineWhere === '1=0') return [];

    $sql .= ' ORDER BY no_equipe';
    $equipes = $this->db()->select($sql, $bindings);

    // ... restante do código existente
}
```

**Nota:** O código interno de `calcularVinculo` pode variar. O ponto de inserção é onde a query `SELECT nu_ine, no_equipe FROM tb_dim_equipe` é construída. Adapte mantendo a lógica existente.

- [ ] **Step 4: Atualizar qualidade()**

```php
public function qualidade(Request $request)
{
    set_time_limit(120);
    ['ano' => $ano, 'quadrimestre' => $quad, 'ine' => $ine, 'bloco' => $bloco] = $this->params($request);
    $this->assertIneAllowed($request, $ine);
    $allowedInes = $this->resolveAllowedInes($request);

    try {
        $restrictSuffix = $this->cacheRestrictSuffix($allowedInes);
        $cacheKey = 'aps_qualidade_' . $ano . '_' . $quad . '_' . ($ine ?? 'all') . '_' . ($bloco ?? 'esf') . $restrictSuffix;
        $indicadores = Cache::remember($cacheKey, 600, function () use ($ano, $quad, $ine, $bloco, $allowedInes) {
            $sql = 'SELECT nu_ine, no_equipe FROM tb_dim_equipe WHERE st_registro_valido = 1 AND nu_ine != \'-\'';
            $bindings = [];

            [$ineWhere, $ineBindings] = $this->buildIneWhere($ine, $allowedInes, 'nu_ine');
            if ($ineWhere) {
                $sql .= ' AND ' . $ineWhere;
                $bindings = array_merge($bindings, $ineBindings);
            }
            if ($ineWhere === '1=0') return [];

            $sql .= ' ORDER BY no_equipe';
            $equipes = $this->db()->select($sql, $bindings);

            if ($bloco === 'esb') {
                return $this->calcularESBBatch($equipes, $ano, $quad);
            }
            return $this->calcularESFBatch($equipes, $ano, $quad);
        });
        return response()->json(['periodo' => ['ano' => $ano, 'quadrimestre' => $quad], 'indicadores' => $indicadores]);
    } catch (\Throwable $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
```

- [ ] **Step 5: Atualizar qualidadeIndicador()**

```php
public function qualidadeIndicador(Request $request, int $id)
{
    ['ano' => $ano, 'quadrimestre' => $quad, 'ine' => $ine] = $this->params($request);
    if (!$ine) return response()->json(['error' => 'Parâmetro ine é obrigatório'], 400);
    $this->assertIneAllowed($request, $ine);

    $mapa = [
        1 => 'calcularInd1',  2 => 'calcularInd2',  3 => 'calcularInd3',
        4 => 'calcularInd4',  5 => 'calcularInd5',  6 => 'calcularInd6',
        7 => 'calcularInd7',  8 => 'calcularInd8',  9 => 'calcularInd9',
        10 => 'calcularInd10', 11 => 'calcularInd11', 13 => 'calcularInd13',
        14 => 'calcularInd14', 15 => 'calcularInd15',
    ];
    $method = $mapa[$id] ?? null;
    if (!$method) return response()->json(['error' => "Indicador {$id} não encontrado"], 404);

    try {
        return response()->json($this->$method($ine, $ano, $quad));
    } catch (\Throwable $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
```

- [ ] **Step 6: Atualizar resumo() para usar allowedInes**

Em `resumo()`, localizar onde as equipes são buscadas:
```php
$equipes = $this->db()->select(
    'SELECT nu_ine, no_equipe FROM tb_dim_equipe WHERE st_registro_valido = 1 AND nu_ine != \'-\' ORDER BY no_equipe'
);
```

Substituir por:

```php
$allowedInes = $this->resolveAllowedInes($request);
[$ineWhere, $ineBindings] = $this->buildIneWhere(null, $allowedInes, 'nu_ine');
$equipeSql = 'SELECT nu_ine, no_equipe FROM tb_dim_equipe WHERE st_registro_valido = 1 AND nu_ine != \'-\'';
if ($ineWhere) $equipeSql .= ' AND ' . $ineWhere;
$equipeSql .= ' ORDER BY no_equipe';
$equipes = $this->db()->select($equipeSql, $ineBindings);
```

Atualizar também a chave de cache de `resumo()`:
```php
$restrictSuffix = $this->cacheRestrictSuffix($allowedInes);
$data = Cache::remember("aps_resumo_{$ano}_{$quad}{$restrictSuffix}", 600, function () use (...) { ... });
```

**Nota:** `resumo()` recebe `Request $request` na assinatura — confirme isso antes de chamar `resolveAllowedInes($request)`.

- [ ] **Step 7: Atualizar historico() da mesma forma que vinculo()**

Localizar `public function historico(Request $request)` e aplicar o mesmo padrão: `assertIneAllowed`, `resolveAllowedInes`, `buildIneWhere`, e sufixo na chave de cache.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/MonitorApsController.php
git commit -m "feat: filtro por equipe em MonitorApsController (vinculo, qualidade, resumo, historico)"
```

---

## Task 8: Aplicar filtro em VisitaAcsController

**Files:**
- Modificar: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

O `VisitaAcsController` usa um método privado `buildWhere()` compartilhado por todos os endpoints. Vamos adicionar suporte a `$allowedInes` nele.

- [ ] **Step 1: Adicionar parâmetro $allowedInes em buildWhere()**

Localizar a assinatura de `buildWhere()` e adicionar o novo parâmetro:

```php
private function buildWhere(
    int $ano, int $mes, ?string $ine,
    ?string $agentName = null,
    ?string $desfecho = null,
    ?string $hasGeo = null,
    ?array $allowedInes = null
): array {
    $cbos = implode("','", self::ACS_CBOS);
    $where = "c.nu_cbo IN ('{$cbos}') AND t.nu_ano = ? AND t.nu_mes = ?";
    $params = [$ano, $mes];

    if ($ine) {
        $where .= ' AND e.nu_ine = ?';
        $params[] = $ine;
    } elseif ($allowedInes !== null) {
        if (empty($allowedInes)) {
            $where .= ' AND 1=0';
        } else {
            $ph = implode(',', array_fill(0, count($allowedInes), '?'));
            $where .= " AND e.nu_ine IN ({$ph})";
            $params = array_merge($params, $allowedInes);
        }
    }

    if ($agentName) {
        $where .= ' AND p.no_profissional = ?';
        $params[] = $agentName;
    }

    if ($desfecho !== null && $desfecho !== '') {
        $where .= ' AND d.co_seq_dim_desfecho_visita = ?';
        $params[] = (int) $desfecho;
    }

    if ($hasGeo === 'sim') {
        $where .= ' AND v.nu_latitude IS NOT NULL AND v.nu_longitude IS NOT NULL';
    } elseif ($hasGeo === 'nao') {
        $where .= ' AND (v.nu_latitude IS NULL OR v.nu_longitude IS NULL)';
    }

    return [$where, $params];
}
```

- [ ] **Step 2: Atualizar cada endpoint público para passar $allowedInes**

Em cada método público do VisitaAcsController, adicionar **no início** do método:

```php
$ine = $request->query('ine') ?: null;
$this->assertIneAllowed($request, $ine);
$allowedInes = $this->resolveAllowedInes($request);
```

E passar `$allowedInes` ao chamar `buildWhere()`:
```php
[$where, $params] = $this->buildWhere($ano, $mes, $ine, ..., $allowedInes);
```

Endpoints a atualizar: `index()`, `resumo()`, `lista()`, `mapa()`, `agentes()`, `evolucao()`, `responsabilidade()`.

**Nota:** Alguns endpoints podem não ter `$ine` como parâmetro URL — confira antes de adicionar `assertIneAllowed`. O método `show()` (detalhe de uma visita por ID) não usa equipes, não precisa de alteração.

- [ ] **Step 3: Atualizar endpoint equipes() para filtrar por allowedInes**

O método `equipes()` em VisitaAcsController retorna equipes que têm ACS. Localizar a query e adicionar suporte:

```php
public function equipes(Request $request): JsonResponse
{
    $allowedInes = $this->resolveAllowedInes($request);
    [$ineWhere, $ineBindings] = $this->buildIneWhere(null, $allowedInes, 'e.nu_ine');

    $sql = "SELECT e.nu_ine, e.no_equipe, COUNT(DISTINCT p.co_seq_dim_profissional) AS total_acs
            FROM tb_dim_equipe e
            JOIN ... -- manter JOINs existentes
            WHERE ..."; // manter WHERE existente
    if ($ineWhere) $sql .= ' AND ' . $ineWhere;
    // manter GROUP BY, ORDER BY existentes

    // Usar $ineBindings nos bindings da query
}
```

**Nota:** Adapte ao código existente do método `equipes()`. O ponto de inserção é após o WHERE existente.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/VisitaAcsController.php
git commit -m "feat: filtro por equipe em VisitaAcsController"
```

---

## Task 9: Aplicar filtro em CidadaoAcsController

**Files:**
- Modificar: `sysdoc_back/app/Http/Controllers/CidadaoAcsController.php`

- [ ] **Step 1: Atualizar index()**

Em `index()`, adicionar após a validação do request:

```php
$ine = $request->query('ine') ?: null;
$this->assertIneAllowed($request, $ine);
$allowedInes = $this->resolveAllowedInes($request);
```

Na query existente onde `$ine` é usada para filtrar (procurar por `AND e.nu_ine` ou similar), substituir pelo padrão `buildIneWhere`:

```php
[$ineWhere, $ineBindings] = $this->buildIneWhere($ine, $allowedInes, 'e.nu_ine');
```

Incluir `$ineWhere` na cláusula WHERE da query e `$ineBindings` nos bindings.

- [ ] **Step 2: Atualizar agentes()**

Mesma lógica que `index()`: obter `$ine`, validar com `assertIneAllowed`, resolver `allowedInes`, aplicar `buildIneWhere` na query.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/CidadaoAcsController.php
git commit -m "feat: filtro por equipe em CidadaoAcsController"
```

---

## Task 10: Rotas — api.php e MonitorApsConfigController

**Files:**
- Modificar: `sysdoc_back/routes/api.php`
- Modificar: `sysdoc_back/app/Http/Controllers/MonitorApsConfigController.php`

- [ ] **Step 1: Remover admin de config/equipes e adicionar middleware equipe.aps**

Em `sysdoc_back/routes/api.php`, localizar o bloco `monitor-aps` e fazer as seguintes alterações:

**Antes:**
```php
Route::prefix('monitor-aps')->middleware(['throttle:60,1'])->group(function () {
    Route::prefix('indicadores')->group(function () {
        Route::get('/resumo', [MonitorApsController::class, 'resumo']);
        Route::get('/vinculo', [MonitorApsController::class, 'vinculo']);
        // ...
    });
    // ...
    Route::get('/config/equipes', [MonitorApsConfigController::class, 'equipes']);
    Route::middleware('admin')->group(function () {
        Route::post('/config/test', [MonitorApsConfigController::class, 'testar']);
        Route::post('/config/save', [MonitorApsConfigController::class, 'save']);
        Route::get('/config/explorar', [MonitorApsConfigController::class, 'explorar']);
    });
```

**Depois:**
```php
Route::prefix('monitor-aps')->middleware(['throttle:60,1', 'equipe.aps'])->group(function () {
    Route::prefix('indicadores')->group(function () {
        Route::get('/resumo', [MonitorApsController::class, 'resumo']);
        Route::get('/vinculo', [MonitorApsController::class, 'vinculo']);
        Route::get('/qualidade', [MonitorApsController::class, 'qualidade']);
        Route::get('/qualidade/{id}', [MonitorApsController::class, 'qualidadeIndicador']);
        Route::get('/repasse', [MonitorApsController::class, 'repasse']);
        Route::get('/historico', [MonitorApsController::class, 'historico']);
    });
    Route::get('/minhas-equipes', [MonitorApsController::class, 'minhasEquipes']);
    Route::prefix('visitas')->group(function () {
        // ...manter rotas existentes...
    });
    Route::get('/config/status', [MonitorApsConfigController::class, 'status']);
    Route::get('/config/load', [MonitorApsConfigController::class, 'load']);
    Route::get('/config/equipes', [MonitorApsConfigController::class, 'equipes']); // removido do grupo admin
    Route::middleware('admin')->group(function () {
        Route::post('/config/test', [MonitorApsConfigController::class, 'testar']);
        Route::post('/config/save', [MonitorApsConfigController::class, 'save']);
        Route::get('/config/explorar', [MonitorApsConfigController::class, 'explorar']);
    });
    Route::prefix('cidadaos')->group(function () {
        Route::get('/',        [CidadaoAcsController::class, 'index']);
        Route::get('/agentes', [CidadaoAcsController::class, 'agentes']);
    });
});
```

- [ ] **Step 2: Adicionar rotas para UserEquipeApsController**

Dentro do grupo `auth:sanctum` existente (fora do bloco monitor-aps), adicionar:

```php
// Equipes APS por usuário (admin)
Route::middleware('admin')->group(function () {
    Route::get('/users/{user}/equipe-aps',  [UserEquipeApsController::class, 'show']);
    Route::put('/users/{user}/equipe-aps',  [UserEquipeApsController::class, 'update']);
});
```

- [ ] **Step 3: Adicionar import do UserEquipeApsController no topo do api.php**

```php
use App\Http\Controllers\UserEquipeApsController;
```

- [ ] **Step 4: Verificar rotas**

```bash
php artisan route:list --path=monitor-aps | grep -E "equipe|minhas"
php artisan route:list --path=users | grep equipe
```

Deve mostrar as novas rotas.

- [ ] **Step 5: Commit**

```bash
git add routes/api.php
git commit -m "feat: rotas — minhas-equipes, equipe-aps por usuário, middleware equipe.aps"
```

- [ ] **Step 6: Atualizar UserRequest.php para aceitar is_rt_psf e rt_all_teams**

Em `sysdoc_back/app/Http/Requests/UserRequest.php`, adicionar ao array de `rules()`:

```php
'is_rt_psf'    => ['nullable', 'boolean'],
'rt_all_teams' => ['nullable', 'boolean'],
```

```bash
git add app/Http/Requests/UserRequest.php
git commit -m "feat: UserRequest aceita is_rt_psf e rt_all_teams"
```

---

## Task 11: Frontend — Hook useEquipesPermitidas + monitorApsApi.put()

**Files:**
- Criar: `sysdoc_front/src/hooks/useEquipesPermitidas.js`
- Modificar: `sysdoc_front/src/services/monitorApsApi.js`

- [ ] **Step 1: Adicionar método put() em monitorApsApi.js**

Substituir o conteúdo de `sysdoc_front/src/services/monitorApsApi.js`:

```js
import { api } from './api';

const BASE = '/monitor-aps';

const get = async (path, options = {}) => {
    const res = await api.get(BASE + path, { signal: options.signal });
    return res.data;
};

const post = async (path, body, options = {}) => {
    const res = await api.post(BASE + path, body, { signal: options.signal });
    return res.data;
};

export const monitorApsApi = { get, post };
```

**Nota:** `monitorApsApi` não precisa de `put()` pois a chamada `/users/{id}/equipe-aps` usa o `api` geral (não o `monitorApsApi`). O `monitorApsApi` fica como está.

- [ ] **Step 2: Criar hook useEquipesPermitidas**

Criar `sysdoc_front/src/hooks/useEquipesPermitidas.js`:

```js
import { useEffect, useState } from 'react';
import { monitorApsApi } from '../services/monitorApsApi';

/**
 * Retorna as equipes que o usuário logado pode visualizar no Monitor APS.
 *
 * - isRt: true se o usuário é RT de equipe PSF
 * - allTeams: true se RT mas com acesso a todas as equipes
 * - isRestrito: true = deve usar `equipes` diretamente; false = buscar de /config/equipes
 * - equipes: array [{nu_ine, no_equipe}] — preenchido apenas quando isRestrito=true
 * - loading: true enquanto aguarda a resposta
 */
export function useEquipesPermitidas() {
    const [state, setState] = useState({
        isRt: false,
        allTeams: false,
        isRestrito: false,
        equipes: [],
        loading: true,
    });

    useEffect(() => {
        const ctrl = new AbortController();
        monitorApsApi.get('/minhas-equipes', { signal: ctrl.signal })
            .then(d => {
                const isRt      = Boolean(d.is_rt);
                const allTeams  = Boolean(d.all_teams);
                const isRestrito = isRt && !allTeams;
                setState({
                    isRt,
                    allTeams,
                    isRestrito,
                    equipes: d.equipes ?? [],
                    loading: false,
                });
            })
            .catch(() => setState(s => ({ ...s, loading: false })));
        return () => ctrl.abort();
    }, []);

    return state;
}
```

- [ ] **Step 3: Testar o hook manualmente**

Abrir o console do browser em qualquer página `/monitor-aps/` autenticada após o backend estar rodando:

```js
fetch('/api/monitor-aps/minhas-equipes', { headers: { Authorization: 'Bearer <token>' } })
  .then(r => r.json()).then(console.log)
// Esperado: { is_rt: false, all_teams: false, equipes: [] }
```

- [ ] **Step 4: Commit**

```bash
cd sysdoc_front
git add src/hooks/useEquipesPermitidas.js src/services/monitorApsApi.js
git commit -m "feat: hook useEquipesPermitidas para controle de acesso por equipe"
```

---

## Task 12: Frontend — UserModal — Seção RT PSF

**Files:**
- Modificar: `sysdoc_front/src/components/modal/user/index.js`

- [ ] **Step 1: Adicionar estados ao form**

No estado inicial do `form`, adicionar:

```js
const [form, setForm] = useState({
    profile: '',
    name: '',
    email: '',
    cpf: '',
    is_driver: false,
    is_rt_psf: false,
    rt_all_teams: false,
    password: '',
    password2: '',
});
```

Também adicionar estado local para equipes vinculadas:
```js
const [equipesRt, setEquipesRt] = useState([]);         // equipes atribuídas ao usuário
const [equipesOpcoes, setEquipesOpcoes] = useState([]);  // lista completa do eSUS
const [loadingEquipes, setLoadingEquipes] = useState(false);
```

- [ ] **Step 2: Adicionar imports necessários**

Adicionar aos imports do MUI:
```js
import {
    // ... imports existentes ...
    Autocomplete,
    Checkbox,
    Chip,
} from '@mui/material';
```

Adicionar import do `api`:
```js
import { api } from '../../../services/api';
```

- [ ] **Step 3: Carregar equipes do eSUS quando o toggle RT é ativado**

Adicionar `useEffect` para carregar equipes:

```js
useEffect(() => {
    if (!form.is_rt_psf || equipesOpcoes.length > 0) return;
    setLoadingEquipes(true);
    api.get('/monitor-aps/config/equipes')
        .then(r => setEquipesOpcoes(r.data.equipes ?? []))
        .catch(() => {})
        .finally(() => setLoadingEquipes(false));
}, [form.is_rt_psf, equipesOpcoes.length]);
```

- [ ] **Step 4: Carregar equipes salvas ao editar usuário existente**

Adicionar ao `useEffect` que carrega o usuário para edição:

```js
useEffect(() => {
    if (user && user.id) {
        setForm({
            ...user,
            is_driver: user.is_driver === true || Number(user.is_driver) === 1,
            is_rt_psf: Boolean(user.is_rt_psf),
            rt_all_teams: Boolean(user.rt_all_teams),
        });
        // Buscar equipes vinculadas ao usuário
        if (userProfile === 'admin') {
            api.get(`/users/${user.id}/equipe-aps`)
                .then(r => setEquipesRt(r.data.equipes ?? []))
                .catch(() => {});
        }
    }
}, [user]);
```

- [ ] **Step 5: Salvar equipes ao gravar**

Atualizar `handlePutData()` para, após salvar o usuário, salvar as equipes se for RT:

```js
const handlePutData = async () => {
    if (password && password !== password2) return;

    dispatch(changeTitleAlert(`O usuario ${form.name} foi atualizado com sucesso!`));
    dispatch(editUserFetch(form, async () => {
        // Após salvar dados pessoais, salvar config RT
        if (userProfile === 'admin' && user?.id) {
            await api.put(`/users/${user.id}/equipe-aps`, {
                is_rt_psf:    form.is_rt_psf,
                rt_all_teams: form.rt_all_teams,
                equipes:      form.is_rt_psf && !form.rt_all_teams ? equipesRt : [],
            }).catch(() => {});
        }
        cleanForm();
    }));
};
```

**Nota:** Se `editUserFetch` não aceita callback async, ajuste para chamar `api.put` em seguida ao dispatch. Verifique a assinatura de `editUserFetch` em `src/store/fetchActions/user/index.js`.

- [ ] **Step 6: Adicionar seção RT no formulário (após o switch is_driver)**

No JSX, após o `<FormControlLabel>` do `is_driver`, adicionar (dentro do `<Stack spacing={2}>`):

```jsx
{userProfile === 'admin' && (
    <>
        <FormControlLabel
            control={
                <Switch
                    checked={Boolean(form.is_rt_psf)}
                    onChange={e => setForm(f => ({
                        ...f,
                        is_rt_psf: e.target.checked,
                        rt_all_teams: false,
                    }))}
                />
            }
            label="É Responsável Técnico de Equipe PSF"
        />

        {form.is_rt_psf && (
            <FormControlLabel
                control={
                    <Checkbox
                        checked={Boolean(form.rt_all_teams)}
                        onChange={e => setForm(f => ({ ...f, rt_all_teams: e.target.checked }))}
                    />
                }
                label="Acesso a todas as equipes"
            />
        )}

        {form.is_rt_psf && !form.rt_all_teams && (
            <Autocomplete
                multiple
                options={equipesOpcoes}
                loading={loadingEquipes}
                getOptionLabel={opt => opt.no_equipe ?? ''}
                isOptionEqualToValue={(opt, val) => opt.nu_ine === val.nu_ine}
                value={equipesRt}
                onChange={(_, newValue) => setEquipesRt(newValue)}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            key={option.nu_ine}
                            label={option.no_equipe}
                            size="small"
                            {...getTagProps({ index })}
                        />
                    ))
                }
                renderInput={params => (
                    <TextField
                        {...params}
                        label="Equipes autorizadas"
                        placeholder={equipesRt.length === 0 ? 'Selecione as equipes' : ''}
                        variant="outlined"
                    />
                )}
            />
        )}
    </>
)}
```

- [ ] **Step 7: Limpar equipesRt ao fechar o modal**

Em `cleanForm()`, adicionar:
```js
setEquipesRt([]);
setEquipesOpcoes([]);
```

- [ ] **Step 8: Commit**

```bash
git add src/components/modal/user/index.js
git commit -m "feat: UserModal — seção RT PSF com toggle, checkbox e seletor de equipes"
```

---

## Task 13: Frontend — 7 Páginas usam useEquipesPermitidas

**Files:**
- Modificar: `sysdoc_front/src/components/monitor-aps/VinculoTerritorial.js`
- Modificar: `sysdoc_front/src/components/monitor-aps/IndicadoresQualidade.js`
- Modificar: `sysdoc_front/src/components/monitor-aps/PorEquipe.js`
- Modificar: `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`
- Modificar: `sysdoc_front/src/components/monitor-aps/MapaVisitasPage.js`
- Modificar: `sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js`
- Modificar: `sysdoc_front/src/components/monitor-aps/CidadaosPage.js`

O padrão é **idêntico nos 7 componentes**. Mostre abaixo usando `VinculoTerritorial.js` como exemplo e repita em todos.

- [ ] **Step 1: Padrão de alteração — VinculoTerritorial.js**

**Adicionar import:**
```js
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
```

**Adicionar hook no corpo do componente** (após os estados existentes):
```js
const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();
```

**Substituir o useEffect que carrega equipes** (atualmente chama `/config/equipes`):
```js
useEffect(() => {
    if (loadingPerms) return;
    if (isRestrito) {
        setEquipes(minhasEquipes);
        return;
    }
    // Usuário irrestrito: buscar lista completa do eSUS
    monitorApsApi.get('/config/equipes')
        .then(d => setEquipes(d.equipes ?? []))
        .catch(() => {});
}, [isRestrito, minhasEquipes, loadingPerms]);
```

**Atualizar o select de equipes no JSX:**

```jsx
{equipes.length > 0 && (
    <select value={ine} onChange={e => setIne(e.target.value)} style={{ ...selSx, maxWidth: 220 }}>
        {isRestrito && equipes.length > 1
            ? <option value="">Todas as minhas equipes</option>
            : <option value="">Todas as equipes</option>
        }
        {equipes.map(eq => (
            <option key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</option>
        ))}
    </select>
)}
```

- [ ] **Step 2: Aplicar o mesmo padrão em IndicadoresQualidade.js**

Mesmo import, mesmo hook, mesmo useEffect, mesmo select. O componente usa `FormControl/Select` do MUI em vez de `<select>` nativo — adaptar o `MenuItem`:

```jsx
<Select value={ine} onChange={e => setIne(e.target.value)}>
    <MenuItem value="">
        {isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}
    </MenuItem>
    {equipes.map(eq => (
        <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</MenuItem>
    ))}
</Select>
```

- [ ] **Step 3: Aplicar em PorEquipe.js**

Mesmo padrão. Em `PorEquipe.js`, quando `equipes` são carregadas, o código atual seleciona automaticamente a primeira equipe se só há uma. Manter essa lógica: se `isRestrito && equipes.length === 1`, pode auto-selecionar.

```js
useEffect(() => {
    if (loadingPerms) return;
    if (isRestrito) {
        setEquipes(minhasEquipes);
        if (minhasEquipes.length === 1) setIne(minhasEquipes[0].nu_ine);
        return;
    }
    monitorApsApi.get('/config/equipes').then(d => {
        const eq = d.equipes ?? [];
        setEquipes(eq);
        if (eq.length === 1) setIne(eq[0].nu_ine);
    }).catch(() => {});
}, [isRestrito, minhasEquipes, loadingPerms]);
```

- [ ] **Step 4: Aplicar em VisitasAcs.js**

Mesma lógica. `VisitasAcs.js` tem tanto o seletor de equipe (para filtrar visitas) quanto o seletor de agentes (que depende do INE selecionado). A alteração é apenas no carregamento de equipes — o restante permanece igual.

- [ ] **Step 5: Aplicar em MapaVisitasPage.js**

`MapaVisitasPage.js` usa `filtroModo` ('todos' | 'equipe'). Quando `isRestrito = true`, remover a opção "todos" do seletor de modo (o usuário sempre verá só suas equipes):

```jsx
{!isRestrito && (
    <ToggleButton value="todos">Todas</ToggleButton>
)}
<ToggleButton value="equipe">Por Equipe</ToggleButton>
```

E inicializar `filtroModo` com 'equipe' se restrito:
```js
const [filtroModo, setFiltroModo] = useState('todos');

useEffect(() => {
    if (isRestrito) setFiltroModo('equipe');
}, [isRestrito]);
```

- [ ] **Step 6: Aplicar em VisitasEvolucao.js**

Mesmo padrão de carregamento de equipes e select.

- [ ] **Step 7: Aplicar em CidadaosPage.js**

Mesmo padrão. `CidadaosPage` usa `FormControl/Select` do MUI.

- [ ] **Step 8: Exibir alerta quando usuário RT sem equipes vinculadas**

Em cada um dos 7 componentes, adicionar logo após o seletor de equipes:

```jsx
{isRestrito && !loadingPerms && equipes.length === 0 && (
    <Box sx={{ p: 2, border: '1px solid #FF8C00', borderRadius: 2, bgcolor: '#FF8C0011' }}>
        <Typography variant="body2" color="warning.dark">
            Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.
        </Typography>
    </Box>
)}
```

- [ ] **Step 9: Commit**

```bash
git add src/components/monitor-aps/
git commit -m "feat: 7 páginas monitor-aps usam useEquipesPermitidas para filtro por equipe"
```

---

## Task 14: Smoke Test Manual

- [ ] **Step 1: Criar usuário de teste RT PSF via Tinker**

```bash
cd sysdoc_back
php artisan tinker
```

```php
// Criar equipe de teste em user_equipe_aps para um usuário existente
$u = App\Models\User::where('email', 'teste@exemplo.com')->first();
$u->update(['is_rt_psf' => true, 'rt_all_teams' => false]);
App\Models\UserEquipeAps::create([
    'user_id'   => $u->id,
    'nu_ine'    => '0001234567', // substitua por um INE real do seu eSUS
    'no_equipe' => 'ESF CENTRO',
]);
exit
```

- [ ] **Step 2: Testar endpoint minhas-equipes**

```bash
# Obter token do usuário de teste via login e testar:
curl -s -H "Authorization: Bearer <token>" http://localhost:8000/api/monitor-aps/minhas-equipes | python -m json.tool
```

Esperado:
```json
{
  "is_rt": true,
  "all_teams": false,
  "equipes": [{ "nu_ine": "0001234567", "no_equipe": "ESF CENTRO" }]
}
```

- [ ] **Step 3: Testar que INE não autorizado retorna 403**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/monitor-aps/indicadores/vinculo?ine=9999999999"
# Esperado: 403
```

- [ ] **Step 4: Testar no frontend**

1. Logar com o usuário RT criado no Step 1
2. Navegar para `/monitor-aps/vinculo` — o seletor de equipe deve mostrar apenas "ESF CENTRO"
3. A opção "Todas as minhas equipes" deve aparecer (com 1 equipe disponível, o texto muda)
4. Os dados exibidos devem ser apenas da equipe CENTRO

- [ ] **Step 5: Testar UserModal como admin**

1. Logar como admin
2. Abrir UserModal do usuário de teste
3. O switch "É Responsável Técnico de Equipe PSF" deve estar marcado
4. A equipe "ESF CENTRO" deve aparecer no autocomplete
5. Desmarcar o switch e salvar — verificar que is_rt_psf = false no banco

- [ ] **Step 6: Commit final**

```bash
# De volta à raiz do workspace
git add .
git commit -m "feat: permissão por equipe APS — implementação completa"
```

---

## Notas Importantes

**Cache:** Usuários restritos geram chaves de cache com sufixo de hash. Ao alterar as equipes de um usuário, o cache antigo expira naturalmente em 10min (TTL=600). Se necessário invalidação imediata, chamar `Cache::flush()` no tinker ou implementar invalidação no `UserEquipeApsController::update()`.

**Edge case — usuário RT sem equipes:** O backend retorna `1=0` no WHERE, devolvendo arrays vazios. O frontend deve exibir uma mensagem informativa: "Nenhuma equipe autorizada. Entre em contato com o administrador."

**Novo usuário:** O campo `is_rt_psf` pode ser salvo na criação (`POST /users`), mas as equipes só podem ser vinculadas após o usuário ter um ID (edição). Na criação, o toggle aparece mas o autocomplete de equipes fica desabilitado com tooltip "Salve o usuário primeiro para vincular equipes."
