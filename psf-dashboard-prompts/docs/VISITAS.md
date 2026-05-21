# docs/VISITAS.md — Módulo de Monitoramento de Visitas ACS/TACS

## Visão Geral

Módulo para acompanhamento das visitas domiciliares realizadas pelos Agentes Comunitários de Saúde (ACS) e Técnicos Agentes Comunitários de Saúde (TACS), com consultas diretas ao banco operacional do eSUS PEC.

**Telas:**
1. Lista de Visitas — rota `/monitor-aps/visitas`
2. Mapa da Cidade — rota `/monitor-aps/visitas/mapa`
3. Detalhe da Visita — modal (abre a partir da lista ou do mapa)

---

## Tela 1: Lista de Visitas

### Filtros

| Filtro | Tipo | Regra |
|---|---|---|
| Ano | Select | Obrigatório. Default: ano atual |
| Mês | Select (1–12, labels pt-BR) | Obrigatório. Default: mês atual |
| Equipe | Select (opções via `/visitas/equipes`) | Opcional. "Todas as equipes" |
| Agente | Select (opções via `/visitas/agentes?ine=`) | Habilitado apenas quando equipe selecionada |

### Colunas da Tabela

| Coluna | Dado | Observação |
|---|---|---|
| Agente | `agent_name` | Nome do ACS/TACS |
| Equipe | `team_name` | Nome da equipe |
| Instrumento | `registration_instrument` | Texto mapeado (CDS / PEC / App) |
| Data/Hora | `visited_at` | Formato: dd/MM/yyyy HH:mm |
| Geolocalização | `has_geolocation` | Chip verde "Sim" / cinza "Não" |
| Ação | — | Botão "Ver" → abre VisitaDetailModal |

### Mapeamento de Instrumento de Registro

```javascript
const INSTRUMENT_LABELS = {
  1: 'CDS',
  3: 'PEC',
  4: 'App e-SUS',
};
// Fallback: 'Outro'
```

### Paginação
- Server-side
- `per_page`: 20 registros por página
- Parâmetros: `page`, `per_page`
- Exibir total de registros no título do card

---

## Tela 2: Mapa da Cidade (Leaflet + OpenStreetMap)

### Tecnologia
- **react-leaflet** + **leaflet** (100% gratuito, sem API key)
- Tile: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Centro: Ilicínea/MG — lat: -20.9417, lng: -45.8306
- Zoom inicial: 13

### Filtros do Mapa

| Filtro | Comportamento |
|---|---|
| Modo | "Todos" / "Por Equipe" (Select) |
| Equipe | Aparece quando Modo = "Por Equipe". Select de equipes |
| Agente | Aparece quando equipe selecionada. Select de agentes da equipe |
| Ano | Select. Default: ano atual |
| Mês | Select (1–12). Default: mês atual |

### Regras de Cor dos Pins

#### Modo "Todos"
Cada equipe recebe uma cor da paleta fixa. O sistema identifica equipes pela `team_ine`.

```javascript
const TEAM_COLORS = ['#2196F3','#FF5722','#4CAF50','#9C27B0','#FF9800','#00BCD4','#F44336','#795548'];
// teamIne → TEAM_COLORS[index % TEAM_COLORS.length]
```

#### Modo "Por Equipe" (equipe selecionada, sem agente específico)
Cada agente recebe uma cor da paleta.

```javascript
const AGENT_COLORS = ['#1565C0','#AD1457','#2E7D32','#6A1B9A','#E65100','#00695C','#4527A0','#558B2F'];
// agentName → AGENT_COLORS[index % AGENT_COLORS.length]
```

#### Modo "Por Equipe + Agente" (agente específico selecionado)
Cor por desfecho da visita:

```javascript
const OUTCOME_COLORS = {
  1: '#4CAF50',   // Realizada com sucesso → Verde
  2: '#FFC107',   // Morador não encontrado → Amarelo
  3: '#F44336',   // Recusou / não permitiu → Vermelho
  default: '#9E9E9E', // Outros → Cinza
};
```

### Interação com Pins

- **Hover** → Tooltip com: equipe, agente, data/hora, desfecho (texto)
- **Click** → Abre `VisitaDetailModal` com todos os detalhes + Street View

### Legenda do Mapa
Exibida em canto inferior esquerdo (Leaflet Control). Atualiza dinamicamente conforme o modo ativo:
- Modo Todos: "● Equipe A  ● Equipe B ..."
- Modo Equipe: "● Agente 1  ● Agente 2 ..."
- Modo Agente: "● Realizada  ● Não encontrado  ● Recusou  ● Outros"

---

## Modal: Detalhe da Visita

Componente reutilizado pela lista e pelo mapa.

### Seções

#### 1. Informações da Visita
| Campo | Dado |
|---|---|
| Agente | `agent_name` |
| CBO | `cbo` (com descrição: "ACS" ou "TACS") |
| Equipe | `team_name` |
| Data/Hora | `visited_at` formatado |
| Instrumento | `registration_instrument` (texto) |
| Motivo | `motive_label` (texto mapeado do código) |
| Desfecho | `outcome_label` + cor de status (chip) |

#### 2. Relato / Anotação
Texto completo do campo `ds_anotacao` (ou equivalente). Se vazio, exibir "Nenhum relato registrado".

#### 3. Geolocalização
**Apenas se `has_geolocation = true`:**

**Mapa inline:** Leaflet pequeno (altura 300px) centralizado nas coordenadas, com marker no ponto.

**Street View (Mapillary):**
1. Fazer chamada à Mapillary API com `lat` e `lng` da visita
2. Se retornar imagem próxima (raio ≤ 50m) → exibir via `<img>` com `thumb_2048_url`
3. Se não retornar → mostrar mensagem: *"Visualização de rua não disponível para este local"*

```javascript
// Mapillary API v4 (gratuita — requer access_token obtido em mapillary.com)
const MAPILLARY_TOKEN = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN;
const url = `https://graph.mapillary.com/images?access_token=${MAPILLARY_TOKEN}&fields=id,thumb_2048_url,geometry&closeto=${lng},${lat}&radius=50&limit=1`;
```

---

## Mapeamento de Desfecho (texto)

```javascript
const OUTCOME_LABELS = {
  1: 'Visita realizada',
  2: 'Morador não encontrado',
  3: 'Morador se recusou',
  4: 'Visita por outros meios',
};
// Fallback: 'Desfecho não informado'
```

> ⚠️ Confirmar os códigos reais em produção:
> `SELECT DISTINCT co_dim_desfecho_visita FROM tb_fat_visita_domiciliar LIMIT 10;`

## Mapeamento de Motivo de Visita (texto)

```javascript
const MOTIVE_LABELS = {
  1:  'Acompanhamento de condição de saúde',
  2:  'Cadastramento / atualização cadastral',
  3:  'Egresso de internação',
  4:  'Controle ambiental / vetorial',
  5:  'Convite para atividades coletivas',
  6:  'Orientação / prevenção',
  99: 'Outros',
};
```

> ⚠️ Confirmar os códigos reais em produção.

---

## Variável de Ambiente Adicional

```bash
# sysdoc_front/.env.local
NEXT_PUBLIC_MAPILLARY_TOKEN=     # Token gratuito de mapillary.com/developer
```

Se a variável não estiver configurada, o painel de Street View exibe:
*"Configure NEXT_PUBLIC_MAPILLARY_TOKEN para ativar a visualização de rua."*

---

## Rotas de API (Backend Laravel)

```
GET /api/monitor-aps/visitas            → lista paginada (query: ano, mes, ine?, agente?, page, per_page)
GET /api/monitor-aps/visitas/mapa       → pins para o mapa (query: ano, mes, ine?, agente?)
GET /api/monitor-aps/visitas/{id}       → detalhe completo de uma visita
GET /api/monitor-aps/visitas/equipes    → lista de equipes com ACS
GET /api/monitor-aps/visitas/agentes    → agentes por equipe (query: ine)
```

---

## Regras de Acesso

- Todas as rotas: `auth:sanctum` (mesmo middleware do Monitor APS)
- Nenhuma rota é admin-only: qualquer usuário autenticado pode ver visitas
- Acesso ao eSUS PEC: somente leitura (SELECT)
