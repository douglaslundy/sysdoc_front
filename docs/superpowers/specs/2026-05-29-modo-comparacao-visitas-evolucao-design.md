# Modo Comparação — Visitas ACS Evolução

**Data:** 2026-05-29  
**Página:** `/monitor-aps/visitas/evolucao`  
**Abordagem escolhida:** A — Duas requisições paralelas + endpoint de anos

---

## Objetivo

Adicionar um botão "Comparar" à página de evolução de visitas ACS que ativa um modo onde o usuário seleciona um ano e configura dois vetores de filtros (equipe, agente, desfecho, geolocalização). O gráfico de linha exibe uma linha por vetor, permitindo cruzamento e comparação de dados.

---

## Comportamento

### Ativação
- Um botão toggle `Comparar` é adicionado à barra de filtros existente, à direita dos dropdowns atuais.
- Ao ser ativado, o modo comparação **substitui completamente** a view atual: os filtros existentes e o gráfico de 3 anos somem.
- Ao ser desativado (botão "Sair da comparação"), o estado padrão é restaurado (sem filtros, gráfico de 3 anos).

### Pré-condições para exibir o gráfico
- Ano selecionado (obrigatório).
- Ao menos um filtro não-padrão configurado em cada vetor.

### Comportamento de cada vetor
- Cada vetor tem 4 filtros independentes: **Equipe**, **Agente**, **Desfecho**, **Geolocalização**.
- Os filtros são combinados (não exclusivos entre si).
- O dropdown **Agente** só aparece quando uma **Equipe** está selecionada (mesma regra da view normal).
- Cada vetor carrega sua própria lista de agentes independentemente.

### Anos disponíveis
- Carregados dinamicamente do banco ao entrar no modo comparação.
- Apenas anos com visitas registradas são exibidos.

### Legenda do gráfico
- Gerada automaticamente a partir dos filtros ativos do vetor.
- Formato: `"{Nome Equipe} · {Nome Agente} · {Desfecho} · {Geo}"` — concatena apenas os filtros não-padrão.
- Exemplo: `"ESF Centro · Realizada"` ou `"ESF Jd. Boa Vista · Maria Silva · Com geo"`.
- Se todos os filtros de um vetor estiverem no padrão ("Todos"), exibe `"Vetor 1"` ou `"Vetor 2"`.

---

## Layout

```
[ Ano: ▼ 2025 ]                               [ ✕ Sair da comparação ]

┌─── Vetor 1 ────────────────────┐  ┌─── Vetor 2 ────────────────────┐
│ Equipe:    [ ▼ ESF Centro    ] │  │ Equipe:    [ ▼ ESF Jd. Boa V. ]│
│ Agente:    [ ▼ Todos         ] │  │ Agente:    [ ▼ Maria Silva     ]│
│ Desfecho:  [ ▼ Realizada     ] │  │ Desfecho:  [ ▼ Todos          ]│
│ Geo:       [ ▼ Todas         ] │  │ Geo:       [ ▼ Com geo        ]│
└────────────────────────────────┘  └────────────────────────────────┘
                        [ Comparar ]
```

- Seletor de Ano: linha única no topo, acima dos dois vetores.
- Vetores: colunas lado a lado com largura igual.
- Botão "Comparar": centralizado abaixo dos dois vetores. Habilitado somente quando pré-condições atendidas.
- Botão "Sair da comparação": canto superior direito do painel.
- Segue o Design System GOV.BR já utilizado na página.

---

## Backend

### Alteração 1 — `VisitaAcsController::evolucao()`
**Arquivo:** `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

- Adicionar parâmetro opcional `?ano` à query string.
- Quando `ano` está presente: retorna apenas os 12 meses daquele ano (uma única série).
- Quando `ano` está ausente: mantém comportamento atual (3 séries: ano atual e os 2 anteriores). Retrocompatível.

### Alteração 2 — Novo método `anosDisponiveis()`
**Arquivo:** `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

```sql
SELECT DISTINCT EXTRACT(YEAR FROM dt_registro)::int AS ano
FROM tb_fat_visita_domiciliar_acs
ORDER BY ano DESC
```

- Rota: `GET /monitor-aps/visitas/evolucao/anos`
- Retorna: `{ "anos": [2025, 2024, 2023, 2022] }`
- Respeita os mesmos filtros de unidade/CNES do contexto autenticado.
- **Atenção:** registrar esta rota **antes** de `GET /evolucao` no `api.php` para evitar conflito de roteamento no Laravel.

---

## Frontend

### Estado adicional em `VisitasEvolucao.js`

```js
modoComparacao: false
anoComparacao: null          // '2025'
anosDisponiveis: []
vetor1: { ine: '', agente: '', desfecho: '', geo: '' }
vetor2: { ine: '', agente: '', desfecho: '', geo: '' }
nomeEquipeV1: '', nomeEquipeV2: ''
nomeAgenteV1: '', nomeAgenteV2: ''
agentesV1: [], agentesV2: []
loadingComparacao: false
erroComparacao: null
```

### Fluxo de dados ao clicar "Comparar"

```
setLoadingComparacao(true)
Promise.all([
  fetchEvolucao({ ano: anoComparacao, ...vetor1 }),
  fetchEvolucao({ ano: anoComparacao, ...vetor2 })
])
.then(([res1, res2]) => {
  setSeries([
    { name: labelVetor(vetor1, nomes1), data: res1.series[0].meses },
    { name: labelVetor(vetor2, nomes2), data: res2.series[0].meses },
  ])
})
```

### Utilitário `labelVetor`

Função pura que recebe os filtros e nomes resolvidos e retorna a string de legenda:

```js
function labelVetor({ ine, agente, desfecho, geo }, { nomeEquipe, nomeAgente }) {
  const partes = []
  if (ine)      partes.push(nomeEquipe)
  if (agente)   partes.push(nomeAgente)
  if (desfecho) partes.push(DESFECHO_LABELS[desfecho])
  if (geo)      partes.push(GEO_LABELS[geo])
  return partes.length ? partes.join(' · ') : null // null → fallback 'Vetor N'
}
```

### Cache

Nenhuma alteração necessária. A chave existente `aps_cache_visitas_evolucao_{ine}_{agente}_{desfecho}_{geo}` precisa incluir o `ano`:

```
aps_cache_visitas_evolucao_{ano}_{ine}_{agente}_{desfecho}_{geo}
```

Verificar se a chave atual já inclui `ano`; se não, ajustar na função de cache.

### Audit

Adicionar evento `COMPARE` ao chamar comparação:

```js
audit('COMPARE', { ano: anoComparacao, vetor1, vetor2 })
```

---

## Cores das séries

- Vetor 1: `#1351B4` (azul — cor já usada para o ano atual)
- Vetor 2: `#168821` (verde — cor já usada para ano -1)

---

## Fora de escopo

- Exportação PDF no modo comparação (não solicitada).
- Mais de 2 vetores.
- Nomear manualmente os vetores.
- Persistência dos filtros do modo comparação entre sessões.
