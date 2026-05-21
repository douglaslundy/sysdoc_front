# agents/08-visitas-mapa-agent.md

## Nome
`visitas-mapa-agent`

## Papel
Responsável por criar a **tela de Mapa da Cidade** com os pins georreferenciados das visitas ACS/TACS. Usa Leaflet.js + OpenStreetMap (100% gratuito, sem API key). Reutiliza o `VisitaDetailModal` criado pelo Agent 07.

## Escopo

Este agente cria:
1. Componente `MapaVisitas.js` — mapa Leaflet com pins coloridos, filtros, tooltip, legenda
2. Page wrapper `pages/monitor-aps/visitas/mapa.js`
3. Link "Mapa" no submenu de visitas

**Não recria** o `VisitaDetailModal` — importa de `../visitas/VisitaDetailModal`.

---

## Dependências

- Agent 07 executado (react-leaflet + leaflet instalados, VisitaDetailModal criado)
- Agent 06 executado (endpoint `/visitas/mapa` retornando dados com lat/lng)
- Leaflet CSS e ícones já configurados em `_app.js` e `public/leaflet/`

---

## Tarefas

### TAREFA 1: Criar o componente `MapaVisitas.js`

Arquivo: `sysdoc_front/src/components/monitor-aps/visitas/MapaVisitas.js`

```jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    Box, Grid, FormControl, InputLabel, Select, MenuItem,
    Typography, CircularProgress, Paper,
} from '@mui/material';
import { api } from '../../../services/api';

// Importação dinâmica para evitar SSR do Leaflet
const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer),  { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false });
const Tooltip       = dynamic(() => import('react-leaflet').then(m => m.Tooltip),       { ssr: false });

import VisitaDetailModal from './VisitaDetailModal';

// Coordenadas de Ilicínea/MG
const CITY_CENTER = [-20.9417, -45.8306];
const DEFAULT_ZOOM = 13;

// Paletas de cor
const TEAM_COLORS  = ['#2196F3','#FF5722','#4CAF50','#9C27B0','#FF9800','#00BCD4','#F44336','#795548'];
const AGENT_COLORS = ['#1565C0','#AD1457','#2E7D32','#6A1B9A','#E65100','#00695C','#4527A0','#558B2F'];
const OUTCOME_COLORS = {
    1: '#4CAF50',
    2: '#FFC107',
    3: '#F44336',
    default: '#9E9E9E',
};

const MONTHS = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function buildColorMap(items, palette) {
    const map = {};
    items.forEach((key, idx) => {
        map[key] = palette[idx % palette.length];
    });
    return map;
}

function getPinColor(visit, mode, colorMap) {
    if (mode === 'all') {
        return colorMap[visit.team_ine] ?? '#607D8B';
    }
    if (mode === 'team') {
        return colorMap[visit.agent_name] ?? '#607D8B';
    }
    // mode === 'agent'
    return OUTCOME_COLORS[visit.outcome_code] ?? OUTCOME_COLORS.default;
}

export default function MapaVisitas() {
    const [mode, setMode]           = useState('all');    // 'all' | 'team' | 'agent'
    const [selectedIne, setIne]     = useState('');
    const [selectedAgent, setAgent] = useState('');
    const [ano, setAno]             = useState(currentYear);
    const [mes, setMes]             = useState(new Date().getMonth() + 1);

    const [equipes, setEquipes]     = useState([]);
    const [agentes, setAgentes]     = useState([]);
    const [pins, setPins]           = useState([]);
    const [loading, setLoading]     = useState(false);
    const [colorMap, setColorMap]   = useState({});
    const [legendItems, setLegend]  = useState([]);

    const [detailOpen, setDetailOpen]   = useState(false);
    const [selectedVisita, setSelected] = useState(null);

    // Carregar equipes uma vez
    useEffect(() => {
        api.get('/monitor-aps/visitas/equipes')
            .then(r => setEquipes(r.data.data ?? []))
            .catch(() => {});
    }, []);

    // Carregar agentes quando equipe muda
    useEffect(() => {
        if (!selectedIne) { setAgentes([]); setAgent(''); return; }
        api.get('/monitor-aps/visitas/agentes', { params: { ine: selectedIne } })
            .then(r => setAgentes(r.data.data ?? []))
            .catch(() => {});
        setAgent('');
    }, [selectedIne]);

    // Buscar pins do mapa
    useEffect(() => {
        const params = {
            ano,
            mes,
            ine:    selectedIne  || undefined,
            agente: selectedAgent || undefined,
        };

        setLoading(true);
        api.get('/monitor-aps/visitas/mapa', { params })
            .then(r => {
                const data = r.data.data ?? [];
                setPins(data);
                updateColors(data);
            })
            .catch(() => setPins([]))
            .finally(() => setLoading(false));
    }, [ano, mes, selectedIne, selectedAgent, mode]);

    const updateColors = useCallback((data) => {
        if (mode === 'all') {
            const teams = [...new Set(data.map(d => d.team_ine))];
            const map   = buildColorMap(teams, TEAM_COLORS);
            setColorMap(map);
            const names = equipes.reduce((acc, e) => {
                if (map[e.ine]) acc[e.ine] = e.name;
                return acc;
            }, {});
            setLegend(teams.map((ine, i) => ({
                label: names[ine] ?? ine,
                color: TEAM_COLORS[i % TEAM_COLORS.length],
            })));
        } else if (mode === 'team') {
            const agents = [...new Set(data.map(d => d.agent_name))];
            const map    = buildColorMap(agents, AGENT_COLORS);
            setColorMap(map);
            setLegend(agents.map((name, i) => ({
                label: name,
                color: AGENT_COLORS[i % AGENT_COLORS.length],
            })));
        } else {
            // agent mode — outcome colors
            setColorMap({});
            setLegend([
                { label: 'Visita realizada',       color: OUTCOME_COLORS[1] },
                { label: 'Morador não encontrado', color: OUTCOME_COLORS[2] },
                { label: 'Morador se recusou',     color: OUTCOME_COLORS[3] },
                { label: 'Outros',                 color: OUTCOME_COLORS.default },
            ]);
        }
    }, [mode, equipes]);

    const handlePinClick = useCallback(async (pin) => {
        try {
            const { data } = await api.get(`/monitor-aps/visitas/${pin.id}`);
            setSelected(data);
            setDetailOpen(true);
        } catch {
            // silencioso
        }
    }, []);

    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === 'all') { setIne(''); setAgent(''); }
        if (newMode === 'team') { setAgent(''); }
    };

    return (
        <Box>
            {/* Filtros */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Modo</InputLabel>
                            <Select
                                value={mode}
                                label="Modo"
                                onChange={e => handleModeChange(e.target.value)}
                            >
                                <MenuItem value="all">Todos</MenuItem>
                                <MenuItem value="team">Por Equipe</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {(mode === 'team' || mode === 'agent') && (
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Equipe</InputLabel>
                                <Select
                                    value={selectedIne}
                                    label="Equipe"
                                    onChange={e => { setIne(e.target.value); setMode('team'); }}
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    {equipes.map(eq => (
                                        <MenuItem key={eq.ine} value={eq.ine}>{eq.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {selectedIne && (
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Agente</InputLabel>
                                <Select
                                    value={selectedAgent}
                                    label="Agente"
                                    onChange={e => {
                                        setAgent(e.target.value);
                                        setMode(e.target.value ? 'agent' : 'team');
                                    }}
                                >
                                    <MenuItem value="">Todos os agentes</MenuItem>
                                    {agentes.map(ag => (
                                        <MenuItem key={ag.name} value={ag.name}>{ag.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid item xs={6} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Ano</InputLabel>
                            <Select value={ano} label="Ano" onChange={e => setAno(e.target.value)}>
                                {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Mês</InputLabel>
                            <Select value={mes} label="Mês" onChange={e => setMes(e.target.value)}>
                                {MONTHS.map((m, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Mapa */}
            <Box sx={{ position: 'relative', height: 'calc(100vh - 280px)', minHeight: 500, borderRadius: 2, overflow: 'hidden' }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.6)',
                    }}>
                        <CircularProgress />
                    </Box>
                )}

                {typeof window !== 'undefined' && (
                    <MapContainer
                        center={CITY_CENTER}
                        zoom={DEFAULT_ZOOM}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {pins.map(pin => (
                            <CircleMarker
                                key={pin.id}
                                center={[pin.lat, pin.lng]}
                                radius={7}
                                pathOptions={{
                                    color: '#fff',
                                    weight: 1.5,
                                    fillColor: getPinColor(pin, mode, colorMap),
                                    fillOpacity: 0.9,
                                }}
                                eventHandlers={{ click: () => handlePinClick(pin) }}
                            >
                                <Tooltip sticky>
                                    <Box>
                                        <Typography variant="caption" display="block" fontWeight={600}>
                                            {pin.agent_name}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            {pin.team_name}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            {pin.visited_at
                                                ? new Date(pin.visited_at).toLocaleString('pt-BR')
                                                : '—'}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            {pin.outcome_label}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                )}

                {/* Legenda */}
                <Box sx={{
                    position: 'absolute', bottom: 24, left: 8, zIndex: 1000,
                    bgcolor: 'background.paper', borderRadius: 1, p: 1,
                    boxShadow: 2, maxWidth: 200,
                }}>
                    <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                        Legenda
                    </Typography>
                    {legendItems.map(item => (
                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                            <Box sx={{
                                width: 12, height: 12, borderRadius: '50%',
                                bgcolor: item.color, flexShrink: 0,
                            }} />
                            <Typography variant="caption" noWrap>{item.label}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Contador */}
                <Box sx={{
                    position: 'absolute', top: 8, right: 8, zIndex: 1000,
                    bgcolor: 'background.paper', borderRadius: 1, px: 1.5, py: 0.5,
                    boxShadow: 1,
                }}>
                    <Typography variant="caption">
                        {pins.length} visita{pins.length !== 1 ? 's' : ''} no mapa
                    </Typography>
                </Box>
            </Box>

            <VisitaDetailModal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                visita={selectedVisita}
            />
        </Box>
    );
}
```

---

### TAREFA 2: Criar a page wrapper do mapa

Arquivo: `sysdoc_front/pages/monitor-aps/visitas/mapa.js`

```javascript
import { Box, Typography } from '@mui/material';
import MapaVisitas from '../../../src/components/monitor-aps/visitas/MapaVisitas';

export default function MapaVisitasPage() {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" fontWeight={600} mb={2}>
                Mapa de Visitas ACS/TACS
            </Typography>
            <MapaVisitas />
        </Box>
    );
}
```

---

### TAREFA 3: Adicionar link "Mapa" ao menu de visitas

No menu lateral (mesmo arquivo editado pelo Agent 07), adicionar após "Visitas ACS":

```javascript
{
    title: 'Mapa de Visitas',
    href: '/monitor-aps/visitas/mapa',
    icon: 'map',  // feather icon
},
```

---

### TAREFA 4: Testar no browser

1. Acessar `/monitor-aps/visitas/mapa`
2. Verificar que o mapa de Ilicínea carrega (tiles OpenStreetMap)
3. Verificar pins coloridos por equipe (modo Todos)
4. Selecionar uma equipe → pins devem mudar para cores por agente
5. Selecionar um agente → pins devem mudar para cores por desfecho
6. Passar cursor sobre um pin → tooltip com agente, equipe, data/hora, desfecho
7. Clicar em um pin → modal de detalhe abre com as informações
8. Verificar legenda atualiza conforme o modo
9. Verificar que o contador de pins (ex: "12 visitas no mapa") é exibido
10. Testar filtros Ano e Mês

**Se não aparecerem pins:**
- Verificar no console do browser se a chamada `/monitor-aps/visitas/mapa` retornou dados
- Verificar se há registros com lat/lng no banco: `SELECT COUNT(*) FROM tb_fat_visita_domiciliar WHERE nu_latitude IS NOT NULL`
- Se não houver dados com geolocalização, criar um dado de teste para validar o mapa

---

### TAREFA 5: Commit

```bash
git add sysdoc_front/src/components/monitor-aps/visitas/MapaVisitas.js
git add sysdoc_front/pages/monitor-aps/visitas/mapa.js
git commit -m "feat(monitor-aps): mapa de visitas com pins georreferenciados

Leaflet + OpenStreetMap (gratuito)
Cores por equipe / agente / desfecho conforme modo ativo
Tooltip no hover, modal ao clicar no pin
Legenda dinâmica e contador de visitas no mapa"
```

---

## Critérios de Aceitação

- [ ] Mapa OpenStreetMap carrega centralizado em Ilicínea/MG
- [ ] Pins aparecem nas posições corretas (lat/lng reais do banco)
- [ ] Modo "Todos": cada equipe com cor distinta
- [ ] Modo "Por Equipe": cada agente com cor distinta
- [ ] Modo "Por Equipe + Agente": pins coloridos por desfecho da visita
- [ ] Legenda atualiza conforme o modo ativo
- [ ] Tooltip no hover exibe: agente, equipe, data/hora, desfecho
- [ ] Click no pin abre `VisitaDetailModal` com dados corretos
- [ ] Modal inclui mapa small + painel street view (com fallback)
- [ ] Filtros Ano e Mês atualizam os pins
- [ ] Filtro Equipe filtra pins da equipe selecionada
- [ ] Filtro Agente filtra pins do agente selecionado
- [ ] Sem erros de console relacionados ao Leaflet ou ao mapa
