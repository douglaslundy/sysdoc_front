# Modo Comparação — Visitas ACS Evolução: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um modo de comparação à página `/monitor-aps/visitas/evolucao` que permite selecionar um ano e dois vetores de filtros combinados, exibindo uma linha por vetor no gráfico existente.

**Architecture:** Abordagem A — duas requisições paralelas. O backend ganha parâmetro `?ano` no endpoint `/visitas/evolucao` já existente e um novo endpoint `/visitas/evolucao/anos`. O frontend faz `Promise.all` com os filtros dos dois vetores e mescla os resultados em 2 séries no ApexChart existente.

**Tech Stack:** Laravel 10 (PHP 8.1), Next.js 12, React 17, MUI v5, ApexCharts (react-apexcharts)

**Spec:** `docs/superpowers/specs/2026-05-29-modo-comparacao-visitas-evolucao-design.md`

---

## File Map

| Ação | Arquivo |
|------|---------|
| Modify | `sysdoc_back/routes/api.php` |
| Modify | `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` |
| Create | `sysdoc_front/src/components/monitor-aps/VetorPanel.js` |
| Modify | `sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js` |

---

### Task 1: Backend — endpoint `GET /visitas/evolucao/anos`

**Files:**
- Modify: `sysdoc_back/routes/api.php` (linha 147)
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` (antes de `evolucao()`)

- [ ] **Step 1: Registrar rota `/evolucao/anos` antes de `/evolucao`**

Em `sysdoc_back/routes/api.php`, substituir a linha 147:
```php
// ANTES:
Route::get('/evolucao', [VisitaAcsController::class, 'evolucao']);

// DEPOIS:
Route::get('/evolucao/anos', [VisitaAcsController::class, 'anosDisponiveis']);
Route::get('/evolucao', [VisitaAcsController::class, 'evolucao']);
```
⚠️ Ordem crítica: no Laravel, `/evolucao/anos` deve estar antes de `/evolucao`, caso contrário "anos" seria tratado como parâmetro dinâmico de outra rota.

- [ ] **Step 2: Implementar `anosDisponiveis()` em `VisitaAcsController.php`**

Inserir o método imediatamente acima do docblock de `evolucao()` (linha ~1743):

```php
/**
 * GET /visitas/evolucao/anos
 * Retorna os anos distintos que possuem visitas registradas no eSUS PEC,
 * respeitando os filtros de unidade/CNES do contexto autenticado.
 */
public function anosDisponiveis(): JsonResponse
{
    [$where, $params] = $this->buildWhereFilters(null, null, null, null);

    $sql = "
        SELECT DISTINCT t.nu_ano AS ano
        FROM tb_fat_visita_domiciliar v
        {$this->baseJoins()}
        WHERE {$where}
        ORDER BY ano DESC
    ";

    try {
        $rows = $this->db()->select($sql, $params);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('VisitaAcs.anosDisponiveis: ' . $e->getMessage());
        return response()->json(['error' => 'Não foi possível consultar o banco eSUS PEC.'], 503);
    }

    return response()->json([
        'anos' => array_map(fn($r) => (int) $r->ano, $rows),
    ]);
}
```

- [ ] **Step 3: Testar o novo endpoint**

Com o servidor rodando (`php artisan serve`), executar:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitor-aps/visitas/evolucao/anos
```

Saída esperada:
```json
{ "anos": [2025, 2024, 2023] }
```

- [ ] **Step 4: Commit**

```bash
git add sysdoc_back/routes/api.php sysdoc_back/app/Http/Controllers/VisitaAcsController.php
git commit -m "feat: endpoint GET /visitas/evolucao/anos retorna anos com dados no banco"
```

---

### Task 2: Backend — parâmetro `?ano` em `evolucao()`

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

- [ ] **Step 1: Adicionar `ano` à validação em `evolucao()`**

Substituir o bloco `validate` existente no início de `evolucao()`:

```php
// ANTES:
$request->validate([
    'ine'      => 'nullable|string',
    'agente'   => 'nullable|string',
    'desfecho' => 'nullable|integer|in:1,2,3',
    'has_geo'  => 'nullable|string|in:sim,nao',
]);

// DEPOIS:
$request->validate([
    'ine'      => 'nullable|string',
    'agente'   => 'nullable|string',
    'desfecho' => 'nullable|integer|in:1,2,3',
    'has_geo'  => 'nullable|string|in:sim,nao',
    'ano'      => 'nullable|integer|min:2000|max:2099',
]);
```

- [ ] **Step 2: Condicionar derivação de `$anos`**

Substituir as duas linhas abaixo do validate:

```php
// ANTES:
$anoAtual = (int) date('Y');
$anos = [$anoAtual, $anoAtual - 1, $anoAtual - 2];

// DEPOIS:
$anoAtual = (int) date('Y');
$anos = $request->ano
    ? [(int) $request->ano]
    : [$anoAtual, $anoAtual - 1, $anoAtual - 2];
```

O restante do método não precisa mudar. `$anos` já é array — o loop `array_map` e o `IN ({$placeholders})` funcionam igual para 1 ou 3 anos.

- [ ] **Step 3: Testar retrocompatibilidade (sem `?ano`)**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/monitor-aps/visitas/evolucao"
```

Esperado: `{ "series": [{"ano":2025,...}, {"ano":2024,...}, {"ano":2023,...}] }` — 3 séries.

- [ ] **Step 4: Testar com `?ano=2024`**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/monitor-aps/visitas/evolucao?ano=2024"
```

Esperado: `{ "series": [{"ano":2024,"meses":[...]}] }` — exatamente 1 série.

- [ ] **Step 5: Commit**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php
git commit -m "feat: evolucao() aceita parâmetro ?ano opcional para retornar série de um único ano"
```

---

### Task 3: Frontend — componente `VetorPanel`

**Files:**
- Create: `sysdoc_front/src/components/monitor-aps/VetorPanel.js`

- [ ] **Step 1: Criar `VetorPanel.js`**

```jsx
// sysdoc_front/src/components/monitor-aps/VetorPanel.js
import { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Typography } from '@mui/material';
import { monitorApsApi } from '../../services/monitorApsApi';

/**
 * Props:
 *   label     {string}   — "Vetor 1" | "Vetor 2"
 *   equipes   {array}    — lista de equipes do endpoint /config/equipes
 *   vetor     {object}   — { ine, agente, desfecho, geo }
 *   onChange  {function} — (novoVetor, nomeEquipe) => void
 */
export default function VetorPanel({ label, equipes, vetor, onChange }) {
    const [agentesOpcoes, setAgentesOpcoes] = useState([]);
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    useEffect(() => {
        if (!vetor.ine) { setAgentesOpcoes([]); return; }
        const params = new URLSearchParams({ ano: anoAtual, mes: mesAtual, ine: vetor.ine });
        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => setAgentesOpcoes(d.agentes ?? []))
            .catch(() => setAgentesOpcoes([]));
    }, [vetor.ine, anoAtual, mesAtual]);

    function update(field, value) {
        const updates = { [field]: value };
        if (field === 'ine') updates.agente = '';
        const newVetor = { ...vetor, ...updates };
        const nomeEquipeFull = equipes.find(e => e.nu_ine === newVetor.ine)?.no_equipe ?? '';
        const nomeEquipe = nomeEquipeFull.split(' - ').slice(1).join(' - ').trim() || nomeEquipeFull;
        onChange(newVetor, nomeEquipe);
    }

    return (
        <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 260 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>{label}</Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
                <FormControl size="small" fullWidth>
                    <InputLabel>Equipe</InputLabel>
                    <Select label="Equipe" value={vetor.ine}
                        onChange={e => update('ine', e.target.value)}>
                        <MenuItem value="">Todas as equipes</MenuItem>
                        {equipes.map(eq => (
                            <MenuItem key={eq.nu_ine} value={eq.nu_ine}>
                                {eq.no_equipe?.split(' - ').slice(1).join(' - ').trim() || eq.no_equipe}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {vetor.ine && (
                    <FormControl size="small" fullWidth>
                        <InputLabel>Agente</InputLabel>
                        <Select label="Agente" value={vetor.agente}
                            onChange={e => update('agente', e.target.value)}>
                            <MenuItem value="">Todos os agentes</MenuItem>
                            {agentesOpcoes.map((a, i) => (
                                <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <FormControl size="small" fullWidth>
                    <InputLabel>Desfecho</InputLabel>
                    <Select label="Desfecho" value={vetor.desfecho}
                        onChange={e => update('desfecho', e.target.value)}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="1">Realizada</MenuItem>
                        <MenuItem value="2">Recusada</MenuItem>
                        <MenuItem value="3">Ausente</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                    <InputLabel>Geolocalização</InputLabel>
                    <Select label="Geolocalização" value={vetor.geo}
                        onChange={e => update('geo', e.target.value)}>
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="sim">Com geolocalização</MenuItem>
                        <MenuItem value="nao">Sem geolocalização</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Paper>
    );
}
```

- [ ] **Step 2: Verificar que o arquivo existe**

```bash
ls sysdoc_front/src/components/monitor-aps/VetorPanel.js
```

- [ ] **Step 3: Commit**

```bash
git add sysdoc_front/src/components/monitor-aps/VetorPanel.js
git commit -m "feat: componente VetorPanel com filtros equipe/agente/desfecho/geo"
```

---

### Task 4: Frontend — estado, toggle e painel de comparação em `VisitasEvolucao`

**Files:**
- Modify: `sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js`

- [ ] **Step 1: Atualizar imports**

Substituir o bloco de imports do MUI (linhas 4-7) por:

```js
import {
    Box, Button, CircularProgress, FormControl, InputLabel,
    MenuItem, Select, Typography,
} from '@mui/material';
import VetorPanel from './VetorPanel';
```

- [ ] **Step 2: Adicionar constantes auxiliares após `CORES`**

Logo após `const CORES = ['#1351B4', '#168821', '#FF8C00'];`, inserir:

```js
const DESFECHO_LABELS = { '1': 'Realizada', '2': 'Recusada', '3': 'Ausente' };
const GEO_LABELS      = { 'sim': 'Com geo', 'nao': 'Sem geo' };
const VETOR_VAZIO     = { ine: '', agente: '', desfecho: '', geo: '' };

function labelVetor(vetor, nomeEquipe, fallback) {
    const partes = [];
    if (vetor.ine)      partes.push(nomeEquipe || 'Equipe');
    if (vetor.agente)   partes.push(vetor.agente);
    if (vetor.desfecho) partes.push(DESFECHO_LABELS[vetor.desfecho]);
    if (vetor.geo)      partes.push(GEO_LABELS[vetor.geo]);
    return partes.length ? partes.join(' · ') : fallback;
}

function vetorConfigurado(v) {
    return !!(v.ine || v.agente || v.desfecho || v.geo);
}
```

- [ ] **Step 3: Adicionar estados de comparação dentro do componente**

Logo após `const ctrlRef = useRef(null);` (linha 42), inserir:

```js
// ── modo comparação ──────────────────────────────────────────────
const [modoComparacao,  setModoComparacao]  = useState(false);
const [anosDisponiveis, setAnosDisponiveis] = useState([]);
const [anoComparacao,   setAnoComparacao]   = useState('');
const [vetor1,          setVetor1]          = useState(VETOR_VAZIO);
const [nomeEquipe1,     setNomeEquipe1]     = useState('');
const [vetor2,          setVetor2]          = useState(VETOR_VAZIO);
const [nomeEquipe2,     setNomeEquipe2]     = useState('');
const [seriesComp,      setSeriesComp]      = useState([]);
const [loadingComp,     setLoadingComp]     = useState(false);
const [erroComp,        setErroComp]        = useState(null);
```

- [ ] **Step 4: Adicionar handlers de ativação/desativação após os `useEffect` existentes**

Inserir antes de `const chartSeries = useMemo(...)`:

```js
function ativarComparacao() {
    setModoComparacao(true);
    setAnoComparacao('');
    setVetor1(VETOR_VAZIO); setNomeEquipe1('');
    setVetor2(VETOR_VAZIO); setNomeEquipe2('');
    setSeriesComp([]); setErroComp(null);

    monitorApsApi.get('/visitas/evolucao/anos')
        .then(d => setAnosDisponiveis(d.anos ?? []))
        .catch(() => setAnosDisponiveis([]));
}

function desativarComparacao() {
    setModoComparacao(false);
    setSeriesComp([]);
    setErroComp(null);
}

async function handleComparar() {
    setLoadingComp(true);
    setErroComp(null);
    setSeriesComp([]);

    const buildParams = (v) => {
        const p = new URLSearchParams({ ano: anoComparacao });
        if (v.ine)      p.set('ine',      v.ine);
        if (v.agente)   p.set('agente',   v.agente);
        if (v.desfecho) p.set('desfecho', v.desfecho);
        if (v.geo)      p.set('has_geo',  v.geo);
        return p.toString();
    };

    const fetchVetor = async (v, cacheKey) => {
        const cached = getCached(cacheKey);
        if (cached) return cached;
        const data = await monitorApsApi.get(`/visitas/evolucao?${buildParams(v)}`);
        setCached(cacheKey, data);
        return data;
    };

    const keyV1 = `visitas_evolucao_cmp_${anoComparacao}_${vetor1.ine}_${vetor1.agente}_${vetor1.desfecho}_${vetor1.geo}`;
    const keyV2 = `visitas_evolucao_cmp_${anoComparacao}_${vetor2.ine}_${vetor2.agente}_${vetor2.desfecho}_${vetor2.geo}`;

    try {
        const [res1, res2] = await Promise.all([
            fetchVetor(vetor1, keyV1),
            fetchVetor(vetor2, keyV2),
        ]);

        setSeriesComp([
            {
                name:  labelVetor(vetor1, nomeEquipe1, 'Vetor 1'),
                data:  res1.series?.[0]?.meses ?? Array(12).fill(0),
                color: CORES[0],
            },
            {
                name:  labelVetor(vetor2, nomeEquipe2, 'Vetor 2'),
                data:  res2.series?.[0]?.meses ?? Array(12).fill(0),
                color: CORES[1],
            },
        ]);
    } catch (e) {
        setErroComp(e.message ?? 'Erro ao comparar vetores.');
    } finally {
        setLoadingComp(false);
    }
}
```

- [ ] **Step 5: Adicionar botão "Comparar" ao cabeçalho**

Dentro do `<Box display="flex" alignItems="center" gap={1.5}>` que contém o botão PDF (linha ~132), adicionar o botão logo após o botão de impressão:

```jsx
<Button
    variant={modoComparacao ? 'contained' : 'outlined'}
    size="small"
    color="primary"
    onClick={modoComparacao ? desativarComparacao : ativarComparacao}
    startIcon={<FeatherIcon icon="git-compare" width={15} height={15} />}
    sx={{ textTransform: 'none', borderRadius: 1.5, whiteSpace: 'nowrap' }}
>
    {modoComparacao ? 'Sair da comparação' : 'Comparar'}
</Button>
```

- [ ] **Step 6: Tornar os filtros existentes condicionais**

O `<Box display="flex" gap={1.5} flexWrap="wrap">` que contém os 4 dropdowns (equipe, agente, desfecho, geo) deve renderizar apenas fora do modo comparação. Envolver com:

```jsx
{!modoComparacao && (
    <Box display="flex" gap={1.5} flexWrap="wrap">
        {/* ... dropdowns existentes sem alteração ... */}
    </Box>
)}
```

- [ ] **Step 7: Adicionar o painel de comparação após o bloco condicional dos filtros**

Após o `{!modoComparacao && (...)}`, inserir:

```jsx
{modoComparacao && (
    <Box mt={2}>
        {/* Seletor de Ano */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Ano</InputLabel>
                <Select label="Ano" value={anoComparacao}
                    onChange={e => setAnoComparacao(e.target.value)}>
                    <MenuItem value="">Selecione o ano</MenuItem>
                    {anosDisponiveis.map(a => (
                        <MenuItem key={a} value={String(a)}>{a}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            {anosDisponiveis.length === 0 && (
                <Typography variant="caption" color="textSecondary">
                    Carregando anos disponíveis...
                </Typography>
            )}
        </Box>

        {/* Dois vetores lado a lado */}
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
            <VetorPanel
                label="Vetor 1"
                equipes={equipes}
                vetor={vetor1}
                onChange={(v, ne) => { setVetor1(v); setNomeEquipe1(ne); }}
            />
            <VetorPanel
                label="Vetor 2"
                equipes={equipes}
                vetor={vetor2}
                onChange={(v, ne) => { setVetor2(v); setNomeEquipe2(ne); }}
            />
        </Box>

        {/* Botão Comparar */}
        <Box display="flex" justifyContent="center">
            <Button
                variant="contained"
                size="medium"
                disabled={
                    !anoComparacao ||
                    !vetorConfigurado(vetor1) ||
                    !vetorConfigurado(vetor2) ||
                    loadingComp
                }
                onClick={handleComparar}
                startIcon={
                    loadingComp
                        ? <CircularProgress size={14} color="inherit" />
                        : <FeatherIcon icon="bar-chart-2" width={15} height={15} />
                }
                sx={{ textTransform: 'none', borderRadius: 1.5, px: 4 }}
            >
                {loadingComp ? 'Comparando...' : 'Comparar'}
            </Button>
        </Box>
    </Box>
)}
```

- [ ] **Step 8: Tornar o `<BaseCard>` condicional**

Substituir o `<BaseCard title={...}>` existente (linha ~193 até o fim do return) por:

```jsx
{modoComparacao ? (
    <BaseCard title={`Comparação de Vetores — ${anoComparacao || '...'}`}>
        {loadingComp ? (
            <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
            </Box>
        ) : erroComp ? (
            <Box p={3}>
                <Typography color="error">Erro: {erroComp}</Typography>
            </Box>
        ) : seriesComp.length === 0 ? (
            <Box p={3} textAlign="center">
                <Typography color="textSecondary">
                    Configure os dois vetores e clique em Comparar.
                </Typography>
            </Box>
        ) : (
            <Chart type="line" height={420}
                options={{
                    ...chartOptions,
                    colors: [CORES[0], CORES[1]],
                    chart: { ...chartOptions.chart, id: 'visitas-comparacao-chart' },
                }}
                series={seriesComp}
            />
        )}
    </BaseCard>
) : (
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
)}
```

- [ ] **Step 9: Verificar no dev server**

```bash
cd sysdoc_front && npm run dev
```

Acessar `http://localhost:3000/monitor-aps/visitas/evolucao` e verificar:
- Botão "Comparar" aparece no cabeçalho
- Ao clicar, a view muda — filtros normais somem, painel de comparação aparece
- O seletor Ano lista os anos reais do banco
- Vetor 1 e Vetor 2 aparecem lado a lado com seus 4 dropdowns cada
- O Agente só aparece dentro de um vetor após selecionar uma Equipe naquele vetor
- Botão "Comparar" (dentro do painel) fica desabilitado se faltam ano ou filtros
- Ao clicar "Comparar", o gráfico exibe 2 linhas com labels automáticos
- Clicar "Sair da comparação" restaura a view de 3 anos sem filtros

- [ ] **Step 10: Commit**

```bash
git add sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js
git commit -m "feat: modo comparação completo — painel, fetch paralelo e gráfico de 2 vetores"
```

---

## Self-review

**Cobertura da spec:**
- ✅ Botão toggle ativa/desativa modo comparação
- ✅ Modo substitui completamente a view atual (filtros normais somem)
- ✅ Ano obrigatório, carregado dinamicamente do banco
- ✅ Dois vetores com equipe, agente (condicional), desfecho, geo
- ✅ Filtros combinados dentro de cada vetor
- ✅ Pré-condição: ano + ao menos 1 filtro em cada vetor
- ✅ Gráfico exibe 2 linhas ao completar a comparação
- ✅ Labels automáticos dos filtros ativos (equipe sem prefixo CNES, agente por nome)
- ✅ Sair da comparação restaura estado padrão (3 anos, sem filtros)
- ✅ Rota `/evolucao/anos` registrada antes de `/evolucao` (ordem crítica no Laravel)
- ✅ Cache com prefixo `cmp` — não colide com cache da view normal
- ✅ `evolucao()` retrocompatível (sem `?ano` → 3 séries, com `?ano` → 1 série)

**Consistência de nomes:**
- `labelVetor(vetor, nomeEquipe, fallback)` — assinatura idêntica em Task 4 (definição) e Task 4 Step 4 (uso em `handleComparar`)
- `VETOR_VAZIO` — usado em Step 3 (init) e Step 4 (reset) da mesma task
- `vetorConfigurado(v)` — definida em Task 4 Step 2, usada em Task 4 Step 7
- `seriesComp` — array de `{ name, data, color }`, consumido diretamente pelo ApexChart em Task 4 Step 8 (sem passar por `buildChartSeries`, que é para a view normal)
