# agents/07-visitas-frontend-list-agent.md

## Nome
`visitas-frontend-list-agent`

## Papel
Responsável por criar a **tela de listagem de visitas** e o **modal de detalhe** no frontend Next.js (sysdoc_front). Consome a API criada pelo Agent 06 e segue os padrões Redux Toolkit do projeto (duck pattern + fetch actions).

## Escopo

Este agente cria:
1. Duck Redux `visitasAcs` — slice com estado de visitas, paginação, seleção
2. Fetch actions para os endpoints de visitas
3. Componente `VisitasList.js` — tabela com filtros e paginação
4. Componente `VisitaDetailModal.js` — modal com detalhe, relato e geolocalização
5. Page wrapper `pages/monitor-aps/visitas.js`
6. Entrada no menu lateral

**Não cria** o mapa (feito pelo Agent 08). O `VisitaDetailModal` será reutilizado pelo Agent 08.

---

## Dependências

- Agent 06 executado e testado (API retornando dados corretos)
- Padrões existentes em `sysdoc_front` (MUI v5, Redux Toolkit, Axios via `src/services/api.js`)

---

## Tarefas

### TAREFA 1: Criar o duck Redux `visitasAcs`

Arquivo: `sysdoc_front/src/store/ducks/visitasAcs/index.js`

```javascript
import { createAction, createReducer } from '@reduxjs/toolkit';

export const addVisitas      = createAction('visitasAcs/addVisitas');
export const addVisita       = createAction('visitasAcs/addVisita');
export const setSelectedVisita = createAction('visitasAcs/setSelectedVisita');
export const setPagination   = createAction('visitasAcs/setPagination');
export const setFilters      = createAction('visitasAcs/setFilters');
export const setEquipes      = createAction('visitasAcs/setEquipes');
export const setAgentes      = createAction('visitasAcs/setAgentes');
export const clearState      = createAction('visitasAcs/clearState');

const initialState = {
    visitas: [],
    selectedVisita: null,
    pagination: null,    // { total, page, per_page, pages }
    filters: {
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        ine: '',
        agente: '',
    },
    equipes: [],
    agentes: [],
};

export default createReducer(initialState, (builder) => {
    builder
        .addCase(addVisitas,       (s, a) => { s.visitas = a.payload; })
        .addCase(addVisita,        (s, a) => { s.selectedVisita = a.payload; })
        .addCase(setSelectedVisita,(s, a) => { s.selectedVisita = a.payload; })
        .addCase(setPagination,    (s, a) => { s.pagination = a.payload; })
        .addCase(setFilters,       (s, a) => { s.filters = { ...s.filters, ...a.payload }; })
        .addCase(setEquipes,       (s, a) => { s.equipes = a.payload; })
        .addCase(setAgentes,       (s, a) => { s.agentes = a.payload; })
        .addCase(clearState,       ()     => initialState);
});
```

Adicionar o reducer ao store em `sysdoc_front/src/store/index.js`:
```javascript
import visitasAcsReducer from './ducks/visitasAcs';
// No combineReducers:
visitasAcs: visitasAcsReducer,
```

---

### TAREFA 2: Criar as fetch actions

Arquivo: `sysdoc_front/src/store/fetchActions/visitasAcs/index.js`

```javascript
import { api } from '../../../services/api';
import {
    addVisitas, addVisita, setPagination,
    setEquipes, setAgentes,
} from '../../ducks/visitasAcs';
import { turnLoading, addAlertMessage } from '../../ducks/Layout';
import { extractApiErrorMessage } from '../helpers';

const BASE = '/monitor-aps/visitas';

export const fetchVisitas = (params) => async (dispatch) => {
    dispatch(turnLoading());
    try {
        const { data } = await api.get(BASE, { params });
        dispatch(addVisitas(data.data));
        dispatch(setPagination(data.meta));
    } catch (error) {
        dispatch(addAlertMessage(
            extractApiErrorMessage(error, 'Não foi possível carregar as visitas.')
        ));
    } finally {
        dispatch(turnLoading());
    }
};

export const fetchVisitaById = (id) => async (dispatch) => {
    dispatch(turnLoading());
    try {
        const { data } = await api.get(`${BASE}/${id}`);
        dispatch(addVisita(data));
    } catch (error) {
        dispatch(addAlertMessage(
            extractApiErrorMessage(error, 'Não foi possível carregar os detalhes da visita.')
        ));
    } finally {
        dispatch(turnLoading());
    }
};

export const fetchEquipes = () => async (dispatch) => {
    try {
        const { data } = await api.get(`${BASE}/equipes`);
        dispatch(setEquipes(data.data));
    } catch {
        // silencioso — não bloqueia a tela
    }
};

export const fetchAgentes = (ine) => async (dispatch) => {
    try {
        const { data } = await api.get(`${BASE}/agentes`, { params: { ine } });
        dispatch(setAgentes(data.data));
    } catch {
        // silencioso
    }
};
```

---

### TAREFA 3: Criar `VisitaDetailModal.js`

Arquivo: `sysdoc_front/src/components/monitor-aps/visitas/VisitaDetailModal.js`

Este componente será reutilizado pelo Agent 08 (mapa). Aceita `visita` (objeto completo) via prop.

```jsx
import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Typography, Chip, Divider, Box, CircularProgress,
} from '@mui/material';
import dynamic from 'next/dynamic';

// Leaflet é client-side only
const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer),  { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });

const OUTCOME_COLORS = {
    1: 'success',
    2: 'warning',
    3: 'error',
};

export default function VisitaDetailModal({ open, onClose, visita }) {
    const [streetViewUrl, setStreetViewUrl] = useState(null);
    const [streetViewLoading, setStreetViewLoading] = useState(false);
    const [streetViewError, setStreetViewError] = useState(false);

    useEffect(() => {
        if (!open || !visita?.has_geolocation || !visita?.lat || !visita?.lng) return;

        const token = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN;
        if (!token) {
            setStreetViewError(true);
            return;
        }

        setStreetViewLoading(true);
        setStreetViewUrl(null);
        setStreetViewError(false);

        fetch(
            `https://graph.mapillary.com/images?access_token=${token}` +
            `&fields=id,thumb_2048_url,geometry&closeto=${visita.lng},${visita.lat}&radius=50&limit=1`
        )
            .then(r => r.json())
            .then(data => {
                const img = data?.data?.[0];
                if (img?.thumb_2048_url) {
                    setStreetViewUrl(img.thumb_2048_url);
                } else {
                    setStreetViewError(true);
                }
            })
            .catch(() => setStreetViewError(true))
            .finally(() => setStreetViewLoading(false));
    }, [open, visita]);

    if (!visita) return null;

    const outcomeColor = OUTCOME_COLORS[visita.outcome_code] ?? 'default';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    background: 'var(--lg-glass-modal)',
                    backdropFilter: 'var(--lg-blur-modal)',
                    border: '0.5px solid var(--lg-border)',
                    borderRadius: '20px',
                },
            }}
        >
            <DialogTitle>Detalhe da Visita</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    {/* Informações da Visita */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Informações da Visita
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Agente</Typography>
                        <Typography>{visita.agent_name} ({visita.cbo_label})</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Equipe</Typography>
                        <Typography>{visita.team_name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Data / Hora</Typography>
                        <Typography>
                            {visita.visited_at
                                ? new Date(visita.visited_at).toLocaleString('pt-BR')
                                : '—'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Instrumento</Typography>
                        <Typography>{visita.instrument_label}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Motivo</Typography>
                        <Typography>{visita.motive_label}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Desfecho</Typography>
                        <Chip
                            label={visita.outcome_label}
                            color={outcomeColor}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    {/* Relato */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Relato / Anotação
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {visita.notes || 'Nenhum relato registrado.'}
                        </Typography>
                    </Grid>

                    {/* Geolocalização */}
                    {visita.has_geolocation && (
                        <>
                            <Grid item xs={12}><Divider /></Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Localização
                                </Typography>
                            </Grid>
                            {/* Mapa Leaflet */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ height: 280, borderRadius: 2, overflow: 'hidden' }}>
                                    {typeof window !== 'undefined' && (
                                        <MapContainer
                                            center={[visita.lat, visita.lng]}
                                            zoom={17}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            />
                                            <Marker position={[visita.lat, visita.lng]} />
                                        </MapContainer>
                                    )}
                                </Box>
                            </Grid>
                            {/* Street View */}
                            <Grid item xs={12} md={6}>
                                <Box
                                    sx={{
                                        height: 280,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'action.hover',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {streetViewLoading && <CircularProgress size={32} />}
                                    {streetViewUrl && (
                                        <img
                                            src={streetViewUrl}
                                            alt="Street View"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                    {!streetViewLoading && streetViewError && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            align="center"
                                            sx={{ px: 2 }}
                                        >
                                            {!process.env.NEXT_PUBLIC_MAPILLARY_TOKEN
                                                ? 'Configure NEXT_PUBLIC_MAPILLARY_TOKEN para ativar a visualização de rua.'
                                                : 'Visualização de rua não disponível para este local.'}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}
```

**Nota sobre o Leaflet:** Para os componentes do Leaflet funcionarem no Next.js (SSR), importar via `dynamic` com `{ ssr: false }` conforme o padrão já usado com ApexCharts no projeto.

Adicionar o CSS do Leaflet em `sysdoc_front/pages/_app.js` (apenas uma vez):
```javascript
import 'leaflet/dist/leaflet.css';
// Corrigir ícone padrão do Leaflet (problema conhecido com webpack)
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
});
```

Copiar os arquivos de ícone do Leaflet para `public/leaflet/`:
```bash
cp node_modules/leaflet/dist/images/marker-icon.png public/leaflet/
cp node_modules/leaflet/dist/images/marker-icon-2x.png public/leaflet/
cp node_modules/leaflet/dist/images/marker-shadow.png public/leaflet/
```

---

### TAREFA 4: Criar `VisitasList.js`

Arquivo: `sysdoc_front/src/components/monitor-aps/visitas/VisitasList.js`

```jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Grid, Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Chip, Button, Typography, Paper,
} from '@mui/material';
import { setFilters, setAgentes } from '../../../store/ducks/visitasAcs';
import {
    fetchVisitas, fetchVisitaById, fetchEquipes, fetchAgentes,
} from '../../../store/fetchActions/visitasAcs';
import VisitaDetailModal from './VisitaDetailModal';
import BaseCard from '../../shared/BaseCard';

const MONTHS = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function VisitasList() {
    const dispatch   = useDispatch();
    const { visitas, pagination, filters, equipes, agentes, selectedVisita } =
        useSelector(s => s.visitasAcs);

    const [detailOpen, setDetailOpen] = useState(false);
    const [page, setPage]             = useState(0);

    // Carregar equipes na montagem
    useEffect(() => {
        dispatch(fetchEquipes());
    }, [dispatch]);

    // Buscar visitas sempre que os filtros ou página mudarem
    useEffect(() => {
        dispatch(fetchVisitas({
            ano:      filters.ano,
            mes:      filters.mes,
            ine:      filters.ine || undefined,
            agente:   filters.agente || undefined,
            page:     page + 1,
            per_page: 20,
        }));
    }, [dispatch, filters, page]);

    // Carregar agentes quando equipe mudar
    useEffect(() => {
        if (filters.ine) {
            dispatch(fetchAgentes(filters.ine));
        } else {
            dispatch(setAgentes([]));
        }
        dispatch(setFilters({ agente: '' }));
    }, [dispatch, filters.ine]);

    const handleFilterChange = useCallback((key, value) => {
        setPage(0);
        dispatch(setFilters({ [key]: value }));
    }, [dispatch]);

    const handleVerVisita = useCallback(async (id) => {
        await dispatch(fetchVisitaById(id));
        setDetailOpen(true);
    }, [dispatch]);

    return (
        <Box>
            <BaseCard
                title={`Visitas ACS/TACS${pagination ? ` — ${pagination.total} registros` : ''}`}
            >
                {/* Filtros */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Ano</InputLabel>
                            <Select
                                value={filters.ano}
                                label="Ano"
                                onChange={e => handleFilterChange('ano', e.target.value)}
                            >
                                {YEARS.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Mês</InputLabel>
                            <Select
                                value={filters.mes}
                                label="Mês"
                                onChange={e => handleFilterChange('mes', e.target.value)}
                            >
                                {MONTHS.map((m, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Equipe</InputLabel>
                            <Select
                                value={filters.ine}
                                label="Equipe"
                                onChange={e => handleFilterChange('ine', e.target.value)}
                            >
                                <MenuItem value="">Todas as equipes</MenuItem>
                                {equipes.map(eq => (
                                    <MenuItem key={eq.ine} value={eq.ine}>{eq.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small" disabled={!filters.ine}>
                            <InputLabel>Agente</InputLabel>
                            <Select
                                value={filters.agente}
                                label="Agente"
                                onChange={e => handleFilterChange('agente', e.target.value)}
                            >
                                <MenuItem value="">Todos os agentes</MenuItem>
                                {agentes.map(ag => (
                                    <MenuItem key={ag.name} value={ag.name}>{ag.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Tabela */}
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Agente</TableCell>
                                <TableCell>Equipe</TableCell>
                                <TableCell>Instrumento</TableCell>
                                <TableCell>Data / Hora</TableCell>
                                <TableCell align="center">Geolocalização</TableCell>
                                <TableCell align="center">Ação</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visitas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                            Nenhuma visita encontrada para o período selecionado.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : visitas.map(v => (
                                <TableRow key={v.id} hover>
                                    <TableCell>
                                        <Typography variant="body2">{v.agent_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {v.cbo_label}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{v.team_name}</TableCell>
                                    <TableCell>{v.instrument_label}</TableCell>
                                    <TableCell>
                                        {v.visited_at
                                            ? new Date(v.visited_at).toLocaleString('pt-BR')
                                            : '—'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={v.has_geolocation ? 'Sim' : 'Não'}
                                            color={v.has_geolocation ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleVerVisita(v.id)}
                                        >
                                            Ver
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginação */}
                {pagination && (
                    <TablePagination
                        component="div"
                        count={pagination.total}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={20}
                        rowsPerPageOptions={[20]}
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}–${to} de ${count}`}
                    />
                )}
            </BaseCard>

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

### TAREFA 5: Criar a page wrapper

Arquivo: `sysdoc_front/pages/monitor-aps/visitas.js`

```javascript
import { Grid } from '@mui/material';
import VisitasList from '../../src/components/monitor-aps/visitas/VisitasList';

export default function VisitasPage() {
    return (
        <Grid container>
            <Grid item xs={12}>
                <VisitasList />
            </Grid>
        </Grid>
    );
}
```

---

### TAREFA 6: Adicionar ao menu lateral

Localizar o arquivo de navegação do sysdoc_front (geralmente em `src/layouts/` ou `src/components/Sidebar.js`). Adicionar uma entrada "Visitas ACS" dentro da seção Monitor APS:

```javascript
// Dentro das subpages do Monitor APS
{
    title: 'Visitas ACS',
    href: '/monitor-aps/visitas',
    icon: 'map-pin',   // feather icon
},
```

---

### TAREFA 7: Instalar dependências do Leaflet

```bash
cd sysdoc_front
npm install react-leaflet leaflet
```

Copiar ícones para pasta pública:
```bash
mkdir -p public/leaflet
cp node_modules/leaflet/dist/images/marker-icon.png public/leaflet/
cp node_modules/leaflet/dist/images/marker-icon-2x.png public/leaflet/
cp node_modules/leaflet/dist/images/marker-shadow.png public/leaflet/
```

---

### TAREFA 8: Testar no browser

1. `npm run dev` em `sysdoc_front/`
2. Acessar `/monitor-aps/visitas`
3. Verificar que a tabela carrega com dados do período padrão (ano atual, mês atual)
4. Testar filtro de Equipe → ao selecionar, filtro de Agente deve ser habilitado
5. Testar filtro de Agente → tabela deve refiltrar
6. Clicar em "Ver" em alguma visita → modal deve abrir
7. Se visita tiver geolocalização → verificar que mapa Leaflet aparece no modal
8. Verificar paginação (se houver mais de 20 registros)

---

### TAREFA 9: Commit

```bash
git add sysdoc_front/src/store/ducks/visitasAcs/
git add sysdoc_front/src/store/fetchActions/visitasAcs/
git add sysdoc_front/src/components/monitor-aps/visitas/
git add sysdoc_front/pages/monitor-aps/visitas.js
git add sysdoc_front/public/leaflet/
git add sysdoc_front/package.json sysdoc_front/package-lock.json
git commit -m "feat(monitor-aps): tela de listagem de visitas ACS/TACS

Redux duck + fetch actions + VisitasList com filtros paginados
VisitaDetailModal com mapa Leaflet e Street View Mapillary
Instala react-leaflet + leaflet"
```

---

## Variáveis de Ambiente

Arquivo: `sysdoc_front/.env.local`

```bash
# Token gratuito obtido em https://www.mapillary.com/developer
NEXT_PUBLIC_MAPILLARY_TOKEN=
```

Se vazio, o painel de street view exibirá mensagem de configuração pendente.

---

## Critérios de Aceitação

- [ ] `npm run dev` sem erros de compilação após as mudanças
- [ ] Tabela carrega visitas reais do banco de produção (verificar no browser)
- [ ] Filtros de Ano e Mês alteram os resultados
- [ ] Filtro Equipe carrega lista de equipes da API
- [ ] Filtro Agente habilita apenas quando equipe selecionada
- [ ] Botão "Ver" abre o modal com dados corretos
- [ ] Modal exibe relato (ou mensagem "Nenhum relato registrado.")
- [ ] Modal exibe mapa Leaflet quando visita tem geolocalização
- [ ] Modal exibe mensagem de fallback quando street view não está disponível
- [ ] Paginação funciona (navegação entre páginas)
- [ ] Menu lateral tem link "Visitas ACS" apontando para `/monitor-aps/visitas`
