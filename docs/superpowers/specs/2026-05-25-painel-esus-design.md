# Painel eSUS PEC — Spec de Design
**Data:** 2026-05-25  
**Status:** Aprovado

---

## Visão Geral

Dois módulos novos que consomem a Lista de Atendimento do e-SUS PEC em tempo real:

1. **Painel Público (TV)** — tela fullscreen para sala de espera, sem autenticação, filtrado por CNES.
2. **Página de Gestão de Fila** — tela autenticada no layout do sistema, com filtros por equipe/profissional e cards de contadores.

**Restrição crítica:** nenhuma tela ou rota existente do Sysdoc pode ser alterada.

---

## Fonte de Dados

Banco PostgreSQL do e-SUS PEC (conexão `pgsql_esus_runtime` — já configurada em `MonitorApsBaseController`).

### Tabela principal: `tb_lista_atendimento`

| Campo | Tipo | Descrição |
|---|---|---|
| `co_seq_lista_atendimento` | bigint PK | identificador |
| `co_unico_saude` | varchar | CNES da UBS |
| `dt_lista_atendimento` | date | data (filtrar = CURRENT_DATE) |
| `hr_chegada` | time | horário de chegada do paciente |
| `hr_inicio_atendimento` | time | horário que o profissional iniciou |
| `tp_situacao_lista_atendimento` | int | `1=Aguardando`, `2=Atendido`, `3=Não Aguardou`, `4=Em Atendimento` |
| `co_cidadao` | bigint FK | → `tb_cidadao` |
| `co_profissional` | bigint FK | → `tb_profissional` |
| `co_equipe` | bigint FK | → `tb_equipe` |

### Joins
- `tb_cidadao.no_cidadao` — nome completo do paciente
- `tb_profissional` + `tb_cbo` — nome e categoria do profissional
- `tb_equipe.no_equipe` — nome da equipe (filtro)

> **Nota:** Nomes exatos de colunas serão validados em runtime via `hasColumn()` herdado de `MonitorApsBaseController`. Se alguma coluna não existir na versão do banco instalado, o endpoint retorna null para esse campo sem quebrar.

---

## Backend — `PainelEsusController`

**Arquivo:** `sysdoc_back/app/Http/Controllers/PainelEsusController.php`  
**Herda:** `MonitorApsBaseController` (conexão e-SUS PEC + `hasColumn()`)

### Endpoints

#### 1. `GET /public/painel-esus/estado` — público, sem auth
**Params:** `cnes` (obrigatório)

Retorna:
```json
{
  "unidade": "UBS NOME DA UNIDADE",
  "em_atendimento": {
    "cidadao": "JOÃO SILVA DOS SANTOS",
    "profissional": "Dr. Paulo Mendes",
    "categoria": "Clínica Geral",
    "hr_inicio": "10:32"
  },
  "ultimos_atendidos": [
    { "cidadao": "...", "profissional": "...", "hr_inicio": "..." },
    ...
  ]
}
```

Query: busca 1 registro com `tp_situacao = 4` (Em Atendimento) ou último com `tp_situacao = 2` para "em_atendimento"; últimos 5 com `tp_situacao = 2` ordenados por `hr_inicio_atendimento DESC` para "ultimos_atendidos". Filtro: `dt_lista_atendimento = CURRENT_DATE` e `co_unico_saude = :cnes`.

#### 2. `GET /public/painel-esus/fila` — autenticado (`auth:sanctum`)
**Params:** `cnes` (obrigatório), `equipe` (opcional), `profissional` (opcional)

Retorna:
```json
{
  "contadores": {
    "aguardando": 12,
    "atendidos": 34,
    "nao_aguardaram": 3
  },
  "aguardando": [
    { "cidadao": "Ana Paula Rocha", "hr_chegada": "08:45", "equipe": "ESF I", "profissional": "Dra. Ana Lima" },
    ...
  ]
}
```

#### 3. `GET /public/painel-esus/filtros` — autenticado (`auth:sanctum`)
**Params:** `cnes` (obrigatório)

Retorna listas de equipes e profissionais ativos na lista do dia para popular os dropdowns.

### Rotas (em `routes/api.php`)
```php
// Público — sem auth
Route::get('/public/painel-esus/estado', [PainelEsusController::class, 'estado']);

// Autenticados
Route::middleware('auth:sanctum')->prefix('painel-esus')->group(function () {
    Route::get('/fila',    [PainelEsusController::class, 'fila']);
    Route::get('/filtros', [PainelEsusController::class, 'filtros']);
});
```

---

## Frontend

### Tela 1 — Painel Público
**Arquivo:** `sysdoc_front/pages/painel-esus/index.js`  
**Componente:** `sysdoc_front/src/components/painel-esus/PainelPublico.js`

- Sem `AuthGuard`, sem layout do sistema (página standalone fullscreen)
- Estado inicial: formulário com input de CNES
- Após CNES válido: URL atualiza para `?cnes=XXXXXXX` (bookmarkável)
- Polling via `setInterval` de 10s com `AbortController` para cleanup
- Design: dark mode, fonte grande para o atendimento atual, cards menores para os últimos 5
- Exibe: nome da unidade, CNES, relógio local, atendimento atual, últimos 5 atendidos

### Tela 2 — Gestão de Fila
**Arquivo:** `sysdoc_front/pages/monitor-aps/fila-esus.js`  
**Componente:** `sysdoc_front/src/components/painel-esus/FilaEsus.js`

- Usa layout autenticado existente do sistema (MUI, sidebar, header)
- Filtros: CNES, Equipe, Profissional — dropdowns populados pelo endpoint `/filtros`
- Ao mudar qualquer filtro: re-fetch imediato de `/fila`
- 3 cards de contador: Aguardando, Atendidos hoje, Não Aguardaram
- Lista de pacientes aguardando com: nome, horário de chegada, equipe, profissional
- Sem polling automático (gestão ativa — usuário refresca filtro quando quiser)

---

## Comportamento de Erro

- CNES não encontrado → mensagem "Nenhum atendimento encontrado para este CNES hoje."
- Falha de conexão com e-SUS PEC → mensagem "Não foi possível conectar ao e-SUS. Tente novamente." (sem quebrar a página)
- Colunas ausentes no banco (versão diferente do e-SUS) → campo retorna `null`, frontend exibe "—"

---

## Restrições

- Não alterar nenhum arquivo de rota, controller, componente ou página existente
- Não alterar o painel de atendimento do Sysdoc (`/attendance/panel`)
- Usar `hasColumn()` para colunas incertas (proteção contra variações de versão do e-SUS PEC)
- Throttle nas rotas públicas: `throttle:30,1` (30 req/min por IP)
