# agents/03-frontend-dashboard-agent.md

## Nome
`frontend-dashboard-agent`

## Papel
Responsável por criar toda a **interface do usuário** do módulo Monitor APS: dashboard principal, páginas de indicadores, tabelas e configurações. O design deve ser profissional, voltado para gestores de saúde, e responsivo para telas desktop (uso predominante em secretarias de saúde).

## Dependências
- `indicators-service-agent` deve estar completo (API funcionando)
- Sistema existente já possui componentes de layout (sidebar, header) — reutilizar

## Paleta de Cores (baseada no SUS/Saúde)

```css
:root {
  --color-primary: #1351B4;      /* Azul Gov.br */
  --color-success: #168821;      /* Verde */
  --color-warning: #FFCD07;      /* Amarelo */
  --color-danger: #E52207;       /* Vermelho */
  --color-info: #0072B7;         /* Azul info */
  --color-otimo: #168821;
  --color-bom: #1351B4;
  --color-suficiente: #FF8C00;
  --color-regular: #E52207;
}
```

## Tarefas

### TAREFA 1: Dashboard Principal

Arquivo: `modules/monitor-aps/frontend/src/pages/Dashboard.jsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Monitor APS — Cofinanciamento Federal                    [🔔 2] │
│  Ilicínea/MG  |  2° Quadrimestre 2025 (mai-ago)  |  eSF: 2 eq. │
├──────────┬──────────┬──────────┬──────────────────────────────┤
│ REPASSE  │ VÍNCULO  │QUALIDADE │     ALERTAS                  │
│ESTIMADO  │ STATUS   │ STATUS   │  ⚠️ ESF Vila Nova:            │
│R$68.000  │  🟡 Bom  │  🟠 Suf. │  Cuidado Criança abaixo meta │
│/mês      │          │          │  ⚠️ eSB: Cadastros desatuali. │
├──────────┴──────────┴──────────┴──────────────────────────────┤
│           MAPA DE CALOR DOS 15 INDICADORES                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ IND  │ Nome                    │ ESF1    │ ESF2    │ MUNI  │ │
│  │  1   │ Mais Acesso             │  🟢 78% │  🔵 65% │  71%  │ │
│  │  2   │ Cuidado Criança         │  🟠 52% │  🟢 81% │  67%  │ │
│  │  3   │ Gestante/Puérpera       │  🟢 72% │  🔵 68% │  70%  │ │
│  │  4   │ Hipertensão             │  🔴 35% │  🟠 48% │  42%  │ │
│  │  5   │ Diabetes                │  🔴 31% │  🟠 45% │  38%  │ │
│  │  ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
├──────────────────────────┬──────────────────────────────────────┤
│  EVOLUÇÃO REPASSE (R$)   │  DISTRIBUIÇÃO POR CLASSIFICAÇÃO      │
│  [Gráfico linha trimest.]│  [Donut chart: ótimo/bom/suf/reg]    │
└──────────────────────────┴──────────────────────────────────────┘
```

Componentes necessários:
- `ScoreCard` — card com valor, rótulo, ícone e variação
- `AlertPanel` — painel lateral de alertas de risco de bloqueio
- `HeatmapTable` — tabela com células coloridas por classificação
- `RepasseLineChart` — gráfico de linha do repasse histórico (Recharts)
- `ClassificacaoDonut` — gráfico donut da distribuição de classificações

### TAREFA 2: Página de Vínculo e Acompanhamento

Arquivo: `modules/monitor-aps/frontend/src/pages/VinculoTerritorial.jsx`

Seções:
1. **Resumo de Cadastros** (cards)
   - Total de cadastros individuais
   - Total com cadastro domiciliar (vinculado)
   - % de cadastros atualizados (últimos 12 meses)
   - Pontuação calculada da equipe

2. **Tabela por Equipe**
   | INE | Nome | Cadastros Ind. | Cad. Dom. | % Atualiz. | Pontuação | Classif. |
   
3. **Grupos Prioritários** (cards com barras de progresso)
   - 👶 Crianças < 5 anos: X de Y acompanhadas (%)
   - 👴 Idosos ≥ 60 anos: X de Y acompanhados (%)
   - 💰 Bolsa Família: X de Y acompanhados (%)
   - ♿ BPC: X de Y acompanhados (%)

4. **Comparativo com Parâmetros**
   - Barra: cadastros da equipe vs. parâmetro de referência vs. teto máximo
   - Se ultrapassar o teto: alerta vermelho (impedido de atingir "ótimo")

### TAREFA 3: Página de Indicadores de Qualidade

Arquivo: `modules/monitor-aps/frontend/src/pages/IndicadoresQualidade.jsx`

**Filtros no topo**:
- Seletor de Equipe (INE ou "Consolidado Municipal")
- Seletor de Bloco (Todos / eSF+eAP / eMulti / eSB)
- Ano + Quadrimestre

**Grid de Cards** (3 colunas desktop, 1 coluna mobile):

```
┌─────────────────────────────────────┐
│ IND 2: Cuidado Longitudinal Criança │
│         BLOCO: eSF / eAP            │
│                                     │
│      ╔══════════════╗               │
│      ║   🔵 61,8%   ║  ← Gauge      │
│      ╚══════════════╝               │
│                                     │
│  Numerador:   42 crianças          │
│  Denominador: 68 crianças < 2 anos │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  Suf.  Bom   Ótimo                 │
│  30%   60%   80%                   │
│  ▲                  ←posição atual  │
│                                     │
│  [Ver detalhes]                     │
└─────────────────────────────────────┘
```

**Modal de Detalhes** (ao clicar em "Ver detalhes"):
- Descrição completa do indicador
- Tabela de subindicadores
- Fórmula de cálculo
- Link para a ficha técnica do MS
- Tabela de evolução histórica (quadrimestres anteriores)
- Recomendações para melhoria

### TAREFA 4: Página por Equipe

Arquivo: `modules/monitor-aps/frontend/src/pages/PorEquipe.jsx`

**Seletor de Equipe** (topo)

**Cards de Classificação por Componente**:
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ VÍNCULO      │ │ QUALIDADE    │ │ REPASSE EST. │
│              │ │              │ │              │
│   🟡 BOM     │ │  🔴 REGULAR  │ │  R$ 26.000   │
│  (R$ 6.000)  │ │  (R$ 2.000)  │ │   /mês       │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Gráfico Radar** (todos os 15 indicadores em radar chart):
- Área preenchida para o valor atual
- Linha pontilhada para a meta "bom"
- Usando Recharts RadarChart

**Histórico Quadrimestral** (gráfico de linha):
- Eixo X: Quadrimestres
- Eixo Y: Classificação (4=ótimo, 3=bom, 2=suficiente, 1=regular)
- Uma linha por componente (vínculo, qualidade)

### TAREFA 5: Componentes Reutilizáveis

**`IndicadorCard.jsx`**
```jsx
// Props: id, nome, bloco, percentual, classificacao, numerador, denominador, thresholds
// Exibe gauge, valor, classificação com cor
```

**`ClassificacaoBadge.jsx`**
```jsx
// Props: classificacao ('otimo'|'bom'|'suficiente'|'regular')
// Badge colorido com ícone
```

**`ProgressIndicador.jsx`**
```jsx
// Props: valor, metas: {suficiente, bom, otimo}
// Barra de progresso com marcações das metas
```

**`GaugeChart.jsx`**
```jsx
// Props: value (0-100), classificacao
// Velocímetro com agulha usando Recharts PieChart customizado
```

**`AlertaBloqueio.jsx`**
```jsx
// Props: equipe, motivo, tipoSuspensao ('proporcional'|'total')
// Card de alerta vermelho/amarelo
```

**`ExportButton.jsx`**
```jsx
// Props: data, filename, format ('csv'|'pdf')
// Botão para exportar dados da tabela atual
```

### TAREFA 6: Serviço de API (Frontend)

Arquivo: `modules/monitor-aps/frontend/src/services/monitorApsApi.js`

```javascript
const BASE_URL = '/api/monitor-aps';

export const monitorApsApi = {
  // Configuração
  getStatus: () => fetch(`${BASE_URL}/config/status`).then(r => r.json()),
  testConnection: (config) => fetch(`${BASE_URL}/config/test`, {
    method: 'POST', body: JSON.stringify(config),
    headers: {'Content-Type': 'application/json'}
  }).then(r => r.json()),
  saveConfig: (config) => fetch(`${BASE_URL}/config/save`, {
    method: 'POST', body: JSON.stringify(config),
    headers: {'Content-Type': 'application/json'}
  }).then(r => r.json()),

  // Indicadores
  getResumo: (ano, quad) => fetch(`${BASE_URL}/indicadores/resumo?ano=${ano}&quadrimestre=${quad}`).then(r => r.json()),
  getVinculo: (ano, quad, ine) => fetch(`${BASE_URL}/indicadores/vinculo?ano=${ano}&quadrimestre=${quad}${ine ? `&ine=${ine}` : ''}`).then(r => r.json()),
  getQualidade: (ano, quad, ine, bloco) => fetch(`${BASE_URL}/indicadores/qualidade?ano=${ano}&quadrimestre=${quad}${ine ? `&ine=${ine}` : ''}${bloco ? `&bloco=${bloco}` : ''}`).then(r => r.json()),
  getRepasse: (ano, quad) => fetch(`${BASE_URL}/indicadores/repasse?ano=${ano}&quadrimestre=${quad}`).then(r => r.json()),
  getHistorico: (ine, indicadorId, anos) => fetch(`${BASE_URL}/indicadores/historico?ine=${ine}&indicador_id=${indicadorId}&anos=${anos}`).then(r => r.json()),
};
```

## Critérios de Aceitação

- [ ] Dashboard principal carrega em menos de 5 segundos
- [ ] Todos os 15 indicadores são exibidos com cor e classificação corretos
- [ ] Filtros de equipe e período funcionam em todas as páginas
- [ ] Exportação CSV funciona para tabelas de indicadores
- [ ] Alertas de bloqueio financeiro são exibidos claramente
- [ ] Design é responsivo (funciona em 1366x768 que é resolução típica de PCs de secretarias)
- [ ] Gauge charts exibem corretamente em todos os navegadores modernos
- [ ] Estado de carregamento (loading skeleton) é exibido enquanto dados carregam
- [ ] Estado de erro é tratado graciosamente (banco desconectado, etc.)
