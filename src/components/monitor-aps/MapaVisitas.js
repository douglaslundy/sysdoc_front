import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

const COR_DESFECHO = { 1: '#168821', 2: '#E52207', 3: '#FF8C00', 4: '#888' };
const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não informado' };
const PALETTE = [
    '#2196F3', '#9C27B0', '#FF5722', '#009688', '#FFC107',
    '#E91E63', '#00BCD4', '#8BC34A', '#FF9800', '#3F51B5',
];

function buildColorMap(values) {
    const unique = [...new Set(values)];
    return Object.fromEntries(unique.map((v, i) => [v, PALETTE[i % PALETTE.length]]));
}

export default function MapaVisitas({
    pontos = [],
    centro = [-20.9, -44.9],
    zoom = 13,
    onPinClick,
}) {
    const [modo, setModo] = useState('todos');

    useEffect(() => {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id   = 'leaflet-css';
            link.rel  = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1/dist/leaflet.css';
            document.head.appendChild(link);
        }
    }, []);

    const colorMap = useMemo(() => {
        if (modo === 'todos')   return buildColorMap(pontos.map(p => p.equipe_ine ?? p.equipe ?? ''));
        if (modo === 'equipe')  return buildColorMap(pontos.map(p => p.agente ?? ''));
        return null;
    }, [pontos, modo]);

    function getColor(p) {
        if (modo === 'agente') return COR_DESFECHO[p.desfecho] ?? '#888';
        const key = modo === 'todos' ? (p.equipe_ine ?? p.equipe ?? '') : (p.agente ?? '');
        return colorMap?.[key] ?? '#888';
    }

    if (pontos.length === 0) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height={490}
                sx={{ bgcolor: 'var(--lg-glass)', borderRadius: 2, border: '1px dashed var(--lg-border)' }}
            >
                <Typography color="textSecondary">Nenhuma visita georreferenciada no período</Typography>
            </Box>
        );
    }

    const lats = pontos.map(p => p.lat);
    const lngs = pontos.map(p => p.lng);
    const centroCalc = [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];

    return (
        <Box>
            <Box display="flex" justifyContent="flex-end" mb={1}>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={modo}
                    onChange={(_, v) => v && setModo(v)}
                    sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: 12 } }}
                >
                    <ToggleButton value="todos">Todos</ToggleButton>
                    <ToggleButton value="equipe">Equipe</ToggleButton>
                    <ToggleButton value="agente">Agente</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{ height: 560, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <MapContainer
                    center={centroCalc}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {pontos.map((p, i) => (
                        <CircleMarker
                            key={i}
                            center={[p.lat, p.lng]}
                            radius={6}
                            pathOptions={{
                                color:       getColor(p),
                                fillColor:   getColor(p),
                                fillOpacity: 0.8,
                                weight:      1,
                            }}
                            eventHandlers={onPinClick ? { click: () => onPinClick(p.id) } : undefined}
                        >
                            <Tooltip>
                                <div>
                                    <strong>{LABEL_DESFECHO[p.desfecho] ?? '—'}</strong><br />
                                    {p.agente}<br />
                                    {p.equipe ? `Equipe: ${p.equipe}` : ''}<br />
                                    {p.micro_area ? `Microárea: ${p.micro_area}` : ''}<br />
                                    {p.data ? new Date(p.data).toLocaleDateString('pt-BR') : ''}
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </Box>
        </Box>
    );
}
