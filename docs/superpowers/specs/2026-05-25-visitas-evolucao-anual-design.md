# Design: Página Evolução Anual de Visitas ACS/TACS

**Data:** 2026-05-25  
**Projeto:** Sysdoc — Monitor APS  
**Status:** Aprovado

---

## Visão Geral

Nova página no menu Monitor APS exibindo um gráfico de linhas com a evolução mensal das visitas domiciliares realizadas por ACS/TACS ao longo do ano. O gráfico compara o ano atual com os 2 anos anteriores, com uma linha colorida por ano. A página contém apenas o gráfico e os filtros — sem cards de métricas.

---

## Backend

### Novo endpoint

`GET /api/monitor-aps/visitas/evolucao`

**Parâmetros (todos opcionais):**

| Parâmetro | Tipo    | Descrição                          |
|-----------|---------|------------------------------------|
| `ine`     | string  | INE da equipe                      |
| `agente`  | string  | Nome exato do profissional         |
| `desfecho`| int     | 1=Realizada, 2=Recusada, 3=Ausente |
| `has_geo` | string  | `sim` ou `nao`                     |

**Lógica:** O backend calcula automaticamente os 3 anos: `ano_atual`, `ano_atual - 1`, `ano_atual - 2`. Executa uma única query com `t.nu_ano IN (?,?,?)`, agrupa por `nu_ano + nu_mes`, conta visitas. Reutiliza `buildWhere()` e `baseJoins()` já existentes em `VisitaAcsController`.

**Resposta:**
```json
{
  "series": [
    { "ano": 2026, "meses": [120, 134, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { "ano": 2025, "meses": [210, 198, 220, 205, 190, 215, 200, 188, 230, 205, 195, 178] },
    { "ano": 2024, "meses": [180, 165, 190, 175, 160, 185, 170, 155, 200, 178, 168, 152] }
  ]
}
```

Array `meses` tem sempre 12 posições (índice 0 = Janeiro). Meses sem dados retornam `0`.

**Novo método:** `VisitaAcsController::evolucao(Request $request): JsonResponse`

**Nova rota** em `routes/api.php` dentro do grupo `prefix('visitas')`:
```php
Route::get('/evolucao', [VisitaAcsController::class, 'evolucao']);
```

### Validação do request
```php
$request->validate([
    'ine'      => 'nullable|string',
    'agente'   => 'nullable|string',
    'desfecho' => 'nullable|integer|in:1,2,3',
    'has_geo'  => 'nullable|string|in:sim,nao',
]);
```

---

## Frontend

### Novos arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/components/monitor-aps/VisitasEvolucao.js` | Componente principal |
| `pages/monitor-aps/visitas/evolucao.js` | Página Next.js (wrapper) |

### Menu (`src/layouts/sidebar/MenuItems.js`)

Novo item inserido após "Mapa de Visitas":
```js
{ title: "Evolução Anual", icon: "trending-up", href: "/monitor-aps/visitas/evolucao" }
```

### Componente `VisitasEvolucao.js`

**Estrutura:**
1. Header com título "Evolução de Visitas ACS/TACS" + filtros inline
2. `BaseCard` com gráfico de linha ocupando largura total

**Filtros (mesma ordem e padrão do `MapaVisitasPage`):**
- Equipe (`Select` com todas as equipes via `/config/equipes`)
- Agente (`Select`, só visível quando equipe selecionada, via `/visitas/agentes?ano=&mes=&ine=`)
- Desfecho (`Select`: Todos / Realizada / Recusada / Ausente)
- Geolocalização (`Select`: Todas / Com geolocalização / Sem geolocalização)

**Gráfico:**
- Componente: `ApexChartSafe` (dynamic import, SSR false)
- `type="line"`, `height=420`
- Eixo X: `['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']`
- Eixo Y: número de visitas
- 3 séries com cores fixas:
  - Ano atual → `#1351B4` (azul)
  - Ano atual - 1 → `#168821` (verde)
  - Ano atual - 2 → `#FF8C00` (laranja)
- Tooltip tema `dark`, markers habilitados, stroke width 2
- Legenda na parte inferior com os anos como label

**API e cache:**
- Endpoint: `monitorApsApi.get('/visitas/evolucao?' + params)`
- Chave de cache: `` `visitas_evolucao_${ine}_${agente}_${desfecho}_${geo}` ``
- Usa `getCached` / `setCached` do `monitorApsCache` existente
- AbortController para cancelar requests em voo ao mudar filtros

**Página wrapper** (`pages/monitor-aps/visitas/evolucao.js`):
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

---

## Fluxo de Dados

```
Usuário altera filtro
  → AbortController cancela request anterior
  → buildParams() monta URLSearchParams
  → monitorApsApi.get('/visitas/evolucao?...')
  → Backend: buildWhere() + query GROUP BY nu_ano, nu_mes
  → Response: { series: [...] }
  → setCached(key, data)
  → ApexCharts re-renderiza 3 séries
```

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Novo método `evolucao()` |
| `sysdoc_back/routes/api.php` | Nova rota `GET /visitas/evolucao` |
| `sysdoc_front/src/layouts/sidebar/MenuItems.js` | Novo item "Evolução Anual" |

---

## Arquivos Criados

| Arquivo |
|---------|
| `sysdoc_front/src/components/monitor-aps/VisitasEvolucao.js` |
| `sysdoc_front/pages/monitor-aps/visitas/evolucao.js` |
