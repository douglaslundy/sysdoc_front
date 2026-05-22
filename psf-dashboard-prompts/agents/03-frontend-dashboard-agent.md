# agents/03-frontend-dashboard-agent.md

## Nome
`frontend-dashboard-agent`

## Papel
Responsável por criar toda a **interface do módulo Monitor APS** dentro do **sysdoc_front (Next.js 12)**. O módulo reutiliza o layout, autenticação e componentes MUI já existentes no projeto — sem dependências extras.

## Dependências
- `indicators-service-agent` completo (API Laravel funcionando em `:8000/api/monitor-aps/*`)
- `sysdoc_front` rodando (`npm run dev` na porta 3000)

---

## Estrutura de Arquivos no sysdoc_front

```
sysdoc_front/
├── pages/monitor-aps/
│   ├── index.js          ← Dashboard principal
│   ├── vinculo.js        ← Vínculo e Acompanhamento Territorial
│   ├── qualidade.js      ← 15 Indicadores de Qualidade
│   ├── equipe.js         ← Análise por equipe
│   └── configuracoes.js  ← Configuração da conexão (admin)
│
└── src/
    ├── components/monitor-aps/
    │   ├── Dashboard.js
    │   ├── VinculoTerritorial.js
    │   ├── IndicadoresQualidade.js
    │   ├── PorEquipe.js
    │   └── Configuracoes.js
    │
    └── services/
        └── monitorApsApi.js   ← wrapper do Axios (já existente)
```

---

## Tarefas

### TAREFA 1: Serviço de API (já implementado)

Arquivo: `sysdoc_front/src/services/monitorApsApi.js`

```javascript
import { api } from './api';  // instância Axios com Bearer token

const BASE = '/monitor-aps';

const get  = async (path)       => (await api.get(BASE + path)).data;
const post = async (path, body) => (await api.post(BASE + path, body)).data;

export const monitorApsApi = { get, post };
```

Uso nos componentes:
```javascript
// Resumo do dashboard
const data = await monitorApsApi.get('/indicadores/resumo?ano=2025&quadrimestre=2');

// Testar conexão
const result = await monitorApsApi.post('/config/test', { host, port, database, user, password });
```

### TAREFA 2: Pages (wrapper leve → delega ao componente)

Cada page em `pages/monitor-aps/` é apenas um wrapper MUI Grid:

```javascript
// pages/monitor-aps/index.js
import { Grid } from '@mui/material';
import MonitorApsDashboard from '../../src/components/monitor-aps/Dashboard';

export default function MonitorApsDashboardPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}><MonitorApsDashboard /></Grid>
        </Grid>
    );
}
```

Mesmo padrão para `vinculo.js`, `qualidade.js`, `equipe.js`, `configuracoes.js`.

### TAREFA 3: Dashboard Principal

Arquivo: `sysdoc_front/src/components/monitor-aps/Dashboard.js`

**Layout** (usando MUI Grid + Cards):
```
┌──────────┬──────────┬──────────┬────────────────────────────┐
│ REPASSE  │ VÍNCULO  │QUALIDADE │  ALERTAS                   │
│ESTIMADO  │ STATUS   │ STATUS   │  ⚠ ESF Centro:             │
│R$68.000  │  🟡 Bom  │ 🔴 Reg.  │  Cuidado Criança < meta    │
├──────────┴──────────┴──────────┴────────────────────────────┤
│            MAPA DE CALOR DOS 15 INDICADORES                  │
│  IND │ Nome              │ ESF1    │ ESF2   │ Municipal      │
│   1  │ Mais Acesso       │ 🟢 78%  │ 🔵 65% │   71%         │
│   2  │ Cuidado Criança   │ 🔴 35%  │ 🟢 81% │   58%         │
│  ... │ ...               │ ...     │ ...    │  ...          │
├──────────────────────────┬─────────────────────────────────┤
│  EVOLUÇÃO REPASSE        │  DISTRIBUIÇÃO CLASSIFICAÇÕES     │
│  [ApexCharts linha]      │  [ApexCharts donut]              │
└──────────────────────────┴─────────────────────────────────┘
```

Chamadas de API:
```javascript
monitorApsApi.get(`/indicadores/resumo?ano=${ano}&quadrimestre=${quad}`)
```

### TAREFA 4: Vínculo Territorial

Arquivo: `sysdoc_front/src/components/monitor-aps/VinculoTerritorial.js`

Seções:
1. Cards: total cadastros individuais, domiciliares, % atualizados, pontuação
2. Tabela por equipe: INE | Nome | Cadastros Ind. | Cad. Dom. | % Atualizados | Classificação
3. Cards de grupos prioritários: crianças <5, idosos ≥60, Bolsa Família, BPC

Chamada de API:
```javascript
monitorApsApi.get(`/indicadores/vinculo?ano=${ano}&quadrimestre=${quad}`)
```

### TAREFA 5: Indicadores de Qualidade

Arquivo: `sysdoc_front/src/components/monitor-aps/IndicadoresQualidade.js`

**Filtros**: seletor de equipe (INE), seletor de bloco (eSF/eSB), ano + quadrimestre

**Grid de cards** — para cada indicador:
- Nome + número
- Gauge (ApexCharts radialBar) com percentual atual
- Numerador / denominador
- Barra de metas: suficiente | bom | ótimo
- Badge de classificação colorido
- Botão "Ver detalhes" → accordion/modal com subindicadores

Chamada de API:
```javascript
monitorApsApi.get(`/indicadores/qualidade?ano=${ano}&quadrimestre=${quad}&ine=${ine}&bloco=${bloco}`)
```

### TAREFA 6: Por Equipe

Arquivo: `sysdoc_front/src/components/monitor-aps/PorEquipe.js`

- Seletor de equipe no topo
- Cards de classificação: Vínculo | Qualidade | Repasse Estimado
- Radar chart (ApexCharts) com os 15 indicadores
- Histórico quadrimestral em gráfico de linha

Chamadas de API:
```javascript
monitorApsApi.get(`/indicadores/qualidade?ine=${ine}&ano=${ano}&quadrimestre=${quad}`)
monitorApsApi.get(`/indicadores/historico?ine=${ine}&indicador_id=${id}&anos=2024,2025`)
```

### TAREFA 7: Configurações

Arquivo: `sysdoc_front/src/components/monitor-aps/Configuracoes.js`

**Seção 1: Conexão com o banco**
- Campos: Host, Porta (default 5432), Banco (default esus), Usuário, Senha
- Botão "Testar Conexão" → `POST /api/monitor-aps/config/test`
- Badge de status: Conectado / Desconectado / Não configurado
- Botão "Salvar" → `POST /api/monitor-aps/config/save`

**Seção 2: Município**
- IBGE, Nome, Estrato IED (1-4)

**Seção 3: Período ativo**
- Seletor de ano + quadrimestre (1°=jan-abr / 2°=mai-ago / 3°=set-dez)

**Seção 4: Equipes ativas**
- Tabela carregada após conexão com checkbox por INE

**Seção 5: SQL informativo**
- Caixa somente leitura com o script de criação do usuário `monitor_aps`
- Botão "Copiar SQL"

---

## Paleta de Cores (baseada no SUS/Gov.br)

```javascript
const CORES = {
    otimo:      '#168821',  // verde
    bom:        '#1351B4',  // azul gov.br
    suficiente: '#FF8C00',  // laranja
    regular:    '#E52207',  // vermelho
};
```

---

## Critérios de Aceitação

- [ ] Dashboard carrega em < 5 segundos com banco conectado
- [ ] Todos os 15 indicadores exibidos com cor e classificação corretos
- [ ] Filtros de equipe e período funcionam em todas as páginas
- [ ] Configurações salva/testa conexão corretamente
- [ ] Gauge charts exibem corretamente (ApexCharts radialBar)
- [ ] Reutiliza layout do sysdoc_front (sidebar, header, autenticação)
- [ ] Sem dependências novas no `package.json` — usa MUI e ApexCharts já instalados
- [ ] Estado de erro tratado graciosamente (banco desconectado mostra mensagem clara)
