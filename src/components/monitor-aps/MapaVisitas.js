import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Box, Typography } from '@mui/material';

// Importação do CSS do Leaflet feita dinamicamente para evitar SSR
// Este componente só é carregado via dynamic() com ssr: false

const COR_DESFECHO = { 1: '#168821', 2: '#E52207', 3: '#FF8C00', 4: '#888' };
const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não informado' };

export default function MapaVisitas({ pontos = [], centro = [-20.9, -44.9], zoom = 13 }) {
    useEffect(() => {
        // Injetar CSS do Leaflet no lado do cliente
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1/dist/leaflet.css';
            document.head.appendChild(link);
        }
    }, []);

    if (pontos.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={350}
                sx={{ bgcolor: 'var(--lg-glass)', borderRadius: 2, border: '1px dashed var(--lg-border)' }}>
                <Typography color="textSecondary">Nenhuma visita georreferenciada no período</Typography>
            </Box>
        );
    }

    // Calcula centro a partir dos pontos se houver dados
    const lats = pontos.map(p => p.lat);
    const lngs = pontos.map(p => p.lng);
    const centroCalc = [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];

    return (
        <Box sx={{ height: 400, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
            <MapContainer center={centroCalc} zoom={zoom} style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {pontos.map((p, i) => (
                    <CircleMarker key={i}
                        center={[p.lat, p.lng]}
                        radius={6}
                        pathOptions={{
                            color: COR_DESFECHO[p.desfecho] ?? '#888',
                            fillColor: COR_DESFECHO[p.desfecho] ?? '#888',
                            fillOpacity: 0.75,
                            weight: 1,
                        }}>
                        <Tooltip>
                            <div>
                                <strong>{LABEL_DESFECHO[p.desfecho] ?? '—'}</strong><br />
                                {p.agente}<br />
                                {p.micro_area ? `Microárea: ${p.micro_area}` : ''}<br />
                                {p.data ? new Date(p.data).toLocaleDateString('pt-BR') : ''}
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}
            </MapContainer>
        </Box>
    );
}
