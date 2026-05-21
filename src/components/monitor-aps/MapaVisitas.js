import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

const COR_DESFECHO   = { 1: '#168821', 2: '#E52207', 3: '#FF8C00', 4: '#888' };
const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não informado' };
const PALETTE = [
    '#2196F3', '#9C27B0', '#FF5722', '#009688', '#FFC107',
    '#E91E63', '#00BCD4', '#8BC34A', '#FF9800', '#3F51B5',
];

function buildColorMap(values) {
    const unique = [...new Set(values)];
    return Object.fromEntries(unique.map((v, i) => [v, PALETTE[i % PALETTE.length]]));
}

function Legend({ modo, colorMap }) {
    const items = useMemo(() => {
        if (modo === 'agente') {
            return Object.entries(LABEL_DESFECHO).map(([code, label]) => ({
                label,
                color: COR_DESFECHO[Number(code)] ?? '#888',
            }));
        }
        if (!colorMap) return [];
        return Object.entries(colorMap).map(([key, color]) => ({
            label: key || '—',
            color,
        }));
    }, [modo, colorMap]);

    if (!items.length) return null;

    const titulo = modo === 'todos' ? 'Equipe' : modo === 'equipe' ? 'Agente' : 'Desfecho';

    return (
        <Box sx={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 1500,
            bgcolor: 'rgba(255,255,255,0.93)', borderRadius: 2,
            p: 1.5, boxShadow: 3, maxHeight: 240, overflowY: 'auto', maxWidth: 220,
        }}>
            <Typography variant="caption" fontWeight={700}
                sx={{ color: '#222', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: 10 }}>
                {titulo}
            </Typography>
            {items.map(({ label, color }) => (
                <Box key={label} display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: '#333', lineHeight: 1.3 }} noWrap>
                        {label}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

export default function MapaVisitas({
    pontos = [],
    centro = [-20.9, -44.9],
    zoom = 13,
    onPinClick,
    modoExterno = null,
    showToggle  = true,
}) {
    const [modoInterno, setModoInterno] = useState('todos');
    const modo = modoExterno ?? modoInterno;

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
        if (modo === 'todos')  return buildColorMap(pontos.map(p => p.equipe ?? p.equipe_ine ?? ''));
        if (modo === 'equipe') return buildColorMap(pontos.map(p => p.agente ?? ''));
        return null;
    }, [pontos, modo]);

    function getColor(p) {
        if (modo === 'agente') return COR_DESFECHO[p.desfecho] ?? '#888';
        const key = modo === 'todos' ? (p.equipe ?? p.equipe_ine ?? '') : (p.agente ?? '');
        return colorMap?.[key] ?? '#888';
    }

    if (pontos.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={490}
                sx={{ bgcolor: 'var(--lg-glass)', borderRadius: 2, border: '1px dashed var(--lg-border)' }}>
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
            {showToggle && (
                <Box display="flex" justifyContent="flex-end" mb={1}>
                    <ToggleButtonGroup
                        size="small" exclusive
                        value={modoInterno}
                        onChange={(_, v) => v && setModoInterno(v)}
                        sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: 12 } }}
                    >
                        <ToggleButton value="todos">Todos</ToggleButton>
                        <ToggleButton value="equipe">Equipe</ToggleButton>
                        <ToggleButton value="agente">Agente</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

            <Box sx={{
                height: 560, width: '100%', borderRadius: 2,
                overflow: 'hidden', position: 'relative',
            }}>
                <MapContainer
                    center={centroCalc}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
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
                                <div style={{ lineHeight: 1.6 }}>
                                    {p.cidadao && <><strong>{p.cidadao}</strong><br /></>}
                                    <strong>{LABEL_DESFECHO[p.desfecho] ?? '—'}</strong><br />
                                    {p.agente}<br />
                                    {p.equipe ? `Equipe: ${p.equipe}` : ''}<br />
                                    {p.micro_area ? `Microárea: ${p.micro_area}` : ''}<br />
                                    {p.data
                                        ? new Date(p.data.length === 10 ? p.data + 'T12:00:00' : p.data)
                                            .toLocaleDateString('pt-BR')
                                        : ''}
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    ))}
                </MapContainer>

                <Legend modo={modo} colorMap={colorMap} />
            </Box>
        </Box>
    );
}
