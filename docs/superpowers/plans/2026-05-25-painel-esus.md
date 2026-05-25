# Painel eSUS PEC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar dois módulos que lêem a Lista de Atendimento do e-SUS PEC em tempo real — um painel público tipo TV para sala de espera (fullscreen, dark mode, polling 10s) e uma página de gestão de fila autenticada com filtros e contadores.

**Architecture:** Um `PainelEsusController` (PHP/Laravel) estende `MonitorApsBaseController` reutilizando a conexão PostgreSQL já configurada para o e-SUS PEC. O frontend tem duas páginas independentes: uma pública sem layout do sistema e uma autenticada com o layout MUI padrão.

**Tech Stack:** Laravel 10, PHP 8.1, PostgreSQL (e-SUS PEC via `pgsql_esus_runtime`), Next.js 12, React 17, MUI v5, Axios.

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `sysdoc_back/app/Http/Controllers/PainelEsusController.php` | **Criar** | 3 endpoints: estado, fila, filtros |
| `sysdoc_back/routes/api.php` | **Modificar** | Adicionar import + 3 rotas novas |
| `sysdoc_front/src/services/painelEsusApi.js` | **Criar** | Chamadas HTTP públicas e autenticadas |
| `sysdoc_front/src/components/painel-esus/PainelPublico.js` | **Criar** | Painel TV dark mode com polling |
| `sysdoc_front/src/components/painel-esus/FilaEsus.js` | **Criar** | Gestão de fila com MUI e filtros |
| `sysdoc_front/pages/painel-esus/index.js` | **Criar** | Página pública (sem auth) |
| `sysdoc_front/pages/monitor-aps/fila-esus.js` | **Criar** | Página autenticada (layout sistema) |
| `sysdoc_front/pages/_app.js` | **Modificar** | Adicionar `/painel-esus` às rotas públicas |

---

## Task 1: Backend — PainelEsusController

**Files:**
- Create: `sysdoc_back/app/Http/Controllers/PainelEsusController.php`

- [ ] **Step 1: Criar o controller**

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PainelEsusController extends MonitorApsBaseController
{
    /**
     * Tenta candidatos de nome de coluna até encontrar um que existe.
     * Evita quebrar em versões diferentes do e-SUS PEC.
     */
    private function firstExistingColumn(string $table, array $candidates): ?string
    {
        foreach ($candidates as $col) {
            if ($this->hasColumn($table, $col)) {
                return $col;
            }
        }
        return null;
    }

    /**
     * Detecta dinamicamente os nomes de colunas em tb_lista_atendimento
     * que variam entre versões do e-SUS PEC.
     */
    private function resolveListaColumns(): array
    {
        return [
            'cnesCol'     => $this->firstExistingColumn('tb_lista_atendimento', ['nu_cnes', 'co_unico_saude']) ?? 'nu_cnes',
            'cidadaoFk'   => $this->firstExistingColumn('tb_lista_atendimento', ['co_seq_cidadao', 'co_cidadao']) ?? 'co_seq_cidadao',
            'profFk'      => $this->firstExistingColumn('tb_lista_atendimento', ['co_seq_profissional', 'co_profissional']) ?? 'co_seq_profissional',
            'equipeFk'    => $this->firstExistingColumn('tb_lista_atendimento', ['co_seq_equipe', 'co_equipe']) ?? 'co_seq_equipe',
            'hrInicioCol' => $this->firstExistingColumn('tb_lista_atendimento', ['hr_inicio_atendimento', 'hr_atendimento']) ?? 'hr_inicio_atendimento',
        ];
    }

    /**
     * GET /public/painel-esus/estado?cnes=XXXXXXX
     * Público — sem autenticação.
     * Retorna quem está em atendimento agora e os últimos 5 atendidos no dia.
     */
    public function estado(Request $request): JsonResponse
    {
        $request->validate(['cnes' => 'required|string|max:20']);
        $cnes = trim($request->input('cnes'));
        $hoje = now()->toDateString();

        try {
            $db = $this->db();
        } catch (\Throwable) {
            return response()->json(['error' => 'Não foi possível conectar ao e-SUS.'], 503);
        }

        try {
            $cols        = $this->resolveListaColumns();
            $cnesCol     = $cols['cnesCol'];
            $cidadaoFk   = $cols['cidadaoFk'];
            $profFk      = $cols['profFk'];
            $hrInicioCol = $cols['hrInicioCol'];

            // Nome da unidade de saúde
            $unidadeRow = null;
            try {
                $unidadeRow = $db->selectOne(
                    "SELECT no_unidade_saude FROM tb_unidade_saude WHERE co_cnes = ? LIMIT 1",
                    [$cnes]
                );
            } catch (\Throwable) {}

            // Query base reutilizada nos 3 selects abaixo
            $baseSelect = "
                SELECT
                    COALESCE(c.no_cidadao, 'Cidadão')::text    AS cidadao,
                    COALESCE(p.no_profissional, '')::text       AS profissional,
                    TO_CHAR(la.{$hrInicioCol}, 'HH24:MI')      AS hr_inicio
                FROM tb_lista_atendimento la
                LEFT JOIN tb_cidadao c    ON c.co_seq_cidadao       = la.{$cidadaoFk}
                LEFT JOIN tb_profissional p ON p.co_seq_profissional = la.{$profFk}
                WHERE la.{$cnesCol} = ?
                  AND la.dt_lista_atendimento = ?
            ";

            // Prioridade: status 4 (Em Atendimento) → status 2 (último Atendido)
            $emAtendimento = $db->selectOne(
                $baseSelect . " AND la.tp_situacao_lista_atendimento = 4 ORDER BY la.{$hrInicioCol} DESC NULLS LAST LIMIT 1",
                [$cnes, $hoje]
            );

            if (!$emAtendimento) {
                $emAtendimento = $db->selectOne(
                    $baseSelect . " AND la.tp_situacao_lista_atendimento = 2 ORDER BY la.{$hrInicioCol} DESC NULLS LAST LIMIT 1",
                    [$cnes, $hoje]
                );
            }

            // Últimos 5 finalizados — exclui o "em_atendimento" do topo
            $ultimosAtendidos = $db->select(
                $baseSelect . " AND la.tp_situacao_lista_atendimento = 2 ORDER BY la.{$hrInicioCol} DESC NULLS LAST LIMIT 5",
                [$cnes, $hoje]
            );

            return response()->json([
                'unidade'           => $unidadeRow?->no_unidade_saude ?? 'CNES ' . $cnes,
                'em_atendimento'    => $emAtendimento,
                'ultimos_atendidos' => $ultimosAtendidos,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Erro ao consultar dados: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /painel-esus/fila?cnes=X&equipe=Y&profissional=Z
     * Autenticado. Retorna contadores e lista de aguardando para a gestão de fila.
     */
    public function fila(Request $request): JsonResponse
    {
        $request->validate([
            'cnes'         => 'required|string|max:20',
            'equipe'       => 'nullable|integer',
            'profissional' => 'nullable|integer',
        ]);

        $cnes     = trim($request->input('cnes'));
        $equipeId = $request->input('equipe');
        $profId   = $request->input('profissional');
        $hoje     = now()->toDateString();

        try {
            $db = $this->db();
        } catch (\Throwable) {
            return response()->json(['error' => 'Não foi possível conectar ao e-SUS.'], 503);
        }

        try {
            $cols      = $this->resolveListaColumns();
            $cnesCol   = $cols['cnesCol'];
            $cidadaoFk = $cols['cidadaoFk'];
            $profFk    = $cols['profFk'];
            $equipeFk  = $cols['equipeFk'];

            $where  = "la.{$cnesCol} = ? AND la.dt_lista_atendimento = ?";
            $params = [$cnes, $hoje];

            if ($equipeId) {
                $where   .= " AND la.{$equipeFk} = ?";
                $params[] = (int) $equipeId;
            }
            if ($profId) {
                $where   .= " AND la.{$profFk} = ?";
                $params[] = (int) $profId;
            }

            $contadores = $db->selectOne("
                SELECT
                    COUNT(*) FILTER (WHERE la.tp_situacao_lista_atendimento = 1)       AS aguardando,
                    COUNT(*) FILTER (WHERE la.tp_situacao_lista_atendimento IN (2, 4)) AS atendidos,
                    COUNT(*) FILTER (WHERE la.tp_situacao_lista_atendimento = 3)       AS nao_aguardaram
                FROM tb_lista_atendimento la
                WHERE {$where}
            ", $params);

            $aguardando = $db->select("
                SELECT
                    la.co_seq_lista_atendimento            AS id,
                    COALESCE(c.no_cidadao, 'Cidadão')::text AS cidadao,
                    TO_CHAR(la.hr_chegada, 'HH24:MI')      AS hr_chegada,
                    COALESCE(e.no_equipe, '')::text         AS equipe,
                    COALESCE(p.no_profissional, '')::text   AS profissional
                FROM tb_lista_atendimento la
                LEFT JOIN tb_cidadao    c ON c.co_seq_cidadao       = la.{$cidadaoFk}
                LEFT JOIN tb_profissional p ON p.co_seq_profissional = la.{$profFk}
                LEFT JOIN tb_equipe      e ON e.co_seq_equipe        = la.{$equipeFk}
                WHERE {$where}
                  AND la.tp_situacao_lista_atendimento = 1
                ORDER BY la.hr_chegada ASC NULLS LAST
            ", $params);

            return response()->json([
                'contadores' => [
                    'aguardando'     => (int) ($contadores?->aguardando ?? 0),
                    'atendidos'      => (int) ($contadores?->atendidos ?? 0),
                    'nao_aguardaram' => (int) ($contadores?->nao_aguardaram ?? 0),
                ],
                'aguardando' => $aguardando,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Erro ao consultar fila: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /painel-esus/filtros?cnes=X
     * Autenticado. Retorna equipes e profissionais do dia para popular os dropdowns.
     */
    public function filtros(Request $request): JsonResponse
    {
        $request->validate(['cnes' => 'required|string|max:20']);
        $cnes = trim($request->input('cnes'));
        $hoje = now()->toDateString();

        try {
            $db = $this->db();
        } catch (\Throwable) {
            return response()->json(['error' => 'Não foi possível conectar ao e-SUS.'], 503);
        }

        try {
            $cols     = $this->resolveListaColumns();
            $cnesCol  = $cols['cnesCol'];
            $profFk   = $cols['profFk'];
            $equipeFk = $cols['equipeFk'];

            $equipes = $db->select("
                SELECT DISTINCT e.co_seq_equipe AS id, e.no_equipe AS nome
                FROM tb_lista_atendimento la
                JOIN tb_equipe e ON e.co_seq_equipe = la.{$equipeFk}
                WHERE la.{$cnesCol} = ? AND la.dt_lista_atendimento = ?
                ORDER BY e.no_equipe
            ", [$cnes, $hoje]);

            $profissionais = $db->select("
                SELECT DISTINCT p.co_seq_profissional AS id, p.no_profissional AS nome
                FROM tb_lista_atendimento la
                JOIN tb_profissional p ON p.co_seq_profissional = la.{$profFk}
                WHERE la.{$cnesCol} = ? AND la.dt_lista_atendimento = ?
                ORDER BY p.no_profissional
            ", [$cnes, $hoje]);

            return response()->json([
                'equipes'       => $equipes,
                'profissionais' => $profissionais,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Erro ao buscar filtros: ' . $e->getMessage()], 500);
        }
    }
}
```

- [ ] **Step 2: Verificar que o arquivo foi criado sem erros de sintaxe**

```bash
cd sysdoc_back && php -l app/Http/Controllers/PainelEsusController.php
```

Saída esperada: `No syntax errors detected in app/Http/Controllers/PainelEsusController.php`

---

## Task 2: Backend — Registrar rotas em api.php

**Files:**
- Modify: `sysdoc_back/routes/api.php`

- [ ] **Step 1: Adicionar o import do PainelEsusController**

Localizar o bloco de `use` statements no topo de `api.php`. Adicionar **imediatamente após** a linha `use App\Http\Controllers\PageViewAuditController;`:

```php
use App\Http\Controllers\PainelEsusController;
```

- [ ] **Step 2: Adicionar as rotas públicas**

Localizar o comentário `// Transparência pública - Farmácia básica (Lei 2488)` e adicionar **após** o bloco de rotas de farmácia, **antes** de `// Redefinição de senha`:

```php
// Painel de atendimento eSUS PEC — público (sala de espera)
Route::middleware('throttle:30,1')->get('/public/painel-esus/estado', [PainelEsusController::class, 'estado']);
```

- [ ] **Step 3: Adicionar as rotas autenticadas**

Dentro do `Route::group(['middleware' => ['auth:sanctum']], function () {`, adicionar **antes** do fechamento do grupo `});` e **após** o bloco do Monitor APS:

```php
// Painel de atendimento eSUS PEC — gestão de fila (autenticado)
Route::prefix('painel-esus')->group(function () {
    Route::get('/fila',    [PainelEsusController::class, 'fila']);
    Route::get('/filtros', [PainelEsusController::class, 'filtros']);
});
```

- [ ] **Step 4: Verificar que as rotas foram registradas**

```bash
cd sysdoc_back && php artisan route:list --path=painel-esus
```

Saída esperada: 3 rotas listadas — `GET public/painel-esus/estado`, `GET painel-esus/fila`, `GET painel-esus/filtros`.

- [ ] **Step 5: Commit do backend**

```bash
cd sysdoc_back
git add app/Http/Controllers/PainelEsusController.php routes/api.php
git commit -m "feat: PainelEsusController — painel público + gestão de fila eSUS PEC"
```

---

## Task 3: Frontend — Serviço de API

**Files:**
- Create: `sysdoc_front/src/services/painelEsusApi.js`

- [ ] **Step 1: Criar o arquivo de serviço**

```js
import axios from 'axios';
import { api } from './api';

// Instância sem token — para o painel público (TV)
const publicHttp = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

export const painelEsusPublicApi = {
    estado: (cnes, options = {}) =>
        publicHttp
            .get('/public/painel-esus/estado', { params: { cnes }, signal: options.signal })
            .then(r => r.data),
};

// Usa a instância autenticada principal — para a gestão de fila
export const painelEsusApi = {
    fila: (params, options = {}) =>
        api.get('/painel-esus/fila', { params, signal: options.signal }).then(r => r.data),
    filtros: (cnes, options = {}) =>
        api.get('/painel-esus/filtros', { params: { cnes }, signal: options.signal }).then(r => r.data),
};
```

---

## Task 4: Frontend — Componente PainelPublico (TV)

**Files:**
- Create: `sysdoc_front/src/components/painel-esus/PainelPublico.js`

- [ ] **Step 1: Criar o componente standalone dark mode**

```js
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { painelEsusPublicApi } from '../../services/painelEsusApi';

function Relogio() {
    const [hora, setHora] = useState('--:--:--');
    useEffect(() => {
        const tick = () =>
            setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return <span style={s.relogio}>{hora}</span>;
}

const s = {
    root:       { minHeight: '100vh', background: '#060d1f', color: '#fff', fontFamily: "'Segoe UI', Arial, sans-serif", display: 'flex', flexDirection: 'column' },
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    unidadeNome:{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 },
    unidadeSub: { fontSize: 13, color: '#7ba4d9', marginTop: 2 },
    relogio:    { fontSize: 32, fontWeight: 300, fontVariantNumeric: 'tabular-nums', color: '#7ba4d9' },
    mainSection:{ padding: '32px 40px 16px', flex: '0 0 auto' },
    sectionLabel:{ fontSize: 11, letterSpacing: 3, color: '#4a7ab5', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' },
    emAtendimentoCard: { background: 'linear-gradient(135deg, #0d2a4a 0%, #1a3f6a 100%)', border: '1px solid #2a5a9a', borderRadius: 16, padding: '32px 40px', minHeight: 120 },
    cidadaoNome:{ fontSize: 48, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, textTransform: 'uppercase' },
    profissionalRow: { marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 },
    profissionalNome:{ fontSize: 20, color: '#90bfe8', fontWeight: 500 },
    hrBadge:    { fontSize: 14, color: '#4a7ab5', background: 'rgba(74,122,181,0.15)', borderRadius: 8, padding: '3px 10px', fontVariantNumeric: 'tabular-nums' },
    semDados:   { fontSize: 22, color: '#4a7ab5', fontStyle: 'italic' },
    ultimosSection: { padding: '8px 40px 32px', flex: 1 },
    ultimosGrid:{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 },
    ultimoCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', minWidth: 220, flex: '1 1 200px', maxWidth: 300 },
    ultimoCidadao: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
    ultimoProf: { fontSize: 13, color: '#7ba4d9', marginBottom: 6 },
    ultimoHr:   { fontSize: 12, color: '#4a7ab5', fontVariantNumeric: 'tabular-nums' },
    erroBar:    { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#7f1d1d', color: '#fca5a5', padding: '10px 24px', fontSize: 13 },
    formRoot:   { minHeight: '100vh', background: '#060d1f', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Segoe UI', Arial, sans-serif" },
    formBox:    { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '48px', maxWidth: 480, width: '90%', textAlign: 'center' },
    formTitle:  { fontSize: 28, fontWeight: 700, margin: '0 0 8px' },
    formSub:    { color: '#7ba4d9', margin: '0 0 32px', fontSize: 15 },
    input:      { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 20, padding: '12px 16px', flex: 1, outline: 'none', letterSpacing: 2 },
    btnPrimary: { background: '#1a56db', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, padding: '12px 24px', cursor: 'pointer' },
};

export default function PainelPublico() {
    const router             = useRouter();
    const [cnesInput, setCnesInput] = useState('');
    const [cnes, setCnes]    = useState('');
    const [dados, setDados]  = useState(null);
    const [erro, setErro]    = useState(null);
    const pollingRef         = useRef(null);
    const abortRef           = useRef(null);

    // Lê CNES da URL ao montar (bookmarkável)
    useEffect(() => {
        if (router.isReady && router.query.cnes) {
            setCnes(String(router.query.cnes));
        }
    }, [router.isReady, router.query.cnes]);

    const fetchDados = useCallback(() => {
        if (!cnes) return;
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        painelEsusPublicApi
            .estado(cnes, { signal: ac.signal })
            .then(d => { setDados(d); setErro(null); })
            .catch(e => {
                if (e.name === 'CanceledError' || e.name === 'AbortError') return;
                setErro('Não foi possível atualizar os dados. Tentando novamente...');
            });
    }, [cnes]);

    // Inicia polling quando CNES estiver definido
    useEffect(() => {
        if (!cnes) return;
        fetchDados();
        pollingRef.current = setInterval(fetchDados, 10000);
        return () => {
            clearInterval(pollingRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [cnes, fetchDados]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const v = cnesInput.trim();
        if (!v) return;
        router.push({ pathname: '/painel-esus', query: { cnes: v } }, undefined, { shallow: true });
        setCnes(v);
    };

    if (!cnes) {
        return (
            <div style={s.formRoot}>
                <Head><title>Painel de Atendimento — eSUS PEC</title></Head>
                <div style={s.formBox}>
                    <h1 style={s.formTitle}>Painel de Atendimento</h1>
                    <p style={s.formSub}>Digite o CNES da unidade de saúde</p>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
                        <input
                            style={s.input}
                            value={cnesInput}
                            onChange={e => setCnesInput(e.target.value)}
                            placeholder="Ex: 1234567"
                            maxLength={10}
                            autoFocus
                        />
                        <button type="submit" style={s.btnPrimary}>Acessar</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={s.root}>
            <Head><title>Painel — {dados?.unidade ?? 'eSUS PEC'}</title></Head>

            {/* Header */}
            <div style={s.header}>
                <div>
                    <div style={s.unidadeNome}>{dados?.unidade ?? 'Carregando...'}</div>
                    <div style={s.unidadeSub}>CNES {cnes}</div>
                </div>
                <Relogio />
            </div>

            {/* Em Atendimento Agora */}
            <div style={s.mainSection}>
                <div style={s.sectionLabel}>Em Atendimento Agora</div>
                <div style={s.emAtendimentoCard}>
                    {dados?.em_atendimento ? (
                        <>
                            <div style={s.cidadaoNome}>{dados.em_atendimento.cidadao}</div>
                            <div style={s.profissionalRow}>
                                <span style={s.profissionalNome}>{dados.em_atendimento.profissional}</span>
                                <span style={s.hrBadge}>{dados.em_atendimento.hr_inicio}</span>
                            </div>
                        </>
                    ) : (
                        <div style={s.semDados}>
                            {dados ? 'Nenhum atendimento em andamento no momento' : 'Carregando...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Últimos Atendidos */}
            <div style={s.ultimosSection}>
                <div style={s.sectionLabel}>Últimos Atendidos</div>
                <div style={s.ultimosGrid}>
                    {dados?.ultimos_atendidos?.length > 0 ? (
                        dados.ultimos_atendidos.map((item, i) => (
                            <div key={i} style={s.ultimoCard}>
                                <div style={s.ultimoCidadao}>{item.cidadao}</div>
                                <div style={s.ultimoProf}>{item.profissional}</div>
                                <div style={s.ultimoHr}>{item.hr_inicio}</div>
                            </div>
                        ))
                    ) : (
                        <div style={{ ...s.semDados, fontSize: 16 }}>
                            {dados ? 'Nenhum atendimento realizado hoje' : ''}
                        </div>
                    )}
                </div>
            </div>

            {erro && <div style={s.erroBar}>{erro}</div>}
        </div>
    );
}
```

---

## Task 5: Frontend — Componente FilaEsus (gestão)

**Files:**
- Create: `sysdoc_front/src/components/painel-esus/FilaEsus.js`

- [ ] **Step 1: Criar o componente de gestão de fila**

```js
import { useCallback, useEffect, useState } from 'react';
import {
    Box, Card, CardContent, CircularProgress, FormControl,
    Grid, InputLabel, MenuItem, Select, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Typography,
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
    const [cnes,          setCnes]          = useState('');
    const [cnesInput,     setCnesInput]     = useState('');
    const [equipes,       setEquipes]       = useState([]);
    const [profissionais, setProfissionais] = useState([]);
    const [equipeId,      setEquipeId]      = useState('');
    const [profId,        setProfId]        = useState('');
    const [dados,         setDados]         = useState(null);
    const [loading,       setLoading]       = useState(false);
    const [erro,          setErro]          = useState(null);

    // Carrega filtros quando CNES muda
    useEffect(() => {
        if (!cnes) return;
        painelEsusApi.filtros(cnes)
            .then(d => {
                setEquipes(d.equipes ?? []);
                setProfissionais(d.profissionais ?? []);
            })
            .catch(() => {});
    }, [cnes]);

    const carregarFila = useCallback(() => {
        if (!cnes) return;
        setLoading(true);
        setErro(null);
        const params = { cnes };
        if (equipeId) params.equipe = equipeId;
        if (profId)   params.profissional = profId;
        painelEsusApi.fila(params)
            .then(d => setDados(d))
            .catch(e => setErro(e.message))
            .finally(() => setLoading(false));
    }, [cnes, equipeId, profId]);

    // Re-fetch quando qualquer filtro muda
    useEffect(() => { carregarFila(); }, [carregarFila]);

    const handleCnesSubmit = (e) => {
        e.preventDefault();
        if (cnesInput.trim()) setCnes(cnesInput.trim());
    };

    if (!cnes) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400} gap={2}>
                <Typography variant="h6" sx={{ color: 'var(--lg-text-secondary)' }}>
                    Informe o CNES para visualizar a fila de atendimento
                </Typography>
                <Box component="form" onSubmit={handleCnesSubmit} display="flex" gap={1}>
                    <input
                        value={cnesInput}
                        onChange={e => setCnesInput(e.target.value)}
                        placeholder="CNES da unidade"
                        maxLength={10}
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--lg-border-input)', background: 'var(--lg-glass-input)', color: 'var(--lg-text-primary)', fontSize: 15 }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', background: 'var(--lg-primary, #1a56db)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>
                        Buscar
                    </button>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
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

            {/* Contadores */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <ContadorCard icon="clock" titulo="Em Espera" valor={dados?.contadores?.aguardando} cor="#1351B4" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ContadorCard icon="check-circle" titulo="Atendidos Hoje" valor={dados?.contadores?.atendidos} cor="#168821" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ContadorCard icon="user-x" titulo="Não Aguardaram" valor={dados?.contadores?.nao_aguardaram} cor="#E52207" />
                </Grid>
            </Grid>

            {/* Lista de aguardando */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        Aguardando Atendimento
                    </Typography>

                    {loading && (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress size={32} />
                        </Box>
                    )}

                    {erro && !loading && (
                        <Typography color="error" sx={{ py: 2 }}>Erro: {erro}</Typography>
                    )}

                    {!loading && !erro && (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Cidadão</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Chegada</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Equipe</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Profissional</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dados?.aguardando?.length > 0 ? (
                                        dados.aguardando.map((row, i) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell sx={{ color: 'var(--lg-text-muted)', fontSize: 12 }}>{i + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{row.cidadao}</TableCell>
                                                <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.hr_chegada || '—'}</TableCell>
                                                <TableCell>{row.equipe || '—'}</TableCell>
                                                <TableCell>{row.profissional || '—'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                Nenhum paciente aguardando no momento
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
```

---

## Task 6: Frontend — Páginas + PUBLIC_ROUTES

**Files:**
- Create: `sysdoc_front/pages/painel-esus/index.js`
- Create: `sysdoc_front/pages/monitor-aps/fila-esus.js`
- Modify: `sysdoc_front/pages/_app.js` (adicionar `/painel-esus` às rotas públicas)

- [ ] **Step 1: Criar a página pública do painel TV**

```js
// sysdoc_front/pages/painel-esus/index.js
import PainelPublico from '../../src/components/painel-esus/PainelPublico';

export default function PainelEsusPage() {
    return <PainelPublico />;
}
```

- [ ] **Step 2: Criar a página autenticada de gestão de fila**

```js
// sysdoc_front/pages/monitor-aps/fila-esus.js
import { Grid } from '@mui/material';
import FilaEsus from '../../src/components/painel-esus/FilaEsus';

export default function FilaEsusPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <FilaEsus />
            </Grid>
        </Grid>
    );
}
```

- [ ] **Step 3: Adicionar `/painel-esus` às rotas públicas em `_app.js`**

Localizar a função `isPublicRoute` em `sysdoc_front/pages/_app.js`:

```js
// ANTES:
function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/showqueue");
}

// DEPOIS:
function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/showqueue") || pathname.startsWith("/painel-esus");
}
```

Esta é a **única** alteração em `_app.js`. Não muda nada mais.

- [ ] **Step 4: Verificar que o build compila sem erros**

```bash
cd sysdoc_front && npm run build 2>&1 | tail -20
```

Saída esperada: build concluído sem erros. Avisos de lint são aceitáveis.

- [ ] **Step 5: Commit do frontend**

```bash
cd sysdoc_front
git add src/services/painelEsusApi.js \
        src/components/painel-esus/PainelPublico.js \
        src/components/painel-esus/FilaEsus.js \
        pages/painel-esus/index.js \
        pages/monitor-aps/fila-esus.js \
        pages/_app.js
git commit -m "feat: painel público TV + gestão de fila eSUS PEC"
```

---

## Task 7: Verificação Final

- [ ] **Step 1: Testar endpoint público no backend**

Com o backend rodando (`php artisan serve`):

```bash
curl "http://localhost:8000/api/public/painel-esus/estado?cnes=SEU_CNES_AQUI"
```

Saída esperada: JSON com `unidade`, `em_atendimento` (null ou objeto), `ultimos_atendidos` (array).  
Se retornar `{"error": "Não foi possível conectar ao e-SUS."}`, a conexão PostgreSQL não está configurada — verificar `monitor_aps_configs` no banco MySQL.

- [ ] **Step 2: Testar painel no navegador**

Com o frontend rodando (`npm run dev`):
1. Acessar `http://localhost:3000/painel-esus` → deve mostrar formulário pedindo CNES
2. Digitar o CNES e confirmar → URL muda para `?cnes=XXXXXXX`, painel carrega
3. Aguardar 10 segundos → dados atualizam silenciosamente

- [ ] **Step 3: Testar página de gestão de fila**

1. Fazer login no sistema
2. Acessar `http://localhost:3000/monitor-aps/fila-esus`
3. Digitar CNES → cards de contadores e lista de aguardando aparecem
4. Mudar filtro de equipe → lista atualiza

---

## Notas de Ajuste de Schema

Se o backend retornar erro 500 com mensagem de coluna não encontrada, é provável que a versão do e-SUS PEC instalado use nomes diferentes. Inspecionar com:

```bash
curl "http://localhost:8000/api/monitor-aps/config/explorar" -H "Authorization: Bearer SEU_TOKEN"
```

Ou direto no PostgreSQL:
```sql
SELECT attname::text AS coluna
FROM pg_catalog.pg_attribute
WHERE attrelid = 'tb_lista_atendimento'::regclass
  AND attnum > 0 AND NOT attisdropped
ORDER BY attnum;
```

Ajustar os arrays de candidatos em `resolveListaColumns()` conforme o resultado.
