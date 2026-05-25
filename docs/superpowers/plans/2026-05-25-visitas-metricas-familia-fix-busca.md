# Visitas ACS — Métricas de Família + Fix Busca no Mapa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o filtro CPF/CNS/nome no mapa de visitas e adicionar métricas de acompanhamento de famílias nos cards e na aba "Por Agente".

**Architecture:** Backend (`VisitaAcsController.php`) recebe três mudanças independentes: fix da busca no `mapa()`, extensão de `resumo()` com quatro campos de família, e extensão de `agentes()` com três campos por agente. O frontend (`VisitasAcs.js`) consome os novos campos sem alterações em outros componentes.

**Tech Stack:** Laravel 10 / PHP 8.1 (backend), Next.js 12 / React 17 / MUI v5 (frontend).

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Fix busca; helpers família; extend resumo() e agentes() |
| `sysdoc_back/tests/Feature/VisitaAcsMapaBuscaTest.php` | Novo — testa validação do endpoint mapa |
| `sysdoc_front/src/components/monitor-aps/VisitasAcs.js` | prop subFamily no MetricCard; 3 colunas na tabela agentes |

---

## Task 1: Fix — busca CPF/CNS/nome no mapa()

**Arquivo:** `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

**Problema:** As três sub-queries de busca têm `AND st_ficha_inativa = 0`. Se a coluna for `boolean` no PostgreSQL, comparar com inteiro falha. Se for `NULL` para registros ativos, o filtro exclui todos — retornando zero resultados. `citizenNameExpr()` já usa o mesmo JOIN sem esse filtro.

- [ ] **Localizar o bloco de busca em mapa()**

No arquivo `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`, localizar o método `mapa()` (~linha 845). O bloco a alterar é:

```php
if ($request->busca) {
    $busca = trim($request->busca);
    $digits = preg_replace('/\D/', '', $busca);

    if (strlen($digits) === 11) {
        // CPF
        $where .= ' AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE nu_cpf = ? AND st_ficha_inativa = 0)';
        $params[] = $digits;
    } elseif (strlen($digits) === 15) {
        // CNS
        $where .= ' AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE nu_cns = ? AND st_ficha_inativa = 0)';
        $params[] = $digits;
    } else {
        // Nome parcial (mínimo 3 chars validado no frontend)
        $where .= ' AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE no_cidadao ILIKE ? AND st_ficha_inativa = 0)';
        $params[] = '%'.$busca.'%';
    }
}
```

- [ ] **Substituir o bloco removendo st_ficha_inativa**

Substituir o bloco completo acima por:

```php
if ($request->busca) {
    $busca  = trim($request->busca);
    $digits = preg_replace('/\D/', '', $busca);

    if (strlen($digits) === 11) {
        $where   .= ' AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE nu_cpf = ?)';
        $params[] = $digits;
    } elseif (strlen($digits) === 15) {
        $where   .= ' AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE nu_cns = ?)';
        $params[] = $digits;
    } else {
        $where   .= ' AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE no_cidadao ILIKE ?)';
        $params[] = '%'.$busca.'%';
    }
}
```

- [ ] **Criar teste de validação do endpoint mapa**

Criar `sysdoc_back/tests/Feature/VisitaAcsMapaBuscaTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisitaAcsMapaBuscaTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'profile' => 'admin',
            'active'  => true,
        ]);
    }

    public function test_mapa_requer_autenticacao(): void
    {
        $this->getJson('/api/monitor-aps/visitas/mapa?ano=2025&mes=1')
            ->assertStatus(401);
    }

    public function test_mapa_rejeita_ano_ausente(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/monitor-aps/visitas/mapa?mes=1')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ano']);
    }

    public function test_mapa_rejeita_mes_ausente(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/monitor-aps/visitas/mapa?ano=2025')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['mes']);
    }

    public function test_mapa_rejeita_busca_muito_longa(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/monitor-aps/visitas/mapa?ano=2025&mes=1&busca=' . str_repeat('x', 201))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['busca']);
    }
}
```

- [ ] **Rodar os testes**

```bash
cd sysdoc_back
./vendor/bin/phpunit tests/Feature/VisitaAcsMapaBuscaTest.php --testdox
```

Esperado: 4 testes passando (a query PostgreSQL não é executada; apenas validação e auth).

- [ ] **Commitar**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php \
        sysdoc_back/tests/Feature/VisitaAcsMapaBuscaTest.php
git commit -m "fix: busca CPF/CNS/nome no mapa — remove st_ficha_inativa incompatível"
```

---

## Task 2: Helpers privados de família em VisitaAcsController

**Arquivo:** `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

Os helpers detectam dinamicamente as colunas de família em `tb_fat_cad_individual` antes de montar qualquer SQL. Assim o código funciona mesmo em versões do e-SUS que não têm essas colunas.

- [ ] **Adicionar os três métodos privados após buildNotesExpr()**

Localizar o método `buildNotesExpr()` (~linha 168). Após o fechamento `}` desse método, inserir:

```php
    private function familyRespCol(): ?string
    {
        if (!$this->hasTable('tb_fat_cad_individual')) {
            return null;
        }

        return $this->firstExistingColumn('tb_fat_cad_individual', [
            'co_responsavel_familiar',
            'co_fat_cidadao_pec_responsavel',
        ]);
    }

    private function familyStCol(): ?string
    {
        if (!$this->hasTable('tb_fat_cad_individual')) {
            return null;
        }

        return $this->firstExistingColumn('tb_fat_cad_individual', [
            'st_responsavel_familiar',
            'tp_responsavel_familiar',
        ]);
    }

    /**
     * Expressão SQL que identifica a família de um cidadão via JOIN com tb_fat_cad_individual (alias ci).
     *
     * Retorna null quando as colunas necessárias não existem — o chamador deve omitir
     * o LEFT JOIN e retornar null nos campos de família da resposta.
     *
     * Lógica:
     *   - Responsável: co_responsavel_familiar IS NULL → usa seu próprio co_fat_cidadao_pec
     *   - Membro: co_responsavel_familiar aponta para o co_fat_cidadao_pec do responsável
     *   - Sem vínculo familiar: expressão retorna NULL (excluído do COUNT DISTINCT)
     */
    private function familyIdExpr(string $alias = 'ci'): ?string
    {
        $stCol   = $this->familyStCol();
        $respCol = $this->familyRespCol();

        if (! $respCol && ! $stCol) {
            return null;
        }

        if ($stCol && $respCol) {
            return "COALESCE({$alias}.{$respCol}, CASE WHEN {$alias}.{$stCol} = 1 THEN {$alias}.co_fat_cidadao_pec END)";
        }

        if ($respCol) {
            // Sem coluna de flag: assume NULL no co_responsavel = próprio responsável
            return "COALESCE({$alias}.{$respCol}, {$alias}.co_fat_cidadao_pec)";
        }

        // Apenas flag disponível: identifica somente os responsáveis
        return "CASE WHEN {$alias}.{$stCol} = 1 THEN {$alias}.co_fat_cidadao_pec ELSE NULL END";
    }
```

- [ ] **Verificar sintaxe PHP**

```bash
cd sysdoc_back
php -l app/Http/Controllers/VisitaAcsController.php
```

Esperado: `No syntax errors detected`

- [ ] **Commitar**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php
git commit -m "feat: helpers familyIdExpr/familyRespCol/familyStCol em VisitaAcsController"
```

---

## Task 3: Extend resumo() com métricas de família

**Arquivo:** `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

- [ ] **Localizar o final do método resumo()**

O método `resumo()` (~linha 447) termina com:

```php
        return response()->json([
            'totais' => [
                'total' => (int) ($totRow->total ?? 0),
                'realizadas' => (int) ($totRow->realizadas ?? 0),
                'recusadas' => (int) ($totRow->recusadas ?? 0),
                'ausentes' => (int) ($totRow->ausentes ?? 0),
                'cidadaos' => (int) ($totRow->cidadaos ?? 0),
            ],
        ]);
```

- [ ] **Substituir o bloco final de resumo() pelo código com métricas de família**

Substituir todo o `return response()->json(...)` acima por:

```php
        $familyData = null;
        $familyExpr = $this->familyIdExpr();

        if ($familyExpr !== null) {
            [$familyWhere, $familyParams] = $this->buildWhere($ano, $mes, $request->ine, $request->agente);

            try {
                $famRow = $this->db()->selectOne("
                    SELECT
                        COUNT(DISTINCT {$familyExpr})
                            FILTER (WHERE TRUE)                              AS familias,
                        COUNT(DISTINCT {$familyExpr})
                            FILTER (WHERE d.co_seq_dim_desfecho_visita = 1) AS familias_acompanhadas,
                        COUNT(DISTINCT {$familyExpr})
                            FILTER (WHERE d.co_seq_dim_desfecho_visita = 2) AS familias_recusadas,
                        COUNT(DISTINCT {$familyExpr})
                            FILTER (WHERE d.co_seq_dim_desfecho_visita = 3) AS familias_ausentes
                    FROM tb_fat_visita_domiciliar v
                    {$this->baseJoins()}
                    LEFT JOIN tb_fat_cad_individual ci ON ci.co_fat_cidadao_pec = v.co_fat_cidadao_pec
                    WHERE {$familyWhere}
                ", $familyParams);

                if ($famRow) {
                    $familyData = [
                        'familias'              => (int) ($famRow->familias ?? 0),
                        'familias_acompanhadas' => (int) ($famRow->familias_acompanhadas ?? 0),
                        'familias_recusadas'    => (int) ($famRow->familias_recusadas ?? 0),
                        'familias_ausentes'     => (int) ($famRow->familias_ausentes ?? 0),
                    ];
                }
            } catch (\Throwable) {
                // Falha silenciosa — front trata null como "não disponível"
            }
        }

        $nullFamily = [
            'familias'              => null,
            'familias_acompanhadas' => null,
            'familias_recusadas'    => null,
            'familias_ausentes'     => null,
        ];

        return response()->json([
            'totais' => array_merge(
                [
                    'total'      => (int) ($totRow->total ?? 0),
                    'realizadas' => (int) ($totRow->realizadas ?? 0),
                    'recusadas'  => (int) ($totRow->recusadas ?? 0),
                    'ausentes'   => (int) ($totRow->ausentes ?? 0),
                    'cidadaos'   => (int) ($totRow->cidadaos ?? 0),
                ],
                $familyData ?? $nullFamily
            ),
        ]);
```

- [ ] **Verificar sintaxe PHP**

```bash
php -l sysdoc_back/app/Http/Controllers/VisitaAcsController.php
```

Esperado: `No syntax errors detected`

- [ ] **Commitar**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php
git commit -m "feat: resumo() — adiciona familias/familias_acompanhadas/recusadas/ausentes"
```

---

## Task 4: Extend agentes() com métricas de família por agente

**Arquivo:** `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

- [ ] **Localizar o bloco da query em agentes()**

O método `agentes()` (~linha 982) tem:

```php
        $rows = $this->db()->select("
            SELECT
                p.no_profissional                                                      AS agente,
                c.nu_cbo                                                               AS cbo,
                e.no_equipe                                                            AS equipe_nome,
                COUNT(*)                                                               AS total,
                SUM(CASE WHEN d.co_seq_dim_desfecho_visita = 1 THEN 1 ELSE 0 END)    AS realizadas,
                SUM(CASE WHEN d.co_seq_dim_desfecho_visita = 2 THEN 1 ELSE 0 END)    AS recusadas,
                SUM(CASE WHEN d.co_seq_dim_desfecho_visita = 3 THEN 1 ELSE 0 END)    AS ausentes,
                COUNT(DISTINCT v.co_fat_cidadao_pec)                                  AS cidadaos
            FROM tb_fat_visita_domiciliar v
            {$this->baseJoins()}
            WHERE {$where}
            GROUP BY p.no_profissional, c.nu_cbo, e.no_equipe
            ORDER BY total DESC
        ", $params);

        $agentes = array_map(fn ($r) => [
            'agente' => $r->agente,
            'cbo' => $r->cbo,
            'cbo_nome' => self::CBO_LABELS[$r->cbo] ?? $r->cbo,
            'equipe' => ['nome' => $r->equipe_nome],
            'total' => (int) $r->total,
            'realizadas' => (int) $r->realizadas,
            'recusadas' => (int) $r->recusadas,
            'ausentes' => (int) $r->ausentes,
            'pct_realizadas' => $r->total > 0
                ? (int) round($r->realizadas / $r->total * 100)
                : 0,
            'cidadaos' => (int) $r->cidadaos,
        ], $rows);
```

- [ ] **Substituir o bloco da query + array_map de agentes()**

Substituir todo o trecho acima (desde `$rows = $this->db()->select(...)` até o fechamento do `array_map`) por:

```php
        $familyExpr = $this->familyIdExpr();
        $hasFamilies = $familyExpr !== null;

        $familyCols = $hasFamilies ? ",
            COUNT(DISTINCT {$familyExpr})                                                        AS familias,
            COUNT(DISTINCT CASE WHEN d.co_seq_dim_desfecho_visita = 1 THEN {$familyExpr} END)   AS familias_acompanhadas"
            : '';

        $familyJoin = $hasFamilies
            ? 'LEFT JOIN tb_fat_cad_individual ci ON ci.co_fat_cidadao_pec = v.co_fat_cidadao_pec'
            : '';

        $rows = $this->db()->select("
            SELECT
                p.no_profissional                                                      AS agente,
                c.nu_cbo                                                               AS cbo,
                e.no_equipe                                                            AS equipe_nome,
                COUNT(*)                                                               AS total,
                SUM(CASE WHEN d.co_seq_dim_desfecho_visita = 1 THEN 1 ELSE 0 END)    AS realizadas,
                SUM(CASE WHEN d.co_seq_dim_desfecho_visita = 2 THEN 1 ELSE 0 END)    AS recusadas,
                SUM(CASE WHEN d.co_seq_dim_desfecho_visita = 3 THEN 1 ELSE 0 END)    AS ausentes,
                COUNT(DISTINCT v.co_fat_cidadao_pec)                                  AS cidadaos
                {$familyCols}
            FROM tb_fat_visita_domiciliar v
            {$this->baseJoins()}
            {$familyJoin}
            WHERE {$where}
            GROUP BY p.no_profissional, c.nu_cbo, e.no_equipe
            ORDER BY total DESC
        ", $params);

        $agentes = array_map(function ($r) use ($hasFamilies) {
            $familias    = $hasFamilies ? (int) ($r->familias ?? 0) : null;
            $famAcomp    = $hasFamilies ? (int) ($r->familias_acompanhadas ?? 0) : null;
            $pctFamilias = ($hasFamilies && $familias > 0)
                ? (int) round($famAcomp / $familias * 100)
                : null;

            return [
                'agente'                => $r->agente,
                'cbo'                   => $r->cbo,
                'cbo_nome'              => self::CBO_LABELS[$r->cbo] ?? $r->cbo,
                'equipe'                => ['nome' => $r->equipe_nome],
                'total'                 => (int) $r->total,
                'realizadas'            => (int) $r->realizadas,
                'recusadas'             => (int) $r->recusadas,
                'ausentes'              => (int) $r->ausentes,
                'pct_realizadas'        => $r->total > 0
                    ? (int) round($r->realizadas / $r->total * 100)
                    : 0,
                'cidadaos'              => (int) $r->cidadaos,
                'familias'              => $familias,
                'familias_acompanhadas' => $famAcomp,
                'pct_familias'          => $pctFamilias,
            ];
        }, $rows);
```

- [ ] **Verificar sintaxe PHP**

```bash
php -l sysdoc_back/app/Http/Controllers/VisitaAcsController.php
```

Esperado: `No syntax errors detected`

- [ ] **Commitar**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php
git commit -m "feat: agentes() — adiciona familias, familias_acompanhadas e pct_familias por agente"
```

---

## Task 5: Cards com info de família (VisitasAcs.js)

**Arquivo:** `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

- [ ] **Atualizar MetricCard para suportar subFamily**

Localizar a função `MetricCard` (~linha 23). Substituir:

```jsx
function MetricCard({ icon, titulo, valor, cor, sub }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ px: 2.5, py: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-secondary)', fontWeight: 600 }}>
                            {titulo}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5} sx={{ color: cor }}>
                            {valor ?? '—'}
                        </Typography>
                        {sub && (
                            <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>{sub}</Typography>
                        )}
                    </Box>
```

por:

```jsx
function MetricCard({ icon, titulo, valor, cor, sub, subFamily }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ px: 2.5, py: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-secondary)', fontWeight: 600 }}>
                            {titulo}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5} sx={{ color: cor }}>
                            {valor ?? '—'}
                        </Typography>
                        {sub && (
                            <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>{sub}</Typography>
                        )}
                        {subFamily && (
                            <Typography variant="caption" display="block" sx={{ color: 'var(--lg-text-muted)' }}>
                                {subFamily}
                            </Typography>
                        )}
                    </Box>
```

- [ ] **Adicionar cálculos de família após a linha totais/pctReal**

Localizar (~linha 211):

```js
    const totais = resumo?.totais ?? { total: 0, realizadas: 0, recusadas: 0, ausentes: 0, cidadaos: 0 };
    const pctReal = totais.total > 0 ? Math.round(totais.realizadas / totais.total * 100) : 0;
```

Substituir por:

```js
    const totais = resumo?.totais ?? {
        total: 0, realizadas: 0, recusadas: 0, ausentes: 0, cidadaos: 0,
        familias: null, familias_acompanhadas: null, familias_recusadas: null, familias_ausentes: null,
    };
    const pctReal       = totais.total > 0 ? Math.round(totais.realizadas / totais.total * 100) : 0;
    const temFamilias   = totais.familias > 0;
    const pctFamAcomp   = temFamilias ? Math.round(totais.familias_acompanhadas / totais.familias * 100) : 0;
    const pctFamRecus   = temFamilias ? Math.round(totais.familias_recusadas   / totais.familias * 100) : 0;
    const pctFamAusent  = temFamilias ? Math.round(totais.familias_ausentes    / totais.familias * 100) : 0;
```

- [ ] **Atualizar os três MetricCard com subFamily**

Localizar os três cards (Realizadas, Recusadas, Ausentes) na seção "Cards de métricas" (~linha 287) e substituir:

```jsx
                <Grid item xs={6} sm={true}>
                    <MetricCard icon="check-circle" titulo="Realizadas"
                        valor={`${totais.realizadas.toLocaleString('pt-BR')} (${pctReal}%)`} cor="#168821" />
                </Grid>
                <Grid item xs={6} sm={true}>
                    <MetricCard icon="x-circle" titulo="Recusadas"
                        valor={totais.recusadas.toLocaleString('pt-BR')} cor="#E52207"
                        sub={totais.total > 0 ? `${Math.round(totais.recusadas / totais.total * 100)}%` : ''} />
                </Grid>
                <Grid item xs={6} sm={true}>
                    <MetricCard icon="user-x" titulo="Ausentes"
                        valor={totais.ausentes.toLocaleString('pt-BR')} cor="#FF8C00"
                        sub={totais.total > 0 ? `${Math.round(totais.ausentes / totais.total * 100)}%` : ''} />
                </Grid>
```

por:

```jsx
                <Grid item xs={6} sm={true}>
                    <MetricCard icon="check-circle" titulo="Realizadas"
                        valor={`${totais.realizadas.toLocaleString('pt-BR')} (${pctReal}%)`} cor="#168821"
                        subFamily={temFamilias
                            ? `${totais.familias_acompanhadas.toLocaleString('pt-BR')} famílias acompanhadas (${pctFamAcomp}%)`
                            : null} />
                </Grid>
                <Grid item xs={6} sm={true}>
                    <MetricCard icon="x-circle" titulo="Recusadas"
                        valor={totais.recusadas.toLocaleString('pt-BR')} cor="#E52207"
                        sub={totais.total > 0 ? `${Math.round(totais.recusadas / totais.total * 100)}%` : ''}
                        subFamily={temFamilias
                            ? `${totais.familias_recusadas.toLocaleString('pt-BR')} famílias (${pctFamRecus}%)`
                            : null} />
                </Grid>
                <Grid item xs={6} sm={true}>
                    <MetricCard icon="user-x" titulo="Ausentes"
                        valor={totais.ausentes.toLocaleString('pt-BR')} cor="#FF8C00"
                        sub={totais.total > 0 ? `${Math.round(totais.ausentes / totais.total * 100)}%` : ''}
                        subFamily={temFamilias
                            ? `${totais.familias_ausentes.toLocaleString('pt-BR')} famílias (${pctFamAusent}%)`
                            : null} />
                </Grid>
```

- [ ] **Commitar**

```bash
git add sysdoc_front/src/components/monitor-aps/VisitasAcs.js
git commit -m "feat: cards Realizadas/Recusadas/Ausentes exibem métricas de família"
```

---

## Task 6: Colunas de família na aba Por Agente

**Arquivo:** `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

- [ ] **Adicionar 3 colunas no TableHead da aba agentes**

Localizar a seção `{/* ── ABA: Por agente ── */}`. No `TableHead`, após:

```jsx
                                            <TableCell align="right">% Realiz.</TableCell>
                                            <TableCell align="right">Cidadãos</TableCell>
```

inserir:

```jsx
                                            <TableCell align="right">Famílias</TableCell>
                                            <TableCell align="right">Fam. Acomp.</TableCell>
                                            <TableCell align="right">% Família</TableCell>
```

- [ ] **Adicionar 3 células no TableBody por linha de agente**

No `TableBody`, após a célula de `Cidadãos`:

```jsx
                                                <TableCell align="right">{a.cidadaos.toLocaleString('pt-BR')}</TableCell>
```

inserir:

```jsx
                                                <TableCell align="right">
                                                    {a.familias != null ? a.familias.toLocaleString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {a.familias_acompanhadas != null
                                                        ? a.familias_acompanhadas.toLocaleString('pt-BR')
                                                        : '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {a.pct_familias != null ? (
                                                        <Chip
                                                            label={`${a.pct_familias}%`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: a.pct_familias >= 70 ? '#16882122' : '#FF8C0022',
                                                                color:   a.pct_familias >= 70 ? '#168821'   : '#FF8C00',
                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                    ) : '—'}
                                                </TableCell>
```

- [ ] **Corrigir o colSpan do estado vazio**

Localizar a linha de estado vazio da tabela de agentes:

```jsx
                                                <TableCell colSpan={8} align="center"
```

Substituir `colSpan={8}` por `colSpan={11}`.

- [ ] **Commitar**

```bash
git add sysdoc_front/src/components/monitor-aps/VisitasAcs.js
git commit -m "feat: tabela Por Agente exibe Famílias, Fam. Acomp. e % Família"
```

---

## Verificação Final

- [ ] **Testar o backend (testes de auth/validação)**

```bash
cd sysdoc_back
./vendor/bin/phpunit tests/Feature/VisitaAcsMapaBuscaTest.php tests/Feature/VisitaAcsEvolucaoTest.php --testdox
```

Esperado: todos os testes passando.

- [ ] **Verificar resposta de resumo contém novos campos**

Com o servidor rodando (`php artisan serve`), fazer uma chamada autenticada e confirmar que `totais` inclui `familias`, `familias_acompanhadas`, `familias_recusadas`, `familias_ausentes` (podem ser `null` se o banco não tiver as colunas, ou inteiros se tiver).

- [ ] **Verificar resposta de agentes contém novos campos**

Confirmar que cada item em `agentes` inclui `familias`, `familias_acompanhadas`, `pct_familias`.

- [ ] **Verificar frontend**

Abrir `monitor-aps/visitas` no browser, confirmar:
1. Cards Realizadas/Recusadas/Ausentes mostram linha de família quando dados disponíveis
2. Aba "Por Agente" exibe 3 novas colunas
3. Filtro de busca no Mapa retorna resultados para CPF, CNS e nome
