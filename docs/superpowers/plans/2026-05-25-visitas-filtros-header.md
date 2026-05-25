# Filtros no Header + Cards Reativos — Monitor APS Visitas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover os filtros Agente/Desfecho/Geolocalização para o header da página `/monitor-aps/visitas`, adicionar card Ausentes, e fazer os cards + aba "Por Agente" reagirem a todos os filtros.

**Architecture:** Backend: `buildWhere` ganha params opcionais `$desfecho` e `$hasGeo`; endpoints `resumo` e `agentes` aceitam os novos filtros. Frontend: dois estados separados — `agenteOpcoes` (para popular o select, sempre sem filtro) e `agentes` (para a aba, filtrado); `resumo` passa a depender dos três filtros.

**Tech Stack:** Laravel 10 (PHP 8.1), Next.js 12, MUI v5, Feather Icons.

---

## Arquivos alterados

| Arquivo | O que muda |
|---|---|
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | `buildWhere` + `resumo` + `agentes` |
| `sysdoc_front/src/components/monitor-aps/VisitasAcs.js` | 5 cards, filtros no header, novos useEffects |

---

## Task 1: Backend — estender `buildWhere`

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php:29-46`

- [ ] **Substituir a assinatura e corpo de `buildWhere`**

Localizar o método (linha ~29) e substituir integralmente:

```php
private function buildWhere(
    int $ano, int $mes, ?string $ine,
    ?string $agentName = null,
    ?string $desfecho  = null,
    ?string $hasGeo    = null
): array {
    $cbos   = implode("','", self::ACS_CBOS);
    $where  = "c.nu_cbo IN ('{$cbos}') AND t.nu_ano = ? AND t.nu_mes = ?";
    $params = [$ano, $mes];

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

> Os dois novos parâmetros são opcionais e ficam ao final — todas as chamadas existentes (`index`, `lista`, `mapa`) continuam sem alteração porque passam apenas os parâmetros posicionais anteriores.

- [ ] **Verificar que nenhum chamador quebrou**

Confirmar que todas as chamadas existentes de `buildWhere` no arquivo continuam com no máximo 4 args (sem `$desfecho`/`$hasGeo`). Grep rápido:

```bash
grep -n "buildWhere" sysdoc_back/app/Http/Controllers/VisitaAcsController.php
```

Esperado: todas as linhas resultantes usam `$this->buildWhere($ano, $mes, ...)` — nenhuma vai quebrar.

---

## Task 2: Backend — estender endpoint `resumo`

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php:305-339`

- [ ] **Substituir a validação e a chamada a `buildWhere` em `resumo`**

Localizar o método `public function resumo` e aplicar dois edits cirúrgicos:

**Edit 1 — validação** (substituir o bloco `$request->validate`):

```php
$request->validate([
    'ano'      => 'required|integer|min:2020|max:2030',
    'mes'      => 'required|integer|min:1|max:12',
    'ine'      => 'nullable|string',
    'agente'   => 'nullable|string',
    'desfecho' => 'nullable|integer|in:1,2,3',
    'has_geo'  => 'nullable|string|in:sim,nao',
]);
```

**Edit 2 — chamada a `buildWhere`** (substituir a linha `[$where, $params] = ...`):

```php
[$where, $params] = $this->buildWhere(
    $ano, $mes, $request->ine,
    $request->agente,
    $request->desfecho,
    $request->has_geo,
);
```

- [ ] **Testar manualmente via curl (ou Postman)**

```bash
curl "http://localhost:8000/api/monitor-aps/visitas/resumo?ano=2026&mes=4&agente=NOME_AGENTE" \
  -H "Authorization: Bearer SEU_TOKEN"
```

Esperado: JSON com `totais` mostrando apenas visitas daquele agente.

```bash
curl "http://localhost:8000/api/monitor-aps/visitas/resumo?ano=2026&mes=4&desfecho=1" \
  -H "Authorization: Bearer SEU_TOKEN"
```

Esperado: `totais.realizadas` == `totais.total` (só visitas realizadas).

---

## Task 3: Backend — estender endpoint `agentes`

**Files:**
- Modify: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php:789-835`

- [ ] **Substituir a validação e a chamada a `buildWhere` em `agentes`**

Localizar o método `public function agentes` e aplicar dois edits:

**Edit 1 — validação**:

```php
$request->validate([
    'ano'     => 'required|integer|min:2020|max:2030',
    'mes'     => 'required|integer|min:1|max:12',
    'ine'     => 'nullable|string',
    'agente'  => 'nullable|string',
    'has_geo' => 'nullable|string|in:sim,nao',
]);
```

**Edit 2 — chamada a `buildWhere`** (nota: passa `null` para `$desfecho` — desfecho não filtra esta aba):

```php
[$where, $params] = $this->buildWhere(
    $ano, $mes, $request->ine,
    $request->agente,
    null,
    $request->has_geo,
);
```

- [ ] **Testar manualmente**

```bash
curl "http://localhost:8000/api/monitor-aps/visitas/agentes?ano=2026&mes=4&agente=NOME_AGENTE" \
  -H "Authorization: Bearer SEU_TOKEN"
```

Esperado: array `agentes` com apenas uma entrada — o agente filtrado.

```bash
curl "http://localhost:8000/api/monitor-aps/visitas/agentes?ano=2026&mes=4&has_geo=sim" \
  -H "Authorization: Bearer SEU_TOKEN"
```

Esperado: totais por agente contando apenas visitas com geolocalização.

---

## Task 4: Commit backend

- [ ] **Commit das mudanças de backend**

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php
git commit -m "feat(monitor-aps): filtros agente/desfecho/geo em resumo e agentes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Frontend — separar `agenteOpcoes` de `agentes`

**Files:**
- Modify: `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

**Contexto:** O select Agente no header precisa listar sempre todos os agentes do período (sem filtro). O estado `agentes` passará a ser filtrado por `filtroAgente` + `filtroGeo` para a aba "Por Agente". Por isso, adicionamos `agenteOpcoes` — um estado separado que nunca é filtrado.

- [ ] **Adicionar estado `agenteOpcoes`**

Logo após a linha `const [agentes, setAgentes] = useState([]);` (linha ~79), inserir:

```js
const [agenteOpcoes, setAgenteOpcoes] = useState([]);
```

- [ ] **Adicionar useEffect para carregar `agenteOpcoes`**

Inserir **antes** do useEffect existente dos agentes. Este efeito não tem cache (as opções são leves e raramente mudam):

```js
// Opções do select Agente — sempre sem filtros adicionais
useEffect(() => {
    const params = new URLSearchParams({ ano, mes });
    if (ine) params.set('ine', ine);
    const ctrl = new AbortController();
    monitorApsApi.get(`/visitas/agentes?${params}`, { signal: ctrl.signal })
        .then(d => setAgenteOpcoes(d.agentes ?? []))
        .catch(() => {});
    return () => ctrl.abort();
}, [ano, mes, ine]);
```

- [ ] **Atualizar o useEffect existente de `agentes` para aceitar filtros**

Substituir o useEffect que começa em `// Carrega estatísticas por agente` pela versão que aceita `filtroAgente` e `filtroGeo`:

```js
// Carrega estatísticas por agente (filtrado para a aba "Por Agente")
useEffect(() => {
    const params = new URLSearchParams({ ano, mes });
    if (ine)          params.set('ine', ine);
    if (filtroAgente) params.set('agente', filtroAgente);
    if (filtroGeo)    params.set('has_geo', filtroGeo);
    const key = `visitas_agentes_${params}`;
    const cached = getCached(key);
    if (cached) { setAgentes(cached.agentes ?? []); return; }

    const ctrl = new AbortController();
    monitorApsApi.get(`/visitas/agentes?${params}`, { signal: ctrl.signal })
        .then(d => { setCached(key, d); setAgentes(d.agentes ?? []); })
        .catch(() => {});
    return () => ctrl.abort();
}, [ano, mes, ine, filtroAgente, filtroGeo]);
```

---

## Task 6: Frontend — 5 cards de métricas

**Files:**
- Modify: `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

- [ ] **Substituir o bloco `<Grid container>` dos cards**

Localizar o bloco que começa em `{/* Cards de métricas */}` e substituir integralmente:

```jsx
{/* Cards de métricas */}
<Grid container spacing={2} mb={3}>
    <Grid item xs={6} sm={true}>
        <MetricCard icon="map-pin" titulo="Total de Visitas"
            valor={totais.total.toLocaleString('pt-BR')} cor="#1351B4" />
    </Grid>
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
    <Grid item xs={6} sm={true}>
        <MetricCard icon="users" titulo="Cidadãos Distintos"
            valor={totais.cidadaos.toLocaleString('pt-BR')} cor="#7B2D8B" />
    </Grid>
</Grid>
```

> `sm={true}` distribui os 5 cards igualmente em telas ≥ 600 px. Em mobile (xs=6) ficam 2 por linha, com o quinto centralizado.

---

## Task 7: Frontend — filtros no header + reset de `filtroAgente`

**Files:**
- Modify: `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

- [ ] **Adicionar useEffect que reseta `filtroAgente` ao mudar equipe/ano/mês**

Inserir logo após o useEffect de `agenteOpcoes` (Task 5):

```js
useEffect(() => {
    setFiltroAgente('');
}, [ine, ano, mes]);
```

- [ ] **Adicionar os 3 selects ao header**

Localizar o `<Box display="flex" gap={1.5} flexWrap="wrap">` dentro do header (o que contém os selects Equipe, Ano, Mês). Inserir os três novos `FormControl` **depois** do select de Mês, ainda dentro desse `Box`:

```jsx
<FormControl size="small" sx={{ minWidth: 160 }}>
    <InputLabel>Agente</InputLabel>
    <Select label="Agente" value={filtroAgente}
        onChange={e => { setFiltroAgente(e.target.value); setPage(0); }}>
        <MenuItem value="">Todos os agentes</MenuItem>
        {agenteOpcoes.map((a, i) => (
            <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
        ))}
    </Select>
</FormControl>
<FormControl size="small" sx={{ minWidth: 140 }}>
    <InputLabel>Desfecho</InputLabel>
    <Select label="Desfecho" value={filtroDesfecho}
        onChange={e => { setFiltroDesfecho(e.target.value); setPage(0); }}>
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value="1">Realizada</MenuItem>
        <MenuItem value="2">Recusada</MenuItem>
        <MenuItem value="3">Ausente</MenuItem>
    </Select>
</FormControl>
<FormControl size="small" sx={{ minWidth: 170 }}>
    <InputLabel>Geolocalização</InputLabel>
    <Select label="Geolocalização" value={filtroGeo}
        onChange={e => { setFiltroGeo(e.target.value); setPage(0); }}>
        <MenuItem value="">Todas</MenuItem>
        <MenuItem value="sim">Com geolocalização</MenuItem>
        <MenuItem value="nao">Sem geolocalização</MenuItem>
    </Select>
</FormControl>
```

---

## Task 8: Frontend — atualizar useEffect do `resumo`

**Files:**
- Modify: `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

- [ ] **Substituir o useEffect que começa em `// Carrega resumo`**

```js
// Carrega resumo
useEffect(() => {
    const params = new URLSearchParams({ ano, mes });
    if (ine)            params.set('ine', ine);
    if (filtroAgente)   params.set('agente', filtroAgente);
    if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
    if (filtroGeo)      params.set('has_geo', filtroGeo);
    const key = `visitas_resumo_${params}`;
    const cached = getCached(key);
    if (cached) { setResumo(cached); return; }

    const ctrl = new AbortController();
    monitorApsApi.get(`/visitas/resumo?${params}`, { signal: ctrl.signal })
        .then(d => { setCached(key, d); setResumo(d); })
        .catch(() => {});
    return () => ctrl.abort();
}, [ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);
```

---

## Task 9: Frontend — remover filtros inline da aba Tabela

**Files:**
- Modify: `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

- [ ] **Remover o bloco de filtros inline dentro do CardContent da aba Tabela**

Localizar e deletar o trecho abaixo (que começa logo depois de `{/* Filtros inline da tabela */}`):

```jsx
{/* Filtros inline da tabela */}
<Box display="flex" gap={1.5} mb={2} flexWrap="wrap">
    <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Agente</InputLabel>
        <Select label="Agente" value={filtroAgente}
            onChange={e => { setFiltroAgente(e.target.value); setPage(0); }}>
            <MenuItem value="">Todos os agentes</MenuItem>
            {agentes.map((a, i) => (
                <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
            ))}
        </Select>
    </FormControl>
    <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Desfecho</InputLabel>
        <Select label="Desfecho" value={filtroDesfecho}
            onChange={e => { setFiltroDesfecho(e.target.value); setPage(0); }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="1">Realizada</MenuItem>
            <MenuItem value="2">Recusada</MenuItem>
            <MenuItem value="3">Ausente</MenuItem>
        </Select>
    </FormControl>
    <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Geolocalização</InputLabel>
        <Select label="Geolocalização" value={filtroGeo}
            onChange={e => { setFiltroGeo(e.target.value); setPage(0); }}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="sim">Com geolocalização</MenuItem>
            <MenuItem value="nao">Sem geolocalização</MenuItem>
        </Select>
    </FormControl>
</Box>
```

---

## Task 10: Verificação manual + commit frontend

**Files:**
- Modify: `sysdoc_front/src/components/monitor-aps/VisitasAcs.js`

- [ ] **Checar que não há erros de lint/compilação**

```bash
cd sysdoc_front && npm run build 2>&1 | tail -20
```

Esperado: `✓ Compiled successfully` (sem erros de tipo ou import).

- [ ] **Verificar comportamento no browser**

Abrir `http://localhost:3000/monitor-aps/visitas` e validar:

1. Header mostra 6 selects: Equipe, Ano, Mês, Agente, Desfecho, Geolocalização
2. Dashboard tem 5 cards: Total, Realizadas, Recusadas, **Ausentes**, Cidadãos Distintos
3. Card Ausentes tem ícone `user-x`, cor laranja, com sub mostrando percentual
4. Card Cidadãos Distintos tem cor roxa `#7B2D8B`
5. Selecionar um Agente → cards e aba "Por Agente" atualizam para aquele agente
6. Selecionar Geolocalização "Com geolocalização" → cards e aba "Por Agente" atualizam
7. Selecionar Desfecho "Realizada" → cards atualizam; aba "Por Agente" **não** filtra
8. Mudar Equipe ou Ano/Mês → filtro Agente reseta para "Todos os agentes"
9. Aba Tabela não tem mais os filtros inline

- [ ] **Commit frontend**

```bash
git add sysdoc_front/src/components/monitor-aps/VisitasAcs.js
git commit -m "feat(monitor-aps): filtros no header, card Ausentes, cards reativos

- Move Agente/Desfecho/Geo do card para o header
- Adiciona card Ausentes (5 cards total)
- Cards e aba Por Agente reagem a todos os filtros
- agenteOpcoes separado de agentes para UX correta do select

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
