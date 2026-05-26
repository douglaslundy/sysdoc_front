# Spec: Monitor APS / e-SUS — Bugs + Features (2026-05-26)

## Visão Geral

Correção de 4 bugs nas páginas do Monitor APS que integram com o banco PostgreSQL do e-SUS PEC,
mais 1 card novo e 1 página nova de cidadãos ativos. Implementação em 3 etapas independentes.

Repositório: monorepo com `sysdoc_back/` (Laravel 10) e frontend Next.js 12 na raiz.
Conexão ao e-SUS: `MonitorApsBaseController::db()` → conexão runtime PostgreSQL configurada em `monitor_aps_configs`.

---

## Etapa 1 — Bugs

### Bug 1 — `/monitor-aps/fila-esus`: remover input de CNES

**Problema:** `FilaEsus.js` exibe uma tela de entrada de CNES antes de carregar a fila. No ambiente
autenticado o usuário não deve precisar digitar o CNES — o sistema deve descobri-lo automaticamente.

**Solução:**

_Backend:_ Novo método `unidades()` em `PainelEsusController`, rota autenticada:
```
GET /painel-esus/unidades
```
- Consulta `tb_unidade_saude` no banco e-SUS
- Usa `firstExistingColumn('tb_unidade_saude', ['co_cnes', 'nu_cnes', 'co_unico_saude'])` para coluna do CNES
- Usa `firstExistingColumn('tb_unidade_saude', ['no_unidade_saude', 'ds_nome', 'no_estabelecimento'])` para nome
- Retorna `{ unidades: [ { cnes: string, nome: string } ] }`
- Rota adicionada em `api.php` dentro do grupo `painel-esus`

_Frontend (`FilaEsus.js`):_
- No mount, chama `painelEsusApi.unidades()`
- Se 1 unidade → usa o CNES automaticamente (sem input do usuário)
- Se >1 unidade → exibe `<Select>` discreto no topo da página para escolher
- Remove completamente o bloco `if (!cnes) { return <form...> }`
- Estado inicial do `cnes` passa a ser `null` aguardando a resposta do endpoint

---

### Bug 2 — `/painel-esus`: "Erro ao consultar o banco de dados"

**Problema:** `PainelEsusController::validarCnes()` usa `co_cnes` e `no_unidade_saude` fixos em
`tb_unidade_saude`. Se o banco e-SUS tiver nomes de colunas diferentes, a query lança exceção e
retorna "Erro ao consultar o banco de dados." ao frontend.

**Solução:**

_Backend (`PainelEsusController.php`):_
- Extrair um método privado `resolveUnidadeColumns()` similar ao `resolveListaColumns()` já existente:
  ```php
  private function resolveUnidadeColumns(): array {
      return [
          'cnesCol' => $this->firstExistingColumn('tb_unidade_saude',
              ['co_cnes', 'nu_cnes', 'co_unico_saude']) ?? 'co_cnes',
          'nomeCol' => $this->firstExistingColumn('tb_unidade_saude',
              ['no_unidade_saude', 'ds_nome', 'no_estabelecimento']) ?? 'no_unidade_saude',
      ];
  }
  ```
- Aplicar em `validarCnes()`, `estado()` e no novo `unidades()` (Bug 1)

_Frontend:_ sem alterações.

---

### Bug 3 — `/monitor-aps/visitas/mapa`: filtro por CPF/CNS/nome não funciona

**Problema:** `VisitaAcsController::mapa()` aplica o filtro via subquery em `tb_fat_cad_individual`
usando colunas fixas `nu_cpf`, `nu_cns`, `no_cidadao`. Se o schema tiver nomes diferentes, o filtro
falha silenciosamente ou lança erro.

**Solução:**

_Backend (`VisitaAcsController.php`, método `mapa()`):_
- Antes do bloco `if ($request->busca)`, resolver colunas:
  ```php
  $cpfCol    = $this->firstExistingColumn('tb_fat_cad_individual', ['nu_cpf', 'co_cpf']);
  $cnsCol    = $this->firstExistingColumn('tb_fat_cad_individual', ['nu_cns', 'co_cns']);
  $nomeCol   = $this->firstExistingColumn('tb_fat_cad_individual', ['no_cidadao', 'no_nome']);
  ```
- Usar essas variáveis nas subqueries (com fallback para os nomes originais se `null`)
- Comportamento resultante: apenas os pins dos cidadãos encontrados aparecem no mapa

_Frontend:_ sem alterações (o `useEffect` já passa `busca` corretamente).

---

### Bug 4 — `/monitor-aps/visitas`: filtros não aplicados ao mapa

**Problema:** Em `VisitasAcs.js`, o `useEffect` que carrega pontos do mapa (aba "mapa") envia apenas
`ano`, `mes` e `ine`, ignorando `filtroAgente`, `filtroDesfecho` e `filtroGeo`.

**Solução:**

_Frontend (`VisitasAcs.js`, `useEffect` do mapa, linhas ~185–200):_
```js
// ANTES
useEffect(() => {
    if (aba !== 'mapa') return;
    const params = new URLSearchParams({ ano, mes });
    if (ine) params.set('ine', ine);
    ...
}, [aba, ano, mes, ine]);

// DEPOIS
useEffect(() => {
    if (aba !== 'mapa') return;
    const params = new URLSearchParams({ ano, mes });
    if (ine)            params.set('ine', ine);
    if (filtroAgente)   params.set('agente', filtroAgente);
    if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
    if (filtroGeo)      params.set('has_geo', filtroGeo);
    ...
}, [aba, ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);
```

_Backend:_ sem alterações (o endpoint `mapa()` já aceita todos esses parâmetros).

---

## Etapa 2 — Card: cidadãos cadastrados por agente

### Contexto

O link entre ACS e cidadão é `tb_fat_cad_individual.co_dim_profissional` →
`tb_dim_profissional.co_seq_dim_profissional`. O ACS que registrou/é responsável pelo cadastro
individual está nesse campo.

### Backend — novo método em `VisitaAcsController`

Endpoint: `GET /monitor-aps/visitas/responsabilidade?ine=X`

```sql
SELECT
    dp.no_profissional                         AS agente,
    dp.nu_cns                                  AS cns,
    de.nu_ine,
    de.no_equipe,
    COUNT(DISTINCT fci.co_fat_cidadao_pec)     AS cadastrados
FROM tb_fat_cad_individual fci
JOIN tb_dim_equipe       de ON de.co_seq_dim_equipe       = fci.co_dim_equipe
LEFT JOIN tb_dim_profissional dp ON dp.co_seq_dim_profissional = fci.co_dim_profissional
WHERE fci.st_ficha_inativa = 0
  AND de.st_registro_valido = 1
  [AND de.nu_ine = ?]
GROUP BY dp.no_profissional, dp.nu_cns, de.nu_ine, de.no_equipe
ORDER BY cadastrados DESC
```

Retorna: `{ responsabilidade: [ { agente, cns, nu_ine, no_equipe, cadastrados } ] }`

Rota em `api.php` (dentro do grupo `monitor-aps/visitas`):
```php
Route::get('/responsabilidade', [VisitaAcsController::class, 'responsabilidade']);
```

### Frontend — `VisitasAcs.js`, aba "Por Agente"

- Ao entrar na aba `agente`, dispara um fetch paralelo em `/visitas/responsabilidade?ine=...`
- Resultado armazenado em estado `responsabilidade: []`
- Na tabela "Por Agente", nova coluna **"Cadastrados"** após "Cidadãos Visitados"
- Cruzamento por `a.agente?.trim().toLowerCase() === r.agente?.trim().toLowerCase()` (nome normalizado)
- Se sem match → exibe `—`
- Sem alteração nos outros estados ou fetchs existentes

---

## Etapa 3 — Página: lista de cidadãos ativos

### Backend — novo `CidadaoAcsController`

Arquivo: `sysdoc_back/app/Http/Controllers/CidadaoAcsController.php`
Estende `MonitorApsBaseController`.

**Endpoint 1:** `GET /monitor-aps/cidadaos?ine=X&profissional_id=Y&busca=Z&page=N&per_page=N`

- `ine`: filtro por equipe (opcional)
- `profissional_id`: `co_seq_dim_profissional` do ACS (opcional)
- `busca`: nome, CPF ou CNS parcial (opcional, mín. 3 chars)
- Paginação servidor: padrão 50/página

Query:
```sql
SELECT
    fci.co_fat_cidadao_pec,
    fci.no_cidadao,
    fci.nu_cpf,
    fci.nu_cns,
    TO_CHAR(fci.dt_nascimento, 'DD/MM/YYYY')           AS data_nascimento,
    DATE_PART('year', AGE(fci.dt_nascimento))::int      AS idade,
    de.nu_ine,
    de.no_equipe,
    dp.co_seq_dim_profissional                          AS profissional_id,
    dp.no_profissional                                  AS agente,
    dp.nu_cns                                           AS cns_agente,
    fci.st_gestante,
    fci.st_hipertensao_arterial                         AS st_has,
    fci.st_diabete                                      AS st_dm,
    CASE WHEN DATE_PART('year', AGE(fci.dt_nascimento)) >= 60
         THEN 1 ELSE 0 END                              AS st_idoso,
    COUNT(*) OVER()                                     AS total_count
FROM tb_fat_cad_individual fci
JOIN tb_dim_equipe       de ON de.co_seq_dim_equipe       = fci.co_dim_equipe
LEFT JOIN tb_dim_profissional dp ON dp.co_seq_dim_profissional = fci.co_dim_profissional
WHERE fci.st_ficha_inativa = 0
  AND de.st_registro_valido = 1
  [AND de.nu_ine = ?]
  [AND fci.co_dim_profissional = ?]
  [AND (fci.no_cidadao ILIKE ? OR fci.nu_cpf = ? OR fci.nu_cns = ?)]
ORDER BY fci.no_cidadao
LIMIT ? OFFSET ?
```

Colunas com nome variável resolvidas via `firstExistingColumn()`:
- `nu_cpf`: `['nu_cpf', 'co_cpf']`
- `nu_cns`: `['nu_cns', 'co_cns']`
- `no_cidadao`: `['no_cidadao', 'no_nome']`
- `st_hipertensao_arterial`: `['st_hipertensao_arterial', 'st_hipertensao']`
- `st_diabete`: `['st_diabete', 'st_diabetes']`

Retorna:
```json
{
  "cidadaos": [...],
  "meta": { "total": N, "page": 1, "per_page": 50, "pages": N }
}
```

**Endpoint 2:** `GET /monitor-aps/cidadaos/agentes?ine=X`

- Lista ACS disponíveis para popular o Select de filtro no frontend
- Query: `tb_dim_profissional` com CBO ACS/TACS, filtrado pelo INE se fornecido
- Retorna: `{ agentes: [ { id: co_seq_dim_profissional, nome, cns } ] }`

Rotas em `api.php`:
```php
Route::prefix('cidadaos')->group(function () {
    Route::get('/',        [CidadaoAcsController::class, 'index']);
    Route::get('/agentes', [CidadaoAcsController::class, 'agentes']);
});
```

### Frontend

**Arquivos novos:**
- `pages/monitor-aps/cidadaos.js` — wrapper simples que renderiza `<CidadaosPage />`
- `src/components/monitor-aps/CidadaosPage.js` — componente principal

**Layout de `CidadaosPage.js`:**

Filtros (topo, mesma linha):
- Select **Equipe** (carregado de `/config/equipes`)
- Select **Agente** (carregado de `/cidadaos/agentes?ine=...` após equipe selecionada; desabilitado sem equipe)
- TextField **Busca** (nome / CPF / CNS, debounce 400 ms, mín. 3 chars)

Tabela paginada (MUI `Table` + `TablePagination`):

| # | Nome | CPF | CNS | Idade | Equipe | Agente | Condições |
|---|------|-----|-----|-------|--------|--------|-----------|
| 1 | ... | ... | ... | 45 a | ESF-1 | ACS João | Gestante · HAS |

- Coluna "Condições": Chips coloridos para cada flag ativa (Gestante=azul, HAS=laranja, DM=roxo, Idoso=verde)
- Paginação: 50/página, server-side
- Estado de loading com `CircularProgress`
- Estado vazio: "Nenhum cidadão encontrado com os filtros aplicados."

**Navegação:** adicionar item "Cidadãos" no menu lateral do Monitor APS (mesmo arquivo que lista Visitas, Qualidade, etc.).

---

## Restrições e premissas

- Todas as queries são somente SELECT — sem escrita no banco e-SUS
- Timeout do statement e-SUS mantido em 25s (`SET statement_timeout = '25s'`)
- Colunas com nome variável por versão do e-SUS PEC sempre resolvidas via `firstExistingColumn()`
- Nenhuma alteração no schema do banco MySQL do sysdoc (sem migrations para Etapas 1–3)
- Não há exportação de CSV/PDF na Etapa 3 (fora do escopo)
- A nova rota `/painel-esus/unidades` é autenticada (dentro do grupo `auth:sanctum`)

---

## Arquivos modificados / criados

### Etapa 1
| Arquivo | Ação |
|---------|------|
| `sysdoc_back/app/Http/Controllers/PainelEsusController.php` | Modificar |
| `sysdoc_back/routes/api.php` | Modificar (1 rota) |
| `src/components/painel-esus/FilaEsus.js` | Modificar |
| `src/services/painelEsusApi.js` | Modificar (1 método novo) |
| `src/components/monitor-aps/VisitasAcs.js` | Modificar (useEffect mapa) |
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Modificar (resolução de colunas em mapa()) |

### Etapa 2
| Arquivo | Ação |
|---------|------|
| `sysdoc_back/app/Http/Controllers/VisitaAcsController.php` | Modificar (método responsabilidade()) |
| `sysdoc_back/routes/api.php` | Modificar (1 rota) |
| `src/components/monitor-aps/VisitasAcs.js` | Modificar (fetch + coluna na tabela) |

### Etapa 3
| Arquivo | Ação |
|---------|------|
| `sysdoc_back/app/Http/Controllers/CidadaoAcsController.php` | Criar |
| `sysdoc_back/routes/api.php` | Modificar (2 rotas) |
| `pages/monitor-aps/cidadaos.js` | Criar |
| `src/components/monitor-aps/CidadaosPage.js` | Criar |
| `src/layouts/sidebar/MenuItems.js` | Modificar (adicionar item Cidadãos) |
