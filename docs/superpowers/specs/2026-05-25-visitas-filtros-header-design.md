# Design: Filtros no Header + Cards Reativos — Monitor APS / Visitas

**Data:** 2026-05-25
**Escopo:** `sysdoc_front/src/components/monitor-aps/VisitasAcs.js` + `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

---

## Contexto

A página `/monitor-aps/visitas` tem dois grupos de filtros hoje:

- **Header:** Equipe, Ano, Mês
- **Dentro do card "Tabela":** Agente, Desfecho, Geolocalização

Os cards de métricas (Total de Visitas, Realizadas, Recusadas, Cidadãos Distintos) reagem apenas a Equipe/Ano/Mês, ignorando os três filtros do card. A aba "Por Agente" também ignora o filtro de Agente.

## Objetivo

1. Mover Agente, Desfecho e Geolocalização para o header, ao lado de Equipe/Ano/Mês.
2. Fazer os cards e a aba "Por Agente" reagirem a todos os filtros ativos.

---

## Design

### 1. Frontend — Layout do Header

O header passa de 3 para 6 selects, todos no mesmo `Box` com `flexWrap="wrap"`:

```
[Visitas ACS / TACS]   [Equipe] [Ano] [Mês] [Agente] [Desfecho] [Geolocalização]
```

- O select **Agente** é populado pelos dados de `agentes` (já carregados para a aba "Por Agente").
- O select **Desfecho** mantém as mesmas opções atuais: Realizada, Recusada, Ausente.
- O select **Geolocalização** mantém: Com / Sem geolocalização.
- O bloco de filtros inline dentro do `CardContent` da aba Tabela é **removido**.

### 2. Frontend — Estado e Efeitos

**Reset de `filtroAgente`:**  
Quando `ine`, `ano` ou `mes` muda, o `filtroAgente` é resetado para `''`, porque os agentes disponíveis mudam com a equipe/período.

**`useEffect` do `resumo`:**
- Adiciona `filtroAgente`, `filtroDesfecho`, `filtroGeo` às dependências.
- Envia como query params: `agente`, `desfecho`, `has_geo`.
- A chave de cache inclui os novos filtros.

**`useEffect` dos `agentes`:**
- Adiciona `filtroAgente` às dependências.
- Envia `agente` como query param quando informado.
- A chave de cache inclui `filtroAgente`.

**`useEffect` da `lista`:** sem alteração de lógica — já usa os três filtros.

### 3. Backend — `buildWhere`

Assinatura estendida (parâmetros opcionais ao final para não quebrar chamadas existentes):

```php
private function buildWhere(
    int $ano, int $mes, ?string $ine,
    ?string $agentName = null,
    ?string $desfecho  = null,
    ?string $hasGeo    = null
): array
```

Cláusulas adicionadas:
- `$agentName` → `AND p.no_profissional = ?` (já existia para `index` e `lista`)
- `$desfecho`  → `AND d.co_seq_dim_desfecho_visita = ?`
- `$hasGeo = 'sim'` → `AND v.nu_latitude IS NOT NULL AND v.nu_longitude IS NOT NULL`
- `$hasGeo = 'nao'` → `AND (v.nu_latitude IS NULL OR v.nu_longitude IS NULL)`

### 4. Backend — Endpoint `resumo`

Validação estendida:
```php
'agente'  => 'nullable|string',
'desfecho' => 'nullable|integer|in:1,2,3',
'has_geo'  => 'nullable|string|in:sim,nao',
```

Passa os três para `buildWhere`. O cache não existe neste endpoint (sem sessionStorage aqui — o cache é no frontend). Sem breaking change: os parâmetros são opcionais.

### 5. Backend — Endpoint `agentes`

Validação estendida:
```php
'agente' => 'nullable|string',
```

Passa `$agente` para `buildWhere`. Quando informado, a query retorna apenas uma linha (o agente filtrado), que a aba "Por Agente" exibe normalmente.

---

## Comportamento esperado

| Filtro ativo | Cards atualizam? | Aba "Por Agente" filtra? | Tabela filtra? |
|---|---|---|---|
| Equipe | Sim | Sim | Sim |
| Ano / Mês | Sim | Sim | Sim |
| Agente | Sim | Sim (só aquele agente) | Sim |
| Desfecho | Sim | Não (desfecho não afeta a aba) | Sim |
| Geolocalização | Sim | Não (geo não afeta a aba) | Sim |

> **Nota:** Desfecho e Geo não afetam a aba "Por Agente" porque essa aba mostra breakdown por agente — filtrar por desfecho/geo ali seria redundante e confuso (os totais por agente já mostram cada desfecho separado).

---

## Arquivos alterados

| Arquivo | Natureza da mudança |
|---|---|
| `sysdoc_front/src/components/monitor-aps/VisitasAcs.js` | Mover selects, novos deps nos useEffects, reset de filtroAgente |
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Estender `buildWhere`, `resumo`, `agentes` |

---

## O que NÃO muda

- Endpoints `index`, `lista`, `mapa`, `show`, `equipes` — sem alteração.
- Componentes `VisitaDetalheModal`, `MapaVisitas`, `MapaVisitasPage` — sem alteração.
- Estrutura de cache do frontend (`monitorApsCache`) — só as chaves mudam.
- Autenticação, rotas, migrations — nada.
