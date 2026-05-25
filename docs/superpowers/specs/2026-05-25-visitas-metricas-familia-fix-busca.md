# Spec: Métricas de Família em Visitas ACS + Fix do Filtro de Busca no Mapa

**Data:** 2026-05-25  
**Escopo:** `sysdoc_back` (VisitaAcsController.php) + `sysdoc_front` (VisitasAcs.js)  
**Página afetada:** `monitor-aps/visitas`

---

## Contexto

A página de visitas ACS exibe resumo de visitas (cards), uma tabela "Por Agente" e um mapa. O objetivo é adicionar métricas de acompanhamento de famílias e corrigir o filtro de busca por CPF/CNS/nome no mapa.

---

## Definições de Domínio

- **Família** = grupo familiar identificado pelo seu responsável. Cada família tem exatamente um responsável (`st_responsavel_familiar = 1` em `tb_fat_cad_individual`). Os demais membros possuem `co_responsavel_familiar` apontando para o `co_fat_cidadao_pec` do responsável.
- **Família ID** = `CASE WHEN st_responsavel_familiar = 1 THEN co_fat_cidadao_pec ELSE co_responsavel_familiar END`
- **Família acompanhada** = família onde pelo menos um membro (responsável ou qualquer cidadão do grupo) recebeu visita com desfecho **Realizada** (`co_seq_dim_desfecho_visita = 1`) no período.
- **Família recusada/ausente** = idem para desfechos 2 e 3 respectivamente.

---

## 1. Fix: Filtro de Busca no Mapa (MapaVisitasPage.js / mapa())

### Problema

Em `VisitaAcsController::mapa()`, as sub-queries de busca por CPF, CNS e nome incluem `AND st_ficha_inativa = 0`. No PostgreSQL do e-SUS, esta coluna pode ser:
- `boolean`: comparação com inteiro `0` falha silenciosamente.
- `smallint` com `NULL` para registros ativos: `= 0` exclui todos os NULLs.

Resultado: a busca retorna zero registros.

### Fix

Remover `AND st_ficha_inativa = 0` das três sub-queries de busca. A função `citizenNameExpr()` já faz o mesmo JOIN sem esse filtro com sucesso.

**Arquivo:** `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`  
**Método:** `mapa()`  
**Trecho a alterar:** as três sub-queries dentro do bloco `if ($request->busca)`.

---

## 2. Backend: Métricas de Família

### 2.1 Probing de Colunas

Antes de montar qualquer SQL de família, verificar existência das colunas usando `hasColumn()` e `hasTable()`:

| Tabela | Colunas a probar |
|--------|-----------------|
| `tb_fat_cad_individual` | `st_responsavel_familiar` (candidates: `st_responsavel_familiar`) |
| `tb_fat_cad_individual` | `co_responsavel_familiar` (candidates: `co_responsavel_familiar`, `co_fat_cidadao_pec_responsavel`) |

Se alguma coluna não existir, as métricas de família retornam `null` em todos os campos. O frontend trata `null` ocultando as informações.

### 2.2 Expressão SQL do ID de Família

```sql
CASE
    WHEN ci.{st_col} = 1 THEN ci.co_fat_cidadao_pec
    WHEN ci.{resp_col} IS NOT NULL THEN ci.{resp_col}
    ELSE NULL
END
```

Esta expressão é reutilizada em todos os contextos de contagem.

### 2.3 Endpoint `resumo()` — novos campos

**Query adicional** (separada da query de totais para ignorar filtro de desfecho no total):

```sql
SELECT
    COUNT(DISTINCT familia_expr) FILTER (WHERE TRUE)                          AS familias,
    COUNT(DISTINCT familia_expr) FILTER (WHERE d.co_seq_dim_desfecho_visita = 1) AS familias_acompanhadas,
    COUNT(DISTINCT familia_expr) FILTER (WHERE d.co_seq_dim_desfecho_visita = 2) AS familias_recusadas,
    COUNT(DISTINCT familia_expr) FILTER (WHERE d.co_seq_dim_desfecho_visita = 3) AS familias_ausentes
FROM tb_fat_visita_domiciliar v
{baseJoins()}
LEFT JOIN tb_fat_cad_individual ci ON ci.co_fat_cidadao_pec = v.co_fat_cidadao_pec
WHERE {where_sem_desfecho}  -- buildWhere() sem desfecho e sem has_geo
```

O WHERE desta query usa `buildWhere()` apenas com `ano`, `mes`, `ine` e `agente` (sem `desfecho` e sem `has_geo`), garantindo que o total de famílias seja sempre o universo completo.

**Resposta `totais` atualizada:**
```json
{
  "total": 1234,
  "realizadas": 800,
  "recusadas": 200,
  "ausentes": 150,
  "cidadaos": 900,
  "familias": 600,
  "familias_acompanhadas": 420,
  "familias_recusadas": 130,
  "familias_ausentes": 95
}
```

Quando as colunas não existem: `familias`, `familias_acompanhadas`, `familias_recusadas`, `familias_ausentes` = `null`.

### 2.4 Endpoint `agentes()` — novos campos por agente

Adicionar LEFT JOIN e colunas agregadas na query existente:

```sql
LEFT JOIN tb_fat_cad_individual ci ON ci.co_fat_cidadao_pec = v.co_fat_cidadao_pec

-- Adicionado ao SELECT:
COUNT(DISTINCT
    CASE WHEN ci.{st_col} = 1 THEN ci.co_fat_cidadao_pec
         WHEN ci.{resp_col} IS NOT NULL THEN ci.{resp_col}
         ELSE NULL END
) AS familias,

COUNT(DISTINCT
    CASE WHEN d.co_seq_dim_desfecho_visita = 1 THEN
        CASE WHEN ci.{st_col} = 1 THEN ci.co_fat_cidadao_pec
             WHEN ci.{resp_col} IS NOT NULL THEN ci.{resp_col}
             ELSE NULL END
    END
) AS familias_acompanhadas
```

**Resposta por agente atualizada:**
```json
{
  "agente": "NOME DO AGENTE",
  "total": 150,
  "realizadas": 100,
  "familias": 80,
  "familias_acompanhadas": 55,
  "pct_familias": 69,
  ...
}
```

Quando colunas não existem: `familias` e `familias_acompanhadas` = `null`, `pct_familias` = `null`.

---

## 3. Frontend: VisitasAcs.js

### 3.1 Cards — prop `sub` com info de família

O componente `MetricCard` já suporta a prop `sub`. Populá-la condicionalmente (`totais.familias > 0`):

| Card | `sub` exibido |
|------|--------------|
| Realizadas | `"420 famílias acompanhadas (70%)"` |
| Recusadas | `"130 famílias (22%)"` |
| Ausentes | `"95 famílias (16%)"` |

Fórmula do %: `Math.round(familias_X / totais.familias * 100)`.

Ocultar `sub` se `totais.familias` for `null` ou `0`.

### 3.2 Tabela "Por Agente" — 3 colunas novas

Inserir após a coluna `% Realiz.`:

| Coluna | Alinhamento | Valor |
|--------|-------------|-------|
| Famílias | right | `a.familias.toLocaleString()` |
| Fam. Acomp. | right | `a.familias_acompanhadas.toLocaleString()` |
| % Família | right | Chip colorido igual ao `% Realiz.` (verde ≥70%, laranja <70%) |

Se `a.familias === null`, exibir `—` nas três células.

As colunas são renderizadas incondicionalmente no header, mas mostram `—` quando dados não disponíveis. Não ocultar colunas inteiras (evita layout instável).

---

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Fix busca (remover `st_ficha_inativa`), extend `resumo()`, extend `agentes()` |
| `sysdoc_front/src/components/monitor-aps/VisitasAcs.js` | Prop `sub` nos cards, 3 colunas na tabela agentes |

---

## Fora do Escopo

- `MapaVisitasPage.js` (página separada `/monitor-aps/visitas/mapa`): o fix do filtro está no backend, portanto afeta ambas as páginas sem mudança no componente da página de mapa.
- Endpoint `lista()`: não recebe métricas de família (tabela de visitas individuais, não agrupada).
- `evolucao()`: série temporal, não impactada.
