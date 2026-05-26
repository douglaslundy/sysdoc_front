# Monitor APS / e-SUS — Bugs + Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir 4 bugs nas páginas do Monitor APS (e-SUS PEC) e adicionar 1 card de cadastrados por agente + 1 página nova de lista de cidadãos ativos.

**Architecture:** Laravel 10 backend com `MonitorApsBaseController` gerenciando conexão PostgreSQL runtime ao e-SUS PEC; frontend Next.js 12 com MUI v5. Todas as queries são SELECT somente; colunas com nome variável entre versões do e-SUS são resolvidas via `firstExistingColumn()`. Implementação em 3 etapas independentes: Bugs → Card → Página.

**Tech Stack:** PHP 8.1+, Laravel 10, PostgreSQL (e-SUS PEC DW), Next.js 12, React 17, MUI v5, PHPUnit, Jest, @testing-library/react

---

## File Map

| Arquivo | Ação | Etapa |
|---------|------|-------|
| `sysdoc_back/app/Http/Controllers/PainelEsusController.php` | Modificar | 1 |
| `sysdoc_back/routes/api.php` | Modificar (3 rotas) | 1, 2, 3 |
| `src/services/painelEsusApi.js` | Modificar (1 método) | 1 |
| `src/components/painel-esus/FilaEsus.js` | Modificar | 1 |
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Modificar (2 métodos) | 1, 2 |
| `src/components/monitor-aps/VisitasAcs.js` | Modificar (useEffect + coluna) | 1, 2 |
| `sysdoc_back/app/Http/Controllers/CidadaoAcsController.php` | Criar | 3 |
| `src/components/monitor-aps/CidadaosPage.js` | Criar | 3 |
| `pages/monitor-aps/cidadaos.js` | Criar | 3 |
| `src/layouts/sidebar/MenuItems.js` | Modificar (1 item) | 3 |

---

## Etapa 1 — Bugs

---

### Task 1: PainelEsusController — `resolveUnidadeColumns()` + fix `validarCnes()`/`estado()` + novo `unidades()`

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/PainelEsusController.php`
- Test: `sysdoc_back/tests/Feature/PainelEsusUnidadesTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php
// sysdoc_back/tests/Feature/PainelEsusUnidadesTest.php
namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Cache;

class PainelEsusUnidadesTest extends TestCase
{
    public function test_unidades_route_exists_and_is_not_404(): void
    {
        Cache::put('aps_db_config', null, 3600);

        $response = $this->actingAs(\App\Models\User::factory()->create())
            ->getJson('/api/painel-esus/unidades');

        $this->assertNotEquals(404, $response->status());
    }

    public function test_validar_cnes_never_returns_500(): void
    {
        // Garante que coluna inválida não vaza 500 (agora usa resolveUnidadeColumns)
        Cache::put('aps_db_config', null, 3600);

        $response = $this->getJson('/api/public/painel-esus/validar-cnes?cnes=1234567');

        // Aceita 404 ou 503 (sem banco), mas nunca 500
        $this->assertNotEquals(500, $response->status());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./vendor/bin/phpunit tests/Feature/PainelEsusUnidadesTest.php`
Expected: `test_unidades_route_exists_and_is_not_404` → FAIL com 404 (rota não existe)

- [ ] **Step 3: Adicionar `resolveUnidadeColumns()` e `unidades()` em `PainelEsusController.php`**

Adicionar logo após o método `resolveListaColumns()` (após linha 23):

```php
private function resolveUnidadeColumns(): array
{
    return [
        'cnesCol' => $this->firstExistingColumn('tb_unidade_saude',
            ['co_cnes', 'nu_cnes', 'co_unico_saude']) ?? 'co_cnes',
        'nomeCol' => $this->firstExistingColumn('tb_unidade_saude',
            ['no_unidade_saude', 'ds_nome', 'no_estabelecimento']) ?? 'no_unidade_saude',
    ];
}

/**
 * GET /painel-esus/unidades
 * Autenticado. Lista unidades de saúde do banco e-SUS para o seletor de CNES.
 */
public function unidades(): JsonResponse
{
    try {
        $db = $this->db();
    } catch (\Throwable) {
        return response()->json(['error' => 'Não foi possível conectar ao e-SUS.'], 503);
    }

    try {
        $cols = $this->resolveUnidadeColumns();
        $rows = $db->select(
            "SELECT {$cols['cnesCol']} AS cnes, {$cols['nomeCol']} AS nome
             FROM tb_unidade_saude
             ORDER BY {$cols['nomeCol']}"
        );
        return response()->json(['unidades' => $rows]);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('PainelEsus.unidades: ' . $e->getMessage());
        return response()->json(['error' => 'Erro ao consultar unidades de saúde.'], 500);
    }
}
```

- [ ] **Step 4: Corrigir `validarCnes()` para usar `resolveUnidadeColumns()`**

Substituir o bloco `try` interno de `validarCnes()` (linhas 41–58 do arquivo atual):

```php
try {
    $cols = $this->resolveUnidadeColumns();
    $row = $db->selectOne(
        "SELECT {$cols['nomeCol']} AS nome
         FROM tb_unidade_saude
         WHERE {$cols['cnesCol']} = ?
         LIMIT 1",
        [$cnes]
    );
} catch (\Throwable $e) {
    \Illuminate\Support\Facades\Log::error('PainelEsus.validarCnes: ' . $e->getMessage());
    return response()->json(['error' => 'Erro ao consultar o banco de dados.'], 500);
}

if (!$row) {
    return response()->json(['error' => 'CNES não encontrado na base do e-SUS.'], 404);
}

return response()->json([
    'cnes' => $cnes,
    'nome' => $row->nome,
]);
```

- [ ] **Step 5: Corrigir `estado()` — query de nome da unidade (~linhas 96–101)**

Substituir:
```php
$unidadeRow = null;
try {
    $unidadeRow = $db->selectOne(
        "SELECT no_unidade_saude FROM tb_unidade_saude WHERE co_cnes = ? LIMIT 1",
        [$cnes]
    );
} catch (\Throwable) {}
```

Por:
```php
$unidadeRow = null;
try {
    $uCols = $this->resolveUnidadeColumns();
    $unidadeRow = $db->selectOne(
        "SELECT {$uCols['nomeCol']} AS nome
         FROM tb_unidade_saude
         WHERE {$uCols['cnesCol']} = ?
         LIMIT 1",
        [$cnes]
    );
} catch (\Throwable) {}
```

E atualizar o return no final de `estado()` (linha ~136):
```php
'unidade' => $unidadeRow?->nome ?? 'CNES ' . $cnes,
```

- [ ] **Step 6: Run tests**

Run: `./vendor/bin/phpunit tests/Feature/PainelEsusUnidadesTest.php`
Expected: FAIL ainda (rota não registrada) — commit após Task 1 e Task 1-rota juntos

---

### Task 1b: Rota `/painel-esus/unidades` em `api.php`

**Files:**
- Modify: `sysdoc_back/routes/api.php:159-162`

- [ ] **Step 1: Adicionar rota no grupo `painel-esus` (linhas 159–162)**

```php
Route::prefix('painel-esus')->group(function () {
    Route::get('/fila',     [PainelEsusController::class, 'fila']);
    Route::get('/filtros',  [PainelEsusController::class, 'filtros']);
    Route::get('/unidades', [PainelEsusController::class, 'unidades']);
});
```

- [ ] **Step 2: Run tests**

Run: `./vendor/bin/phpunit tests/Feature/PainelEsusUnidadesTest.php`
Expected: PASS (404 → 200 ou 503; nunca 500)

- [ ] **Step 3: Commit**

```bash
git add sysdoc_back/app/Http/Controllers/PainelEsusController.php \
        sysdoc_back/routes/api.php \
        sysdoc_back/tests/Feature/PainelEsusUnidadesTest.php
git commit -m "fix(painel-esus): resolveUnidadeColumns, endpoint /unidades, fix validarCnes/estado"
```

---

### Task 2: `painelEsusApi.js` — adicionar método `unidades()`

**Files:**
- Modify: `src/services/painelEsusApi.js`
- Test: `src/services/__tests__/painelEsusApi.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/services/__tests__/painelEsusApi.test.js
jest.mock('../api', () => ({
    api: { get: jest.fn().mockResolvedValue({ data: { unidades: [] } }) },
}));

import { painelEsusApi } from '../painelEsusApi';

describe('painelEsusApi', () => {
    it('exposes an unidades method', () => {
        expect(typeof painelEsusApi.unidades).toBe('function');
    });

    it('calls /painel-esus/unidades', async () => {
        const { api } = require('../api');
        await painelEsusApi.unidades();
        expect(api.get).toHaveBeenCalledWith(
            '/painel-esus/unidades',
            expect.objectContaining({})
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="painelEsusApi" --watchAll=false`
Expected: FAIL — `painelEsusApi.unidades is not a function`

- [ ] **Step 3: Adicionar `unidades` em `src/services/painelEsusApi.js`**

Substituir o objeto `painelEsusApi` (linhas 19–24):

```js
export const painelEsusApi = {
    fila: (params, options = {}) =>
        api.get('/painel-esus/fila', { params, signal: options.signal }).then(r => r.data),
    filtros: (cnes, options = {}) =>
        api.get('/painel-esus/filtros', { params: { cnes }, signal: options.signal }).then(r => r.data),
    unidades: (options = {}) =>
        api.get('/painel-esus/unidades', { signal: options.signal }).then(r => r.data),
};
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="painelEsusApi" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/painelEsusApi.js src/services/__tests__/painelEsusApi.test.js
git commit -m "feat(painelEsusApi): add unidades() method"
```

---

### Task 3: `FilaEsus.js` — remover input CNES, auto-carregar via `/unidades`

**Files:**
- Modify: `src/components/painel-esus/FilaEsus.js`
- Test: `src/components/painel-esus/__tests__/FilaEsus.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/components/painel-esus/__tests__/FilaEsus.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../services/painelEsusApi', () => ({
    painelEsusApi: {
        unidades: jest.fn(),
        filtros:  jest.fn().mockResolvedValue({ equipes: [], profissionais: [] }),
        fila:     jest.fn().mockResolvedValue({
            contadores: { aguardando: 0, atendidos: 0, nao_aguardaram: 0 },
            aguardando: [],
        }),
    },
    painelEsusPublicApi: {},
}));

import FilaEsus from '../FilaEsus';

describe('FilaEsus (Bug 1)', () => {
    beforeEach(() => jest.clearAllMocks());

    it('does NOT render CNES text input on mount', () => {
        const { painelEsusApi } = require('../../../services/painelEsusApi');
        painelEsusApi.unidades.mockResolvedValue({ unidades: [] });
        render(<FilaEsus />);
        expect(screen.queryByPlaceholderText('CNES da unidade')).not.toBeInTheDocument();
    });

    it('auto-sets CNES when only one unit returned', async () => {
        const { painelEsusApi } = require('../../../services/painelEsusApi');
        painelEsusApi.unidades.mockResolvedValue({
            unidades: [{ cnes: '1234567', nome: 'UBS Central' }],
        });
        render(<FilaEsus />);
        // UBS name appears as subtitle (no select needed)
        await waitFor(() =>
            expect(screen.getByText('UBS Central')).toBeInTheDocument()
        );
    });

    it('shows select when multiple units returned', async () => {
        const { painelEsusApi } = require('../../../services/painelEsusApi');
        painelEsusApi.unidades.mockResolvedValue({
            unidades: [
                { cnes: '1111111', nome: 'UBS Norte' },
                { cnes: '2222222', nome: 'UBS Sul' },
            ],
        });
        render(<FilaEsus />);
        await waitFor(() =>
            expect(screen.getByText('UBS Norte')).toBeInTheDocument()
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="FilaEsus" --watchAll=false`
Expected: FAIL — `queryByPlaceholderText('CNES da unidade')` é encontrado (ainda existe)

- [ ] **Step 3: Reescrever `FilaEsus.js`**

Substituir o arquivo inteiro pelo conteúdo abaixo. As únicas partes que mudam são: estados iniciais, remoção do bloco `if (!cnes)`, adição do `useEffect` de unidades e do seletor condicional. O restante do JSX (filtros, contadores, tabela de fila) permanece idêntico ao original.

```js
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box, Card, CardContent, CircularProgress, FormControl,
    Grid, InputLabel, MenuItem, Select, Table, TableBody,
    TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { painelEsusApi } from '../../services/painelEsusApi';

function ContadorCard({ icon, titulo, valor, cor }) {
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
                    </Box>
                    <Box sx={{ minWidth: 48, width: 48, height: 48, borderRadius: '50%', bgcolor: cor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FeatherIcon icon={icon} color={cor} width="22" height="22" />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

const selSx = {
    '& .MuiOutlinedInput-root': { background: 'var(--lg-glass-input)' },
};

export default function FilaEsus() {
    // cnes começa null; será preenchido automaticamente ao carregar unidades
    const [cnes,            setCnes]            = useState(null);
    const [unidades,        setUnidades]        = useState([]);
    const [loadingUnidades, setLoadingUnidades] = useState(true);
    const [erroUnidades,    setErroUnidades]    = useState('');
    const [equipes,         setEquipes]         = useState([]);
    const [profissionais,   setProfissionais]   = useState([]);
    const [equipeId,        setEquipeId]        = useState('');
    const [profId,          setProfId]          = useState('');
    const [dados,           setDados]           = useState(null);
    const [loading,         setLoading]         = useState(false);
    const [erro,            setErro]            = useState(null);
    const abortRef = useRef(null);

    // Carrega unidades no mount — auto-seleciona se houver apenas 1
    useEffect(() => {
        const ac = new AbortController();
        setLoadingUnidades(true);
        painelEsusApi.unidades({ signal: ac.signal })
            .then(d => {
                const lista = d.unidades ?? [];
                setUnidades(lista);
                if (lista.length === 1) setCnes(lista[0].cnes);
            })
            .catch(e => {
                if (e?.code === 'ERR_CANCELED') return;
                setErroUnidades('Não foi possível carregar as unidades de saúde.');
            })
            .finally(() => setLoadingUnidades(false));
        return () => ac.abort();
    }, []);

    // Carrega filtros quando CNES muda
    useEffect(() => {
        if (!cnes) return;
        const ac = new AbortController();
        painelEsusApi.filtros(cnes, { signal: ac.signal })
            .then(d => {
                setEquipes(d.equipes ?? []);
                setProfissionais(d.profissionais ?? []);
            })
            .catch(() => {});
        return () => ac.abort();
    }, [cnes]);

    const carregarFila = useCallback(() => {
        if (!cnes) return;
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);
        setErro(null);
        const params = { cnes };
        if (equipeId) params.equipe = equipeId;
        if (profId)   params.profissional = profId;
        painelEsusApi.fila(params, { signal: ac.signal })
            .then(d => setDados(d))
            .catch(e => {
                if (e.name === 'CanceledError' || e.name === 'AbortError') return;
                setErro('Erro ao carregar a fila. Tente novamente.');
            })
            .finally(() => setLoading(false));
    }, [cnes, equipeId, profId]);

    useEffect(() => {
        carregarFila();
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, [carregarFila]);

    if (loadingUnidades) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress />
            </Box>
        );
    }

    if (erroUnidades) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <Typography sx={{ color: '#E52207' }}>{erroUnidades}</Typography>
            </Box>
        );
    }

    const unidadeAtual = unidades.find(u => u.cnes === cnes);

    return (
        <Box>
            {/* Seletor de unidade — só exibido quando há mais de uma */}
            {unidades.length > 1 && (
                <Box mb={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 300, ...selSx }}>
                        <InputLabel>Unidade de Saúde</InputLabel>
                        <Select
                            label="Unidade de Saúde"
                            value={cnes ?? ''}
                            onChange={e => {
                                setCnes(e.target.value || null);
                                setEquipeId('');
                                setProfId('');
                                setDados(null);
                            }}
                        >
                            <MenuItem value=""><em>Selecione uma unidade</em></MenuItem>
                            {unidades.map(u => (
                                <MenuItem key={u.cnes} value={u.cnes}>{u.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            {/* Nome da unidade selecionada */}
            {unidadeAtual && (
                <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-muted)', mb: 2 }}>
                    {unidadeAtual.nome} — CNES {cnes}
                </Typography>
            )}

            {/* Estado: aguardando seleção de unidade */}
            {!cnes && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <Typography sx={{ color: 'var(--lg-text-muted)' }}>
                        Selecione uma unidade de saúde para visualizar a fila.
                    </Typography>
                </Box>
            )}

            {/* Conteúdo principal — igual ao original (filtros + contadores + tabela) */}
            {cnes && (
                <>
                    {/* Filtros */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth size="small" sx={selSx}>
                                        <InputLabel>Equipe</InputLabel>
                                        <Select
                                            label="Equipe"
                                            value={equipeId}
                                            onChange={e => { setEquipeId(e.target.value); setProfId(''); }}
                                        >
                                            <MenuItem value=""><em>Todas</em></MenuItem>
                                            {equipes.map(eq => (
                                                <MenuItem key={eq.id} value={eq.id}>{eq.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth size="small" sx={selSx}>
                                        <InputLabel>Profissional</InputLabel>
                                        <Select
                                            label="Profissional"
                                            value={profId}
                                            onChange={e => setProfId(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Todos</em></MenuItem>
                                            {profissionais.map(p => (
                                                <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                        CNES: {cnes}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {loading ? (
                        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
                    ) : erro ? (
                        <Typography sx={{ color: '#E52207', textAlign: 'center', py: 4 }}>{erro}</Typography>
                    ) : dados ? (
                        <>
                            {/* Contadores */}
                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={4}>
                                    <ContadorCard icon="clock" titulo="Aguardando"
                                        valor={dados.contadores?.aguardando} cor="#1351B4" />
                                </Grid>
                                <Grid item xs={4}>
                                    <ContadorCard icon="check-circle" titulo="Atendidos"
                                        valor={dados.contadores?.atendidos} cor="#168821" />
                                </Grid>
                                <Grid item xs={4}>
                                    <ContadorCard icon="user-x" titulo="Não aguardaram"
                                        valor={dados.contadores?.nao_aguardaram} cor="#888" />
                                </Grid>
                            </Grid>

                            {/* Tabela de aguardando */}
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                                        Aguardando atendimento
                                    </Typography>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'var(--lg-text-muted)', textTransform: 'uppercase' } }}>
                                                <TableCell>Cidadão</TableCell>
                                                <TableCell>Chegada</TableCell>
                                                <TableCell>Equipe</TableCell>
                                                <TableCell>Profissional</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(dados.aguardando ?? []).map(a => (
                                                <TableRow key={a.id} hover>
                                                    <TableCell>{a.cidadao}</TableCell>
                                                    <TableCell>{a.hr_chegada}</TableCell>
                                                    <TableCell>{a.equipe}</TableCell>
                                                    <TableCell>{a.profissional}</TableCell>
                                                </TableRow>
                                            ))}
                                            {(dados.aguardando ?? []).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center"
                                                        sx={{ py: 3, color: 'var(--lg-text-muted)' }}>
                                                        Nenhum cidadão aguardando no momento.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : null}
                </>
            )}
        </Box>
    );
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="FilaEsus" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/painel-esus/FilaEsus.js \
        src/components/painel-esus/__tests__/FilaEsus.test.js
git commit -m "fix(fila-esus): remover input CNES manual, auto-carregar unidade via /painel-esus/unidades"
```

---

### Task 4: `VisitaAcsController::mapa()` — resolver colunas CPF/CNS/nome para filtro `busca`

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php:958-978`
- Test: `sysdoc_back/tests/Feature/VisitaAcsMapaTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php
// sysdoc_back/tests/Feature/VisitaAcsMapaTest.php
namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Cache;

class VisitaAcsMapaTest extends TestCase
{
    public function test_mapa_com_busca_nao_retorna_500(): void
    {
        Cache::put('aps_db_config', null, 3600);

        $response = $this->actingAs(\App\Models\User::factory()->create())
            ->getJson('/api/monitor-aps/visitas/mapa?ano=2024&mes=1&busca=Maria');

        $this->assertNotEquals(500, $response->status());
    }

    public function test_mapa_sem_busca_nao_retorna_500(): void
    {
        Cache::put('aps_db_config', null, 3600);

        $response = $this->actingAs(\App\Models\User::factory()->create())
            ->getJson('/api/monitor-aps/visitas/mapa?ano=2024&mes=1');

        $this->assertNotEquals(500, $response->status());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./vendor/bin/phpunit tests/Feature/VisitaAcsMapaTest.php`
Expected: pode já passar se o banco de testes não tiver e-SUS (503) — verificar se 500 é retornado em ambiente com banco configurado e colunas inválidas. Se passar como 503, o teste ainda é útil como regression guard.

- [ ] **Step 3: Corrigir `mapa()` em `VisitaAcsController.php`**

No método `mapa()`, antes do bloco `if ($request->busca)` (~linha 958), adicionar:

```php
$cpfCol  = $this->firstExistingColumn('tb_fat_cad_individual', ['nu_cpf', 'co_cpf'])     ?? 'nu_cpf';
$cnsCol  = $this->firstExistingColumn('tb_fat_cad_individual', ['nu_cns', 'co_cns'])     ?? 'nu_cns';
$nomeCol = $this->firstExistingColumn('tb_fat_cad_individual', ['no_cidadao', 'no_nome']) ?? 'no_cidadao';
```

Substituir o bloco `if ($request->busca) { ... }` (linhas ~958–977):

```php
if ($request->busca) {
    $busca  = trim($request->busca);
    $digits = preg_replace('/\D/', '', $busca);

    if (strlen($digits) === 11) {
        $where   .= " AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE {$cpfCol} = ?)";
        $params[] = $digits;
    } elseif (strlen($digits) === 15) {
        $where   .= " AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE {$cnsCol} = ?)";
        $params[] = $digits;
    } else {
        $where   .= " AND v.co_fat_cidadao_pec IN (
            SELECT co_fat_cidadao_pec FROM tb_fat_cad_individual
            WHERE {$nomeCol} ILIKE ?)";
        $params[] = '%' . $busca . '%';
    }
}
```

- [ ] **Step 4: Run tests**

Run: `./vendor/bin/phpunit tests/Feature/VisitaAcsMapaTest.php`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php \
        sysdoc_back/tests/Feature/VisitaAcsMapaTest.php
git commit -m "fix(mapa): firstExistingColumn para CPF/CNS/nome no filtro busca"
```

---

### Task 5: `VisitasAcs.js` — fix `useEffect` do mapa para incluir todos os filtros

**Files:**
- Modify: `src/components/monitor-aps/VisitasAcs.js:184-200`
- Test: `src/components/monitor-aps/__tests__/VisitasAcs.mapa.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/components/monitor-aps/__tests__/VisitasAcs.mapa.test.js
const fs = require('fs');
const path = require('path');

it('mapa useEffect passes filtroAgente, filtroDesfecho, filtroGeo params', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '../VisitasAcs.js'), 'utf8'
    );
    // Dependency array deve incluir os três filtros
    expect(src).toMatch(/\[aba, ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo\]/);
    // Corpo do useEffect deve setar os parâmetros
    expect(src).toMatch(/params\.set\('agente', filtroAgente\)/);
    expect(src).toMatch(/params\.set\('desfecho', filtroDesfecho\)/);
    expect(src).toMatch(/params\.set\('has_geo', filtroGeo\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="VisitasAcs.mapa" --watchAll=false`
Expected: FAIL — o useEffect atual tem `[aba, ano, mes, ine]` apenas

- [ ] **Step 3: Corrigir o `useEffect` do mapa em `VisitasAcs.js` (linhas 184–200)**

Substituir:
```js
// Carrega pontos do mapa quando a aba muda para mapa
useEffect(() => {
    if (aba !== 'mapa') return;
    const params = new URLSearchParams({ ano, mes });
    if (ine) params.set('ine', ine);
    const key = `visitas_mapa_all_${params}`;
    const cached = getCached(key);
    if (cached) { setPontosMapa(cached.pontos ?? []); return; }

    const ctrl = new AbortController();
    setLoadingMapa(true);
    monitorApsApi.get(`/visitas/mapa?${params}`, { signal: ctrl.signal })
        .then(d => { setCached(key, d); setPontosMapa(d.pontos ?? []); })
        .catch(e => { if (e?.code !== 'ERR_CANCELED') setPontosMapa([]); })
        .finally(() => setLoadingMapa(false));
    return () => ctrl.abort();
}, [aba, ano, mes, ine]);
```

Por:
```js
// Carrega pontos do mapa quando a aba muda para mapa
useEffect(() => {
    if (aba !== 'mapa') return;
    const params = new URLSearchParams({ ano, mes });
    if (ine)            params.set('ine', ine);
    if (filtroAgente)   params.set('agente', filtroAgente);
    if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
    if (filtroGeo)      params.set('has_geo', filtroGeo);
    const key = `visitas_mapa_all_${params}`;
    const cached = getCached(key);
    if (cached) { setPontosMapa(cached.pontos ?? []); return; }

    const ctrl = new AbortController();
    setLoadingMapa(true);
    monitorApsApi.get(`/visitas/mapa?${params}`, { signal: ctrl.signal })
        .then(d => { setCached(key, d); setPontosMapa(d.pontos ?? []); })
        .catch(e => { if (e?.code !== 'ERR_CANCELED') setPontosMapa([]); })
        .finally(() => setLoadingMapa(false));
    return () => ctrl.abort();
}, [aba, ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="VisitasAcs.mapa" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/monitor-aps/VisitasAcs.js \
        src/components/monitor-aps/__tests__/VisitasAcs.mapa.test.js
git commit -m "fix(visitas-mapa): aplicar filtroAgente/filtroDesfecho/filtroGeo ao useEffect do mapa"
```

---

## Etapa 2 — Card: Cidadãos Cadastrados por Agente

---

### Task 6: `VisitaAcsController::responsabilidade()` + rota

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`
- Modify: `sysdoc_back/routes/api.php:136-146`
- Test: `sysdoc_back/tests/Feature/VisitaAcsResponsabilidadeTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php
// sysdoc_back/tests/Feature/VisitaAcsResponsabilidadeTest.php
namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Cache;

class VisitaAcsResponsabilidadeTest extends TestCase
{
    public function test_responsabilidade_route_exists(): void
    {
        Cache::put('aps_db_config', null, 3600);

        $response = $this->actingAs(\App\Models\User::factory()->create())
            ->getJson('/api/monitor-aps/visitas/responsabilidade');

        $this->assertNotEquals(404, $response->status());
    }

    public function test_responsabilidade_com_ine_nao_retorna_500(): void
    {
        Cache::put('aps_db_config', null, 3600);

        $response = $this->actingAs(\App\Models\User::factory()->create())
            ->getJson('/api/monitor-aps/visitas/responsabilidade?ine=0000123456');

        $this->assertNotEquals(404, $response->status());
        $this->assertNotEquals(500, $response->status());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./vendor/bin/phpunit tests/Feature/VisitaAcsResponsabilidadeTest.php`
Expected: FAIL — 404 (rota não existe)

- [ ] **Step 3: Adicionar `responsabilidade()` em `VisitaAcsController.php`**

Adicionar ao final da classe (antes do `}`):

```php
/**
 * GET /monitor-aps/visitas/responsabilidade?ine=X
 * Conta cidadãos cadastrados por ACS via tb_fat_cad_individual.co_dim_profissional.
 */
public function responsabilidade(Request $request): JsonResponse
{
    $ine = $request->query('ine');

    try {
        $db = $this->db();
    } catch (\Throwable) {
        return response()->json(['error' => 'Não foi possível conectar ao e-SUS.'], 503);
    }

    try {
        $sql = "
            SELECT
                dp.no_profissional                         AS agente,
                dp.nu_cns                                  AS cns,
                de.nu_ine,
                de.no_equipe,
                COUNT(DISTINCT fci.co_fat_cidadao_pec)     AS cadastrados
            FROM tb_fat_cad_individual fci
            JOIN tb_dim_equipe de
                ON de.co_seq_dim_equipe = fci.co_dim_equipe
            LEFT JOIN tb_dim_profissional dp
                ON dp.co_seq_dim_profissional = fci.co_dim_profissional
            WHERE fci.st_ficha_inativa = 0
              AND de.st_registro_valido = 1
        ";
        $params = [];

        if ($ine) {
            $sql    .= ' AND de.nu_ine = ?';
            $params[] = $ine;
        }

        $sql .= '
            GROUP BY dp.no_profissional, dp.nu_cns, de.nu_ine, de.no_equipe
            ORDER BY cadastrados DESC
        ';

        $rows = $db->select($sql, $params);
        return response()->json(['responsabilidade' => $rows]);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('VisitaAcs.responsabilidade: ' . $e->getMessage());
        return response()->json(['error' => 'Erro ao consultar responsabilidade.'], 500);
    }
}
```

- [ ] **Step 4: Adicionar rota em `api.php`**

No grupo `prefix('visitas')` (linhas 136–146), adicionar antes das rotas com `whereNumber`:

```php
Route::prefix('visitas')->group(function () {
    Route::get('/',                [VisitaAcsController::class, 'index']);
    Route::get('/resumo',          [VisitaAcsController::class, 'resumo']);
    Route::get('/lista',           [VisitaAcsController::class, 'lista']);
    Route::get('/mapa',            [VisitaAcsController::class, 'mapa']);
    Route::get('/equipes',         [VisitaAcsController::class, 'equipes']);
    Route::get('/agentes',         [VisitaAcsController::class, 'agentes']);
    Route::get('/evolucao',        [VisitaAcsController::class, 'evolucao']);
    Route::get('/responsabilidade',[VisitaAcsController::class, 'responsabilidade']);
    Route::get('/debug/{id}',      [VisitaAcsController::class, 'showDebug'])->whereNumber('id');
    Route::get('/{id}',            [VisitaAcsController::class, 'show'])->whereNumber('id');
});
```

- [ ] **Step 5: Run tests**

Run: `./vendor/bin/phpunit tests/Feature/VisitaAcsResponsabilidadeTest.php`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php \
        sysdoc_back/routes/api.php \
        sysdoc_back/tests/Feature/VisitaAcsResponsabilidadeTest.php
git commit -m "feat(visitas): endpoint /responsabilidade — cidadãos cadastrados por ACS"
```

---

### Task 7: `VisitasAcs.js` — fetch de responsabilidade + coluna "Cadastrados"

**Files:**
- Modify: `src/components/monitor-aps/VisitasAcs.js`
- Test: `src/components/monitor-aps/__tests__/VisitasAcs.responsabilidade.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/components/monitor-aps/__tests__/VisitasAcs.responsabilidade.test.js
const fs = require('fs');
const path = require('path');

it('VisitasAcs contains responsabilidade state, fetch, and Cadastrados column', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '../VisitasAcs.js'), 'utf8'
    );
    expect(src).toMatch(/responsabilidade/);
    expect(src).toMatch(/\/visitas\/responsabilidade/);
    expect(src).toMatch(/Cadastrados/);
    // Cross-reference normalizado
    expect(src).toMatch(/trim\(\)\.toLowerCase\(\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="VisitasAcs.responsabilidade" --watchAll=false`
Expected: FAIL

- [ ] **Step 3: Adicionar estado `responsabilidade` em `VisitasAcs.js`**

Após a linha `const [modalAberto, setModalAberto] = useState(false);` (~linha 102), adicionar:

```js
const [responsabilidade, setResponsabilidade] = useState([]);
```

- [ ] **Step 4: Adicionar `useEffect` de responsabilidade**

Após o bloco `useEffect` de agentes (~linha 165), adicionar:

```js
// Carrega responsabilidade (cadastrados por agente) — recarrega quando equipe muda
useEffect(() => {
    const params = new URLSearchParams();
    if (ine) params.set('ine', ine);
    const ctrl = new AbortController();
    monitorApsApi.get(`/visitas/responsabilidade?${params}`, { signal: ctrl.signal })
        .then(d => setResponsabilidade(d.responsabilidade ?? []))
        .catch(() => {});
    return () => ctrl.abort();
}, [ine]);
```

- [ ] **Step 5: Adicionar coluna "Cadastrados" no `TableHead` da aba Por Agente**

No `TableHead` da aba `agentes` (~linha 487), após `<TableCell align="right">Cidadãos</TableCell>`, adicionar:

```jsx
<TableCell align="right">Cadastrados</TableCell>
```

- [ ] **Step 6: Adicionar célula "Cadastrados" no `TableBody` da aba Por Agente**

No `TableBody` da aba `agentes` (~linha 530), após a célula `a.cidadaos`, adicionar:

```jsx
<TableCell align="right">
    {(() => {
        const r = responsabilidade.find(
            r => r.agente?.trim().toLowerCase() === a.agente?.trim().toLowerCase()
        );
        return r ? Number(r.cadastrados).toLocaleString('pt-BR') : '—';
    })()}
</TableCell>
```

Atualizar o `colSpan` do estado vazio de `11` para `12`.

- [ ] **Step 7: Run tests**

Run: `npm test -- --testPathPattern="VisitasAcs.responsabilidade" --watchAll=false`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/monitor-aps/VisitasAcs.js \
        src/components/monitor-aps/__tests__/VisitasAcs.responsabilidade.test.js
git commit -m "feat(visitas): coluna Cadastrados por agente via /responsabilidade"
```

---

## Etapa 3 — Página: Lista de Cidadãos Ativos

---

### Task 8: `CidadaoAcsController` — `index()`, `agentes()` + rotas

**Files:**
- Create: `sysdoc_back/app/Http/Controllers/CidadaoAcsController.php`
- Modify: `sysdoc_back/routes/api.php`
- Test: `sysdoc_back/tests/Feature/CidadaoAcsControllerTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php
// sysdoc_back/tests/Feature/CidadaoAcsControllerTest.php
namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Cache;

class CidadaoAcsControllerTest extends TestCase
{
    private function user()
    {
        return \App\Models\User::factory()->create();
    }

    public function test_cidadaos_index_route_exists(): void
    {
        Cache::put('aps_db_config', null, 3600);
        $r = $this->actingAs($this->user())->getJson('/api/monitor-aps/cidadaos');
        $this->assertNotEquals(404, $r->status());
    }

    public function test_cidadaos_agentes_route_exists(): void
    {
        Cache::put('aps_db_config', null, 3600);
        $r = $this->actingAs($this->user())->getJson('/api/monitor-aps/cidadaos/agentes');
        $this->assertNotEquals(404, $r->status());
    }

    public function test_cidadaos_index_resposta_estruturada(): void
    {
        Cache::put('aps_db_config', null, 3600);
        $r = $this->actingAs($this->user())->getJson('/api/monitor-aps/cidadaos?page=1&per_page=10');
        if ($r->status() === 200) {
            $r->assertJsonStructure(['cidadaos', 'meta' => ['total', 'page', 'per_page', 'pages']]);
        }
        $this->assertNotEquals(500, $r->status());
    }

    public function test_cidadaos_busca_minimo_3_chars(): void
    {
        Cache::put('aps_db_config', null, 3600);
        $r = $this->actingAs($this->user())->getJson('/api/monitor-aps/cidadaos?busca=AB');
        // busca com 2 chars → 422 (validação), a não ser que sem banco (503)
        if ($r->status() !== 503) {
            $this->assertEquals(422, $r->status());
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./vendor/bin/phpunit tests/Feature/CidadaoAcsControllerTest.php`
Expected: FAIL — 404 (rotas não existem)

- [ ] **Step 3: Criar `CidadaoAcsController.php`**

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CidadaoAcsController extends MonitorApsBaseController
{
    private const ACS_CBOS = ['515105', '322255'];

    private function resolveColumns(): array
    {
        return [
            'cpfCol'  => $this->firstExistingColumn('tb_fat_cad_individual',
                ['nu_cpf', 'co_cpf'])                          ?? 'nu_cpf',
            'cnsCol'  => $this->firstExistingColumn('tb_fat_cad_individual',
                ['nu_cns', 'co_cns'])                          ?? 'nu_cns',
            'nomeCol' => $this->firstExistingColumn('tb_fat_cad_individual',
                ['no_cidadao', 'no_nome'])                     ?? 'no_cidadao',
            'hasCol'  => $this->firstExistingColumn('tb_fat_cad_individual',
                ['st_hipertensao_arterial', 'st_hipertensao']) ?? 'st_hipertensao_arterial',
            'dmCol'   => $this->firstExistingColumn('tb_fat_cad_individual',
                ['st_diabete', 'st_diabetes'])                 ?? 'st_diabete',
        ];
    }

    /**
     * GET /monitor-aps/cidadaos?ine=&profissional_id=&busca=&page=&per_page=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'ine'             => 'nullable|string',
            'profissional_id' => 'nullable|integer',
            'busca'           => 'nullable|string|min:3|max:100',
            'page'            => 'nullable|integer|min:1',
            'per_page'        => 'nullable|integer|min:10|max:200',
        ]);

        $ine            = $request->query('ine');
        $profissionalId = $request->query('profissional_id');
        $busca          = $request->query('busca');
        $page           = max(1, (int) ($request->query('page', 1)));
        $perPage        = min(200, max(10, (int) ($request->query('per_page', 50))));
        $offset         = ($page - 1) * $perPage;

        try {
            $db = $this->db();
        } catch (\Throwable) {
            return response()->json(['error' => 'Não foi possível conectar ao e-SUS.'], 503);
        }

        try {
            $cols    = $this->resolveColumns();
            $cpfCol  = $cols['cpfCol'];
            $cnsCol  = $cols['cnsCol'];
            $nomeCol = $cols['nomeCol'];
            $hasCol  = $cols['hasCol'];
            $dmCol   = $cols['dmCol'];

            $where  = 'fci.st_ficha_inativa = 0 AND de.st_registro_valido = 1';
            $params = [];

            if ($ine) {
                $where   .= ' AND de.nu_ine = ?';
                $params[] = $ine;
            }
            if ($profissionalId) {
                $where   .= ' AND fci.co_dim_profissional = ?';
                $params[] = (int) $profissionalId;
            }
            if ($busca) {
                $b        = trim($busca);
                $digits   = preg_replace('/\D/', '', $b);
                $where   .= " AND (fci.{$nomeCol} ILIKE ? OR fci.{$cpfCol} = ? OR fci.{$cnsCol} = ?)";
                $params[] = '%' . $b . '%';
                $params[] = $digits;
                $params[] = $digits;
            }

            $sql = "
                SELECT
                    fci.co_fat_cidadao_pec,
                    fci.{$nomeCol}                                              AS nome,
                    fci.{$cpfCol}                                               AS cpf,
                    fci.{$cnsCol}                                               AS cns,
                    TO_CHAR(fci.dt_nascimento, 'DD/MM/YYYY')                   AS data_nascimento,
                    DATE_PART('year', AGE(fci.dt_nascimento))::int             AS idade,
                    de.nu_ine,
                    de.no_equipe,
                    dp.co_seq_dim_profissional                                 AS profissional_id,
                    dp.no_profissional                                         AS agente,
                    dp.nu_cns                                                  AS cns_agente,
                    fci.st_gestante,
                    fci.{$hasCol}                                              AS st_has,
                    fci.{$dmCol}                                               AS st_dm,
                    CASE WHEN DATE_PART('year', AGE(fci.dt_nascimento)) >= 60
                         THEN 1 ELSE 0 END                                     AS st_idoso,
                    COUNT(*) OVER()                                            AS total_count
                FROM tb_fat_cad_individual fci
                JOIN tb_dim_equipe de
                    ON de.co_seq_dim_equipe = fci.co_dim_equipe
                LEFT JOIN tb_dim_profissional dp
                    ON dp.co_seq_dim_profissional = fci.co_dim_profissional
                WHERE {$where}
                ORDER BY fci.{$nomeCol}
                LIMIT ? OFFSET ?
            ";

            $rows  = $db->select($sql, array_merge($params, [$perPage, $offset]));
            $total = count($rows) > 0 ? (int) $rows[0]->total_count : 0;

            return response()->json([
                'cidadaos' => $rows,
                'meta'     => [
                    'total'    => $total,
                    'page'     => $page,
                    'per_page' => $perPage,
                    'pages'    => $perPage > 0 ? (int) ceil($total / $perPage) : 1,
                ],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('CidadaoAcs.index: ' . $e->getMessage());
            return response()->json(['error' => 'Erro ao consultar cidadãos.'], 500);
        }
    }

    /**
     * GET /monitor-aps/cidadaos/agentes?ine=X
     */
    public function agentes(Request $request): JsonResponse
    {
        $ine = $request->query('ine');

        try {
            $db = $this->db();
        } catch (\Throwable) {
            return response()->json(['error' => 'Não foi possível conectar ao e-SUS.'], 503);
        }

        try {
            $cbos   = implode("','", self::ACS_CBOS);
            $where  = "dp.nu_cbo IN ('{$cbos}')";
            $params = [];

            if ($ine) {
                $where   .= " AND dp.co_seq_dim_profissional IN (
                    SELECT DISTINCT fci.co_dim_profissional
                    FROM tb_fat_cad_individual fci
                    JOIN tb_dim_equipe de ON de.co_seq_dim_equipe = fci.co_dim_equipe
                    WHERE de.nu_ine = ? AND fci.st_ficha_inativa = 0
                )";
                $params[] = $ine;
            }

            $rows = $db->select("
                SELECT dp.co_seq_dim_profissional AS id,
                       dp.no_profissional         AS nome,
                       dp.nu_cns                  AS cns
                FROM tb_dim_profissional dp
                WHERE {$where}
                ORDER BY dp.no_profissional
            ", $params);

            return response()->json(['agentes' => $rows]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('CidadaoAcs.agentes: ' . $e->getMessage());
            return response()->json(['error' => 'Erro ao consultar agentes.'], 500);
        }
    }
}
```

- [ ] **Step 4: Adicionar import e rotas em `api.php`**

No topo do arquivo, após a linha `use App\Http\Controllers\CampoReferenciaController;`, adicionar:

```php
use App\Http\Controllers\CidadaoAcsController;
```

No grupo `prefix('monitor-aps')` (antes do `});` de fechamento ~linha 156), adicionar:

```php
Route::prefix('cidadaos')->group(function () {
    Route::get('/',        [CidadaoAcsController::class, 'index']);
    Route::get('/agentes', [CidadaoAcsController::class, 'agentes']);
});
```

- [ ] **Step 5: Run tests**

Run: `./vendor/bin/phpunit tests/Feature/CidadaoAcsControllerTest.php`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add sysdoc_back/app/Http/Controllers/CidadaoAcsController.php \
        sysdoc_back/routes/api.php \
        sysdoc_back/tests/Feature/CidadaoAcsControllerTest.php
git commit -m "feat(cidadaos): CidadaoAcsController — index() e agentes() com rotas"
```

---

### Task 9: `CidadaosPage.js` — componente principal

**Files:**
- Create: `src/components/monitor-aps/CidadaosPage.js`
- Test: `src/components/monitor-aps/__tests__/CidadaosPage.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/components/monitor-aps/__tests__/CidadaosPage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../../../services/monitorApsApi', () => ({
    monitorApsApi: {
        get: jest.fn().mockResolvedValue({
            equipes: [], agentes: [], cidadaos: [],
            meta: { total: 0, page: 1, per_page: 50, pages: 0 },
        }),
    },
}));

import CidadaosPage from '../CidadaosPage';

describe('CidadaosPage', () => {
    it('renders the page title', () => {
        render(<CidadaosPage />);
        expect(screen.getByText('Cidadãos')).toBeInTheDocument();
    });

    it('renders Nome and Condições column headers', () => {
        render(<CidadaosPage />);
        expect(screen.getByText('Nome')).toBeInTheDocument();
        expect(screen.getByText('Condições')).toBeInTheDocument();
    });

    it('shows empty state message when no data', async () => {
        render(<CidadaosPage />);
        // empty state só aparece após loading
        await screen.findByText(/nenhum cidadão encontrado/i);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="CidadaosPage" --watchAll=false`
Expected: FAIL — Cannot find module `../CidadaosPage`

- [ ] **Step 3: Criar `src/components/monitor-aps/CidadaosPage.js`**

```js
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box, Card, CardContent, Chip, CircularProgress,
    FormControl, InputLabel, MenuItem, Select, Table,
    TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { monitorApsApi } from '../../services/monitorApsApi';

const CHIP_CONDICOES = [
    { key: 'st_gestante', label: 'Gestante', cor: '#1351B4' },
    { key: 'st_has',      label: 'HAS',      cor: '#FF8C00' },
    { key: 'st_dm',       label: 'DM',       cor: '#7B2D8B' },
    { key: 'st_idoso',    label: 'Idoso',    cor: '#168821' },
];

export default function CidadaosPage() {
    const [equipes,   setEquipes]   = useState([]);
    const [agentes,   setAgentes]   = useState([]);
    const [ine,       setIne]       = useState('');
    const [agenteSel, setAgenteSel] = useState('');
    const [busca,     setBusca]     = useState('');
    const [cidadaos,  setCidadaos]  = useState([]);
    const [meta,      setMeta]      = useState({ total: 0, page: 1, per_page: 50, pages: 0 });
    const [page,      setPage]      = useState(0);
    const [loading,   setLoading]   = useState(false);
    const debounceRef = useRef(null);
    const ctrlRef     = useRef(null);

    // Carrega equipes uma vez
    useEffect(() => {
        const ctrl = new AbortController();
        monitorApsApi.get('/config/equipes', { signal: ctrl.signal })
            .then(d => setEquipes(d.equipes ?? []))
            .catch(() => {});
        return () => ctrl.abort();
    }, []);

    // Carrega agentes quando equipe muda
    useEffect(() => {
        setAgenteSel('');
        if (!ine) { setAgentes([]); return; }
        const ctrl = new AbortController();
        const params = new URLSearchParams({ ine });
        monitorApsApi.get(`/cidadaos/agentes?${params}`, { signal: ctrl.signal })
            .then(d => setAgentes(d.agentes ?? []))
            .catch(() => {});
        return () => ctrl.abort();
    }, [ine]);

    const fetchCidadaos = useCallback((overridePage = 0) => {
        if (ctrlRef.current) ctrlRef.current.abort();
        const ctrl = new AbortController();
        ctrlRef.current = ctrl;

        const params = new URLSearchParams({ page: overridePage + 1, per_page: 50 });
        if (ine)                 params.set('ine', ine);
        if (agenteSel)           params.set('profissional_id', agenteSel);
        if (busca.length >= 3)   params.set('busca', busca);

        setLoading(true);
        monitorApsApi.get(`/cidadaos?${params}`, { signal: ctrl.signal })
            .then(d => {
                setCidadaos(d.cidadaos ?? []);
                setMeta(d.meta ?? { total: 0, page: 1, per_page: 50, pages: 0 });
            })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setCidadaos([]); })
            .finally(() => setLoading(false));
    }, [ine, agenteSel, busca]);

    // Fetch com debounce de 400ms para campo de busca
    useEffect(() => {
        setPage(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchCidadaos(0), busca ? 400 : 0);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [ine, agenteSel, busca]);

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
        fetchCidadaos(newPage);
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center"
                mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700}>Cidadãos</Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine}
                            onChange={e => { setIne(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todas as equipes</MenuItem>
                            {equipes.map(eq => (
                                <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }} disabled={!ine}>
                        <InputLabel>Agente</InputLabel>
                        <Select label="Agente" value={agenteSel}
                            onChange={e => { setAgenteSel(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todos os agentes</MenuItem>
                            {agentes.map(a => (
                                <MenuItem key={a.id} value={a.id}>{a.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        label="Busca"
                        placeholder="nome, CPF ou CNS"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        sx={{ minWidth: 220 }}
                        helperText={busca.length > 0 && busca.length < 3 ? 'Mínimo 3 caracteres' : ''}
                    />
                </Box>
            </Box>

            <Card>
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{
                                        '& th': {
                                            fontWeight: 700, fontSize: 11,
                                            color: 'var(--lg-text-muted)',
                                            textTransform: 'uppercase',
                                            borderBottom: '2px solid var(--lg-border)',
                                        },
                                    }}>
                                        <TableCell>#</TableCell>
                                        <TableCell>Nome</TableCell>
                                        <TableCell>CPF</TableCell>
                                        <TableCell>CNS</TableCell>
                                        <TableCell>Idade</TableCell>
                                        <TableCell>Equipe</TableCell>
                                        <TableCell>Agente</TableCell>
                                        <TableCell>Condições</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cidadaos.map((c, i) => (
                                        <TableRow key={c.co_fat_cidadao_pec ?? i} hover>
                                            <TableCell sx={{ fontSize: 11, color: 'var(--lg-text-muted)' }}>
                                                {(page * 50) + i + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {c.nome ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                                {c.cpf
                                                    ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                                                    : '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                                {c.cns ?? '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12 }}>
                                                {c.idade != null ? `${c.idade} a` : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap>{c.no_equipe ?? '—'}</Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                                    {c.nu_ine}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap>{c.agente ?? '—'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {CHIP_CONDICOES.map(({ key, label, cor }) =>
                                                        // eslint-disable-next-line eqeqeq
                                                        c[key] == 1 ? (
                                                            <Chip key={key} label={label} size="small"
                                                                sx={{
                                                                    bgcolor: cor + '22',
                                                                    color: cor,
                                                                    fontWeight: 700,
                                                                    fontSize: 10,
                                                                }} />
                                                        ) : null
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {cidadaos.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center"
                                                sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                Nenhum cidadão encontrado com os filtros aplicados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    )}

                    <TablePagination
                        component="div"
                        count={meta.total}
                        page={page}
                        rowsPerPage={50}
                        rowsPerPageOptions={[50]}
                        onPageChange={handlePageChange}
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}–${to} de ${count.toLocaleString('pt-BR')}`}
                    />
                </CardContent>
            </Card>
        </Box>
    );
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="CidadaosPage" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/monitor-aps/CidadaosPage.js \
        src/components/monitor-aps/__tests__/CidadaosPage.test.js
git commit -m "feat(cidadaos): CidadaosPage — filtros, tabela paginada, chips de condições"
```

---

### Task 10: `pages/monitor-aps/cidadaos.js` + item "Cidadãos" no menu lateral

**Files:**
- Create: `pages/monitor-aps/cidadaos.js`
- Modify: `src/layouts/sidebar/MenuItems.js:110`

- [ ] **Step 1: Write the failing test**

```js
// pages/monitor-aps/__tests__/cidadaos.page.test.js
it('cidadaos.js exports a React component', () => {
    const mod = require('../cidadaos');
    expect(typeof mod.default).toBe('function');
});

it('MenuItems contains Cidadaos entry in Monitor APS group', () => {
    const items = require('../../../src/layouts/sidebar/MenuItems').default;
    const apsGroup = items.find(g => g.title === 'Monitor APS');
    expect(apsGroup).toBeDefined();
    const cidadaosItem = apsGroup.children.find(c => c.href === '/monitor-aps/cidadaos');
    expect(cidadaosItem).toBeDefined();
    expect(cidadaosItem.title).toBe('Cidadãos');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="cidadaos.page" --watchAll=false`
Expected: FAIL — módulo não encontrado

- [ ] **Step 3: Criar `pages/monitor-aps/cidadaos.js`**

```js
import CidadaosPage from '../../src/components/monitor-aps/CidadaosPage';

export default CidadaosPage;
```

- [ ] **Step 4: Atualizar `src/layouts/sidebar/MenuItems.js`**

No grupo `Monitor APS` (~linhas 100–113), adicionar após `"Evolução Anual"` (linha 110) e antes de `"Configuracoes APS"` (linha 111):

```js
{ title: "Cidadãos",          icon: "users",        href: "/monitor-aps/cidadaos" },
```

O array `children` do grupo Monitor APS fica:

```js
children: [
  { title: "Dashboard",           icon: "bar-chart-2",  href: "/monitor-aps" },
  { title: "Vinculo Territorial", icon: "map-pin",      href: "/monitor-aps/vinculo" },
  { title: "Indicadores",         icon: "check-circle", href: "/monitor-aps/qualidade" },
  { title: "Por Equipe",          icon: "users",        href: "/monitor-aps/equipe" },
  { title: "Visitas ACS/TACS",    icon: "home",         href: "/monitor-aps/visitas" },
  { title: "Mapa de Visitas",     icon: "map",          href: "/monitor-aps/visitas/mapa" },
  { title: "Evolução Anual",      icon: "trending-up",  href: "/monitor-aps/visitas/evolucao" },
  { title: "Cidadãos",            icon: "users",        href: "/monitor-aps/cidadaos" },
  { title: "Configuracoes APS",   icon: "settings",     href: "/monitor-aps/configuracoes", profile: ["admin"] },
],
```

- [ ] **Step 5: Run tests**

Run: `npm test -- --testPathPattern="cidadaos.page" --watchAll=false`
Expected: PASS

- [ ] **Step 6: Rodar suite completa**

Run backend: `./vendor/bin/phpunit`
Run frontend: `npm test -- --watchAll=false`
Expected: Todos passando

- [ ] **Step 7: Commit final**

```bash
git add pages/monitor-aps/cidadaos.js \
        src/layouts/sidebar/MenuItems.js \
        pages/monitor-aps/__tests__/cidadaos.page.test.js
git commit -m "feat(cidadaos): page wrapper + item Cidadãos no menu Monitor APS"
```

---

## Self-Review

### Spec Coverage

| Requisito | Task |
|-----------|------|
| Bug 1 — remover input CNES em FilaEsus | Task 3 |
| Bug 2 — "Erro ao consultar" em PainelEsus | Task 1 |
| Bug 3 — filtro busca no mapa não funciona | Task 4 |
| Bug 4 — filtros não aplicados ao mapa | Task 5 |
| Novo endpoint GET /painel-esus/unidades | Task 1, 1b |
| painelEsusApi.unidades() | Task 2 |
| Card: cidadãos cadastrados por agente | Tasks 6, 7 |
| Página /monitor-aps/cidadaos | Tasks 8, 9, 10 |
| Menu lateral — item Cidadãos | Task 10 |
| resolveUnidadeColumns() em validarCnes e estado | Task 1 |
| firstExistingColumn() em CidadaoAcsController | Task 8 |
| Paginação server-side 50/página | Task 9 |
| Chips coloridos de condições | Task 9 |
| Agente Select desabilitado sem equipe | Task 9 |
| Debounce 400ms / mín. 3 chars no busca | Task 9 |

### Consistency Check

- `resolveUnidadeColumns()` usada em `validarCnes()`, `estado()` e `unidades()` — ✓ Task 1
- `firstExistingColumn()` usada em `mapa()` (Task 4) e `CidadaoAcsController` (Task 8) — ✓
- Rota `/responsabilidade` adicionada ANTES de `/{id}` (evita conflito de rota catch-all) — ✓ Task 6
- Import de `CidadaoAcsController` adicionado em `api.php` — ✓ Task 8
- `colSpan` da aba Por Agente atualizado de 11 para 12 — ✓ Task 7
