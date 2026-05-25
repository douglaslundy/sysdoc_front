# Design: Filtros no Header + Cards Reativos — Monitor APS / Visitas

**Data:** 2026-05-25
**Escopo:** `sysdoc_front/src/components/monitor-aps/VisitasAcs.js` + `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

---

## Contexto

A página `/monitor-aps/visitas` tem dois grupos de filtros hoje:

- **Header:** Equipe, Ano, Mês
- **Dentro do card "Tabela":** Agente, Desfecho, Geolocalização

Os cards de métricas (Total de Visitas, Realizadas, Recusadas, Cidadãos Distintos) reagem apenas a Equipe/Ano/Mês, ignorando os três filtros do card. A aba "Por Agente" também ignora os filtros de Agente e Geolocalização.

## Objetivo

1. Mover Agente, Desfecho e Geolocalização para o header, ao lado de Equipe/Ano/Mês.
2. Fazer os cards e a aba "Por Agente" reagirem a todos os filtros ativos.
3. Adicionar card de **Ausentes** ao dashboard.

---

## Design

### 1. Frontend — Cards de Métricas

Passa de 4 para **5 cards**, todos em linha com `xs={6} sm` responsivo:

| Card | Ícone | Cor | Valor |
|---|---|---|---|
| Total de Visitas | `map-pin` | `#1351B4` | `totais.total` |
| Realizadas | `check-circle` | `#168821` | `totais.realizadas (X%)` |
| Recusadas | `x-circle` | `#E52207` | `totais.recusadas` + sub `X%` |
| **Ausentes** | `user-x` | `#FF8C00` | `totais.ausentes` + sub `X%` |
| Cidadãos Distintos | `users` | `#7B2D8B` | `totais.cidadaos` |

> O card de Cidadãos Distintos muda de cor (de `#FF8C00` para `#7B2D8B`) para diferenciar do card Ausentes que passa a usar laranja. Grid: `xs={6} sm={true}` para 5 cards em linha no desktop.

### 2. Frontend — Layout do Header

O header passa de 3 para 6 selects, todos no mesmo `Box` com `flexWrap="wrap"`:

```
[Visitas ACS / TACS]   [Equipe] [Ano] [Mês] [Agente] [Desfecho] [Geolocalização]
```

- O select **Agente** é populado pelos dados de `agentes` (já carregados para a aba "Por Agente").
- O select **Desfecho** mantém as mesmas opções atuais: Realizada, Recusada, Ausente.
- O select **Geolocalização** mantém: Com / Sem geolocalização.
- O bloco de filtros inline dentro do `CardContent` da aba Tabela é **removido**.

### 3. Frontend — Estado e Efeitos

**Reset de `filtroAgente`:**
Quando `ine`, `ano` ou `mes` muda, o `filtroAgente` é resetado para `''`, porque os agentes disponíveis mudam com a equipe/período.

**`useEffect` do `resumo`:**
- Adiciona `filtroAgente`, `filtroDesfecho`, `filtroGeo` às dependências.
- Envia como query params: `agente`, `desfecho`, `has_geo`.
- A chave de cache inclui os novos filtros.

**`useEffect` dos `agentes`:**
- Adiciona `filtroAgente` e `filtroGeo` às dependências.
- Envia `agente` e `has_geo` como query params quando informados.
- A chave de cache inclui ambos.

**`useEffect` da `lista`:** sem alteração de lógica — já usa os três filtros.

### 4. Backend — `buildWhere`

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

### 5. Backend — Endpoint `resumo`

Validação estendida:
```php
'agente'   => 'nullable|string',
'desfecho' => 'nullable|integer|in:1,2,3',
'has_geo'  => 'nullable|string|in:sim,nao',
```

Passa os três para `buildWhere`. Sem breaking change: os parâmetros são opcionais.

### 6. Backend — Endpoint `agentes`

Validação estendida:
```php
'agente'  => 'nullable|string',
'has_geo' => 'nullable|string|in:sim,nao',
```

Passa `$agente` e `$hasGeo` para `buildWhere`. Quando `agente` informado, retorna apenas uma linha. Quando `has_geo` informado, filtra visitas com/sem coordenadas antes de agregar por agente.

---

## Comportamento esperado

| Filtro ativo | Cards atualizam? | Aba "Por Agente" filtra? | Tabela filtra? |
|---|---|---|---|
| Equipe | Sim | Sim | Sim |
| Ano / Mês | Sim | Sim | Sim |
| Agente | Sim | Sim (só aquele agente) | Sim |
| Desfecho | Sim | Não | Sim |
| Geolocalização | Sim | Sim | Sim |

> **Desfecho** não afeta a aba "Por Agente" porque essa aba já mostra o breakdown de cada desfecho por agente — filtrar por desfecho seria redundante.

---

## Arquivos alterados

| Arquivo | Natureza da mudança |
|---|---|
| `sysdoc_front/src/components/monitor-aps/VisitasAcs.js` | Novo card Ausentes, mover selects, novos deps nos useEffects, reset de filtroAgente, cor de Cidadãos |
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Estender `buildWhere`, `resumo`, `agentes` |

---

## O que NÃO muda

- Endpoints `index`, `lista`, `mapa`, `show`, `equipes` — sem alteração.
- Componentes `VisitaDetalheModal`, `MapaVisitas`, `MapaVisitasPage` — sem alteração.
- Estrutura de cache do frontend (`monitorApsCache`) — só as chaves mudam.
- Autenticação, rotas, migrations — nada.
