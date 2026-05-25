# Visitas Evolução Anual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar página "Evolução Anual" ao Monitor APS com gráfico de linhas comparando visitas domiciliares ACS/TACS mês a mês nos últimos 3 anos, com filtros por equipe, agente, desfecho e geolocalização.

**Architecture:** Backend — novo método `evolucao()` em `VisitaAcsController` com helper `buildWhereFilters()` que faz query GROUP BY nu_ano + nu_mes para os 3 anos calculados automaticamente; retorna array de 12 valores por ano. Frontend — componente `VisitasEvolucao.js` com ApexCharts `type="line"`, 3 séries coloridas, filtros inline no mesmo padrão das páginas existentes do Monitor APS.

**Tech Stack:** Laravel 10 / PHP 8.1 / PostgreSQL (e-SUS), Next.js 12 / React 17 / MUI v5 / ApexCharts (via `ApexChartSafe`)

---

## Mapa de Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` |
| Modificar | `sysdoc_back/routes/api.php` |
| Criar | `sysdoc_back/tests/Feature/VisitaAcsEvolucaoTest.php` |
| Modificar | `sysdoc_front/src/layouts/sidebar/MenuItems.js` |
| Criar | `sysdoc_front/pages/monitor-aps/visitas/evolucao.js` |
| Criar | `sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js` |
| Criar | `sysdoc_front/tests/monitor-aps/evolucao.test.js` |

---

## Task 1: Backend — Rota + helper `buildWhereFilters()`

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`
- Modify: `sysdoc_back/routes/api.php`
- Create: `sysdoc_back/tests/Feature/VisitaAcsEvolucaoTest.php`

- [ ] **Step 1: Criar o arquivo de teste**

Criar `sysdoc_back/tests/Feature/VisitaAcsEvolucaoTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisitaAcsEvolucaoTest extends TestCase
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

    public function test_evolucao_requer_autenticacao(): void
    {
        $this->getJson('/api/monitor-aps/visitas/evolucao')
            ->assertStatus(401);
    }

    public function test_evolucao_rejeita_desfecho_invalido(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/monitor-aps/visitas/evolucao?desfecho=9')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['desfecho']);
    }

    public function test_evolucao_rejeita_has_geo_invalido(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/monitor-aps/visitas/evolucao?has_geo=talvez')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['has_geo']);
    }
}
```

- [ ] **Step 2: Rodar o teste para confirmar falha**

```bash
cd sysdoc_back
./vendor/bin/phpunit tests/Feature/VisitaAcsEvolucaoTest.php --testdox
```

Esperado: FAIL — `test_evolucao_requer_autenticacao` falha com 404 (rota não existe ainda).

- [ ] **Step 3: Adicionar a rota em `routes/api.php`**

Localizar o bloco `Route::prefix('visitas')` (linha ~128) e adicionar a rota **antes** de `/{id}`:

```php
Route::get('/evolucao', [VisitaAcsController::class, 'evolucao']);
```

O bloco completo deve ficar:
```php
Route::prefix('visitas')->group(function () {
    Route::get('/',         [VisitaAcsController::class, 'index']);
    Route::get('/resumo',   [VisitaAcsController::class, 'resumo']);
    Route::get('/lista',    [VisitaAcsController::class, 'lista']);
    Route::get('/mapa',     [VisitaAcsController::class, 'mapa']);
    Route::get('/equipes',  [VisitaAcsController::class, 'equipes']);
    Route::get('/agentes',  [VisitaAcsController::class, 'agentes']);
    Route::get('/evolucao', [VisitaAcsController::class, 'evolucao']); // <-- novo
    Route::get('/{id}',     [VisitaAcsController::class, 'show'])->whereNumber('id');
});
```

- [ ] **Step 4: Adicionar o helper `buildWhereFilters()` em `VisitaAcsController.php`**

Inserir logo após o método `buildWhere()` existente (por volta da linha 61):

```php
/**
 * Filtros opcionais sem fixar ano/mês — usado por evolucao().
 */
private function buildWhereFilters(
    ?string $ine,
    ?string $agentName = null,
    ?string $desfecho  = null,
    ?string $hasGeo    = null
): array {
    $cbos   = implode("','", self::ACS_CBOS);
    $where  = "c.nu_cbo IN ('{$cbos}')";
    $params = [];

    if ($ine) {
        $where   .= ' AND e.nu_ine = ?';
        $params[] = $ine;
    }

    if ($agentName) {
        $where   .= ' AND p.no_profissional = ?';
        $params[] = $agentName;
    }

    if ($desfecho !== null && $desfecho !== '') {
        $where   .= ' AND d.co_seq_dim_desfecho_visita = ?';
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

- [ ] **Step 5: Adicionar stub do método `evolucao()` para a rota existir**

Inserir após o método `agentes()`:

```php
public function evolucao(Request $request): JsonResponse
{
    $request->validate([
        'ine'      => 'nullable|string',
        'agente'   => 'nullable|string',
        'desfecho' => 'nullable|integer|in:1,2,3',
        'has_geo'  => 'nullable|string|in:sim,nao',
    ]);

    return response()->json(['series' => []]);
}
```

- [ ] **Step 6: Rodar os testes para confirmar passagem**

```bash
cd sysdoc_back
./vendor/bin/phpunit tests/Feature/VisitaAcsEvolucaoTest.php --testdox
```

Esperado: 3 testes PASS.

- [ ] **Step 7: Commit**

```bash
cd sysdoc_back
git add app/Http/Controllers/VisitaAcsController.php routes/api.php tests/Feature/VisitaAcsEvolucaoTest.php
git commit -m "feat(monitor-aps): rota GET /visitas/evolucao + buildWhereFilters() + testes de validação"
```

---

## Task 2: Backend — Implementar `evolucao()` com query multi-ano

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

- [ ] **Step 1: Substituir o stub pelo método completo**

Substituir o método `evolucao()` inserido no Task 1 pela implementação completa:

```php
/**
 * GET /visitas/evolucao?[ine=Z&agente=W&desfecho=N&has_geo=X]
 * Retorna contagem mensal de visitas para o ano atual e os 2 anos anteriores.
 */
public function evolucao(Request $request): JsonResponse
{
    $request->validate([
        'ine'      => 'nullable|string',
        'agente'   => 'nullable|string',
        'desfecho' => 'nullable|integer|in:1,2,3',
        'has_geo'  => 'nullable|string|in:sim,nao',
    ]);

    $anoAtual = (int) date('Y');
    $anos     = [$anoAtual, $anoAtual - 1, $anoAtual - 2];

    [$where, $params] = $this->buildWhereFilters(
        $request->ine,
        $request->agente,
        $request->desfecho,
        $request->has_geo,
    );

    $placeholders = implode(',', array_fill(0, count($anos), '?'));
    $where       .= " AND t.nu_ano IN ({$placeholders})";
    $params       = array_merge($params, $anos);

    $rows = $this->db()->select("
        SELECT
            t.nu_ano  AS ano,
            t.nu_mes  AS mes,
            COUNT(*)  AS total
        FROM tb_fat_visita_domiciliar v
        {$this->baseJoins()}
        WHERE {$where}
        GROUP BY t.nu_ano, t.nu_mes
        ORDER BY t.nu_ano, t.nu_mes
    ", $params);

    // Indexar por ano→mes para montagem O(n)
    $index = [];
    foreach ($rows as $row) {
        $index[(int) $row->ano][(int) $row->mes] = (int) $row->total;
    }

    $series = array_map(function (int $ano) use ($index): array {
        $meses = [];
        for ($m = 1; $m <= 12; $m++) {
            $meses[] = $index[$ano][$m] ?? 0;
        }
        return ['ano' => $ano, 'meses' => $meses];
    }, $anos);

    return response()->json(['series' => $series]);
}
```

- [ ] **Step 2: Rodar os testes existentes para confirmar que não quebraram**

```bash
cd sysdoc_back
./vendor/bin/phpunit tests/Feature/VisitaAcsEvolucaoTest.php --testdox
```

Esperado: 3 testes PASS (os testes de validação continuam passando).

- [ ] **Step 3: Verificar formatação**

```bash
cd sysdoc_back
./vendor/bin/pint --test
```

Se reportar erros, corrigir com:
```bash
./vendor/bin/pint app/Http/Controllers/VisitaAcsController.php
```

- [ ] **Step 4: Commit**

```bash
cd sysdoc_back
git add app/Http/Controllers/VisitaAcsController.php
git commit -m "feat(monitor-aps): implementa evolucao() com query GROUP BY nu_ano + nu_mes"
```

---

## Task 3: Frontend — Item de menu + página wrapper

**Files:**
- Modify: `sysdoc_front/src/layouts/sidebar/MenuItems.js`
- Create: `sysdoc_front/pages/monitor-aps/visitas/evolucao.js`

- [ ] **Step 1: Adicionar item ao menu em `MenuItems.js`**

Localizar o bloco Monitor APS (linha ~103) e inserir após "Mapa de Visitas":

```js
{ title: "Evolução Anual", icon: "trending-up", href: "/monitor-aps/visitas/evolucao" },
```

O bloco completo deve ficar:
```js
{
  title: "Monitor APS",
  icon: "activity",
  group: true,
  children: [
    { title: "Dashboard",            icon: "bar-chart-2",  href: "/monitor-aps" },
    { title: "Vinculo Territorial",  icon: "map-pin",      href: "/monitor-aps/vinculo" },
    { title: "Indicadores",          icon: "check-circle", href: "/monitor-aps/qualidade" },
    { title: "Por Equipe",           icon: "users",        href: "/monitor-aps/equipe" },
    { title: "Visitas ACS/TACS",     icon: "home",         href: "/monitor-aps/visitas" },
    { title: "Mapa de Visitas",      icon: "map",          href: "/monitor-aps/visitas/mapa" },
    { title: "Evolução Anual",       icon: "trending-up",  href: "/monitor-aps/visitas/evolucao" },
    { title: "Configuracoes APS",    icon: "settings",     href: "/monitor-aps/configuracoes", profile: ["admin"] },
  ],
},
```

- [ ] **Step 2: Criar a página wrapper**

Criar `sysdoc_front/pages/monitor-aps/visitas/evolucao.js`:

```jsx
import { Grid } from '@mui/material';
import VisitasEvolucao from '../../../src/components/monitor-aps/VisitasEvolucao';

export default function VisitasEvolucaoPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <VisitasEvolucao />
            </Grid>
        </Grid>
    );
}
```

- [ ] **Step 3: Commit**

```bash
cd sysdoc_front
git add src/layouts/sidebar/MenuItems.js pages/monitor-aps/visitas/evolucao.js
git commit -m "feat(monitor-aps): menu item Evolução Anual + página wrapper"
```

---

## Task 4: Frontend — Teste de utilidade + componente `VisitasEvolucao.js`

**Files:**
- Create: `sysdoc_front/tests/monitor-aps/evolucao.test.js`
- Create: `sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js`

- [ ] **Step 1: Criar o teste da função utilitária `buildChartSeries`**

Criar `sysdoc_front/tests/monitor-aps/evolucao.test.js`:

```js
import { buildChartSeries } from '../../src/components/monitor-aps/VisitasEvolucao';

const CORES = ['#1351B4', '#168821', '#FF8C00'];

describe('buildChartSeries', () => {
    it('converte series da API para formato ApexCharts', () => {
        const input = [
            { ano: 2026, meses: [10, 20, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { ano: 2025, meses: [100, 200, 150, 180, 160, 170, 140, 130, 190, 175, 165, 155] },
            { ano: 2024, meses: [90, 110, 95, 105, 85, 100, 80, 75, 115, 98, 88, 78] },
        ];

        const result = buildChartSeries(input, CORES);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ name: '2026', data: input[0].meses, color: '#1351B4' });
        expect(result[1]).toEqual({ name: '2025', data: input[1].meses, color: '#168821' });
        expect(result[2]).toEqual({ name: '2024', data: input[2].meses, color: '#FF8C00' });
    });

    it('retorna array vazio quando series é vazio', () => {
        expect(buildChartSeries([], CORES)).toEqual([]);
    });

    it('usa #888 como cor fallback quando não há cor definida para o índice', () => {
        const input = [
            { ano: 2026, meses: Array(12).fill(0) },
            { ano: 2025, meses: Array(12).fill(0) },
            { ano: 2024, meses: Array(12).fill(0) },
            { ano: 2023, meses: Array(12).fill(0) }, // índice 3 — sem cor definida
        ];
        const result = buildChartSeries(input, CORES);
        expect(result[3].color).toBe('#888');
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar falha**

```bash
cd sysdoc_front
npm test -- --testPathPattern="monitor-aps/evolucao" --watch=false
```

Esperado: FAIL — `buildChartSeries` not found.

- [ ] **Step 3: Criar o componente `VisitasEvolucao.js`**

Criar `sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js`:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, CircularProgress, FormControl, InputLabel,
    MenuItem, Select, Typography,
} from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi } from '../../services/monitorApsApi';

const MESES  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES  = ['#1351B4', '#168821', '#FF8C00'];
const FONT   = { fontFamily: "'DM Sans', sans-serif" };

export function buildChartSeries(series, cores) {
    return series.map((s, i) => ({
        name:  String(s.ano),
        data:  s.meses,
        color: cores[i] ?? '#888',
    }));
}

export default function VisitasEvolucao() {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    const [equipes,      setEquipes]      = useState([]);
    const [agenteOpcoes, setAgenteOpcoes] = useState([]);
    const [ine,          setIne]          = useState('');
    const [agente,       setAgente]       = useState('');
    const [desfecho,     setDesfecho]     = useState('');
    const [geo,          setGeo]          = useState('');
    const [series,       setSeries]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [erro,         setErro]         = useState(null);
    const ctrlRef = useRef(null);

    // Carrega lista de equipes uma única vez
    useEffect(() => {
        monitorApsApi.get('/config/equipes')
            .then(d => setEquipes(d.equipes ?? []))
            .catch(() => {});
    }, []);

    // Opções de agente dependem da equipe selecionada
    useEffect(() => {
        if (!ine) { setAgenteOpcoes([]); return; }
        const params = new URLSearchParams({ ano: anoAtual, mes: mesAtual, ine });
        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => setAgenteOpcoes(d.agentes ?? []))
            .catch(() => setAgenteOpcoes([]));
    }, [ine, anoAtual, mesAtual]);

    // Limpar agente ao trocar equipe
    useEffect(() => { setAgente(''); }, [ine]);

    // Busca dados do gráfico
    useEffect(() => {
        const params = new URLSearchParams();
        if (ine)      params.set('ine',      ine);
        if (agente)   params.set('agente',   agente);
        if (desfecho) params.set('desfecho', desfecho);
        if (geo)      params.set('has_geo',  geo);

        const key = `visitas_evolucao_${ine}_${agente}_${desfecho}_${geo}`;
        const cached = getCached(key);
        if (cached) { setSeries(cached.series ?? []); setLoading(false); return; }

        if (ctrlRef.current) ctrlRef.current.abort();
        ctrlRef.current = new AbortController();

        setLoading(true);
        setErro(null);
        monitorApsApi.get(`/visitas/evolucao?${params}`, { signal: ctrlRef.current.signal })
            .then(d => { setCached(key, d); setSeries(d.series ?? []); })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setErro(e.message); })
            .finally(() => setLoading(false));
    }, [ine, agente, desfecho, geo]);

    const chartSeries = useMemo(() => buildChartSeries(series, CORES), [series]);

    const chartOptions = useMemo(() => ({
        chart:   { ...FONT, toolbar: { show: false }, zoom: { enabled: false } },
        xaxis:   { categories: MESES, labels: { style: { fontFamily: FONT.fontFamily } } },
        yaxis:   { labels: { formatter: v => v.toLocaleString('pt-BR'), style: { fontFamily: FONT.fontFamily } } },
        stroke:  { width: 2, curve: 'smooth' },
        markers: { size: 4 },
        legend:  { position: 'bottom', fontFamily: FONT.fontFamily },
        tooltip: { theme: 'dark', y: { formatter: v => v.toLocaleString('pt-BR') } },
        grid:    { borderColor: 'var(--lg-border)' },
        colors:  series.map((_, i) => CORES[i] ?? '#888'),
    }), [series]);

    const selSx = { minWidth: 140 };

    return (
        <Box>
            {/* Header + Filtros */}
            <Box display="flex" justifyContent="space-between" alignItems="center"
                mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700}>Evolução de Visitas ACS/TACS</Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine}
                            onChange={e => setIne(e.target.value)}>
                            <MenuItem value="">Todas as equipes</MenuItem>
                            {equipes.map(eq => (
                                <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {ine && (
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Agente</InputLabel>
                            <Select label="Agente" value={agente}
                                onChange={e => setAgente(e.target.value)}>
                                <MenuItem value="">Todos os agentes</MenuItem>
                                {agenteOpcoes.map((a, i) => (
                                    <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <FormControl size="small" sx={selSx}>
                        <InputLabel>Desfecho</InputLabel>
                        <Select label="Desfecho" value={desfecho}
                            onChange={e => setDesfecho(e.target.value)}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="1">Realizada</MenuItem>
                            <MenuItem value="2">Recusada</MenuItem>
                            <MenuItem value="3">Ausente</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 170 }}>
                        <InputLabel>Geolocalização</InputLabel>
                        <Select label="Geolocalização" value={geo}
                            onChange={e => setGeo(e.target.value)}>
                            <MenuItem value="">Todas</MenuItem>
                            <MenuItem value="sim">Com geolocalização</MenuItem>
                            <MenuItem value="nao">Sem geolocalização</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Gráfico */}
            <BaseCard title={`Visitas por Mês — ${anoAtual - 2} a ${anoAtual}`}>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : erro ? (
                    <Box p={3}>
                        <Typography color="error">Erro: {erro}</Typography>
                    </Box>
                ) : chartSeries.length === 0 ? (
                    <Box p={3} textAlign="center">
                        <Typography color="textSecondary">Sem dados para exibir.</Typography>
                    </Box>
                ) : (
                    <Chart type="line" height={420}
                        options={chartOptions}
                        series={chartSeries}
                    />
                )}
            </BaseCard>
        </Box>
    );
}
```

- [ ] **Step 4: Rodar os testes para confirmar passagem**

```bash
cd sysdoc_front
npm test -- --testPathPattern="monitor-aps/evolucao" --watch=false
```

Esperado: 3 testes PASS — `buildChartSeries` converte corretamente, retorna vazio e usa fallback de cor.

- [ ] **Step 5: Commit**

```bash
cd sysdoc_front
git add src/components/monitor-aps/VisitasEvolucao.js tests/monitor-aps/evolucao.test.js
git commit -m "feat(monitor-aps): componente VisitasEvolucao + gráfico de linhas 3 anos + testes"
```

---

## Self-Review

- [x] **Spec coverage:** Endpoint multi-ano ✓ | Filtros (equipe, agente, desfecho, geo) ✓ | 3 linhas coloridas ✓ | Sem cards de métricas ✓ | Item de menu ✓ | Padrão visual das páginas existentes ✓
- [x] **Placeholders:** Nenhum TBD/TODO. Todo código está completo.
- [x] **Type consistency:** `buildChartSeries` exportada e importada com mesmo nome em todos os tasks ✓ | `buildWhereFilters` definida no Task 1 e usada no Task 2 ✓ | `CORES` constante definida no componente e exportada para o teste ✓
