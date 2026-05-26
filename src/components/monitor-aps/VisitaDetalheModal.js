import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
    Box, Button, Chip, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, Divider, Grid, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });

const COR_DESFECHO = {
    1: 'success',
    2: 'error',
    3: 'warning',
    4: 'default',
};

const GOOGLE_EMBED_SV = (lat, lng, key) =>
    `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${lat},${lng}&fov=90`;
const GOOGLE_SV_URL = (lat, lng) =>
    `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;

function cleanAddressPart(value) {
    const text = value == null ? '' : String(value).trim();
    return /^[a-f0-9]{12,}$/i.test(text) ? '' : text;
}

function StreetViewPanel({ lat, lng }) {
    const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    const mapillaryToken = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN;

    const [imgUrl, setImgUrl] = useState(null);
    const [loading, setLoading] = useState(!!mapillaryToken);
    const [noImage, setNoImage] = useState(!mapillaryToken);
    const [apiError, setApiError] = useState(false);

    useEffect(() => {
        if (!mapillaryToken) return;

        setLoading(true);
        setImgUrl(null);
        setNoImage(false);
        setApiError(false);

        const d = 0.003;
        const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
        fetch(
            `https://graph.mapillary.com/images` +
            `?access_token=${mapillaryToken}` +
            `&fields=id,thumb_2048_url` +
            `&bbox=${bbox}&limit=1`
        )
            .then((r) => {
                if (!r.ok) {
                    setApiError(true);
                    return null;
                }
                return r.json();
            })
            .then((data) => {
                if (!data) return;
                const img = data?.data?.[0];
                if (img?.thumb_2048_url) {
                    setImgUrl(img.thumb_2048_url);
                } else {
                    setNoImage(true);
                }
            })
            .catch(() => setNoImage(true))
            .finally(() => setLoading(false));
    }, [lat, lng, mapillaryToken]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress size={28} />
            </Box>
        );
    }

    if (imgUrl) {
        return (
            <a href={GOOGLE_SV_URL(lat, lng)} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                <img src={imgUrl} alt="Street view" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </a>
        );
    }

    if (noImage && googleKey) {
        return (
            <iframe
                title="Street View"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={GOOGLE_EMBED_SV(lat, lng, googleKey)}
            />
        );
    }

    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={1.5} sx={{ color: 'var(--lg-text-muted)' }}>
            <FeatherIcon icon="camera-off" width="24" height="24" />
            <Typography variant="caption" align="center" sx={{ px: 2 }}>
                {apiError ? 'Erro ao acessar o serviço de imagens.' : 'Sem cobertura de imagens nesta área.'}
            </Typography>
            <Button
                size="small"
                variant="outlined"
                href={GOOGLE_SV_URL(lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<FeatherIcon icon="map-pin" width="14" height="14" />}
                sx={{ fontSize: 11, textTransform: 'none' }}
            >
                Ver no Google Maps
            </Button>
        </Box>
    );
}

export default function VisitaDetalheModal({ open, onClose, visita }) {
    useEffect(() => {
        if (open && !document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1/dist/leaflet.css';
            document.head.appendChild(link);
        }
    }, [open]);

    const temGeo = visita?.has_geolocation && visita?.lat != null && visita?.lng != null;
    const endereco = [
        cleanAddressPart(visita?.logradouro),
        cleanAddressPart(visita?.num_endereco),
        cleanAddressPart(visita?.complemento),
        cleanAddressPart(visita?.bairro),
        cleanAddressPart(visita?.cep),
    ].filter(Boolean).join(', ');
    const dataVisita = (() => {
        if (!visita?.visited_date) return '\u2014';
        const d = new Date(visita.visited_date.length === 10 ? `${visita.visited_date}T12:00:00` : visita.visited_date).toLocaleDateString('pt-BR');
        const h = visita.hora != null ? ` ${String(visita.hora).padStart(2, '0')}:00` : '';
        return d + h;
    })();
    const agente = visita?.agent_name ? `${visita.agent_name}${visita?.cbo_label ? ` (${visita.cbo_label})` : ''}` : '\u2014';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    margin: '0 !important',
                    width: '98vw !important',
                    maxWidth: '98vw !important',
                },
            }}
            PaperProps={{
                sx: {
                    width: '98vw !important',
                    maxWidth: '98vw !important',
                    margin: '0 !important',
                    background: 'var(--lg-glass-modal, #1e2027f0)',
                    backdropFilter: 'var(--lg-blur-modal, blur(20px))',
                    border: '0.5px solid var(--lg-border, #ffffff22)',
                    borderRadius: '16px',
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pt: 2, pb: 0 }}>
                Detalhe da Visita
            </DialogTitle>

            <DialogContent dividers>
                {!visita ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <Box sx={{ px: 1.5, py: 0.6, borderRadius: 1, bgcolor: 'action.selected', borderLeft: '3px solid var(--lg-primary, #1976d2)' }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Cidadão visitado: {visita.citizen_name || '\u2014'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sx={{ py: '2px !important' }}>
                            <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)', display: 'block', lineHeight: 1.1 }}>
                                Endereço
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.25 }}>
                                {endereco || '\u2014'}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={7} sx={{ py: '4px !important' }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'var(--lg-text-secondary)', mb: 0.25, lineHeight: 1.2 }}>
                                Informações
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
                                <Typography variant="body2"><strong>Agente:</strong> {agente}</Typography>
                                <Typography variant="body2"><strong>Equipe:</strong> {visita.team_name || '\u2014'}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap" mt={0.25}>
                                <Typography variant="body2"><strong>Data:</strong> {dataVisita}</Typography>
                                <Typography variant="body2"><strong>Instrumento:</strong> {visita.instrument_label || '\u2014'}</Typography>
                                <Box display="flex" alignItems="center" gap={0.6}>
                                    <Typography variant="body2"><strong>Desfecho:</strong></Typography>
                                    <Chip label={visita.outcome_label || '\u2014'} color={COR_DESFECHO[visita.outcome_code] ?? 'default'} size="small" />
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.6} flexWrap="wrap">
                                    <Typography variant="body2"><strong>Motivos:</strong></Typography>
                                    {visita.motives?.length > 0 ? (
                                        visita.motives.map((m, i) => (
                                            <Chip key={i} label={m} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                                        ))
                                    ) : (
                                        <Typography variant="body2">{'\u2014'}</Typography>
                                    )}
                                </Box>
                            </Box>

                            {visita.accompaniments?.length > 0 && (
                                <Box mt={0.35}>
                                    <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)', display: 'block' }}>
                                        Acompanhamentos
                                    </Typography>
                                    <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.3}>
                                        {visita.accompaniments.map((a, i) => (
                                            <Chip key={i} label={a} size="small" color="info" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={5} sx={{ mt: '-35px', mb: '23px', py: '4px !important' }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'var(--lg-text-secondary)', mb: 0.25, lineHeight: 1.2 }}>
                                Relato / Anotação
                            </Typography>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover', minHeight: 44, whiteSpace: 'pre-wrap', height: '100%' }}>
                                <Typography variant="body2" sx={{ color: visita.notes ? 'text.primary' : 'var(--lg-text-muted)' }}>
                                    {visita.notes || 'Nenhum relato registrado.'}
                                </Typography>
                            </Box>
                        </Grid>

                        {temGeo && (
                            <>
                                <Grid item xs={12}><Divider /></Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'var(--lg-text-secondary)' }} gutterBottom>
                                        Localização
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden' }}>
                                        {typeof window !== 'undefined' && (
                                            <MapContainer center={[visita.lat, visita.lng]} zoom={17} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                />
                                                <Marker position={[visita.lat, visita.lng]} />
                                            </MapContainer>
                                        )}
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <StreetViewPanel lat={visita.lat} lng={visita.lng} />
                                    </Box>
                                </Grid>
                            </>
                        )}
                    </Grid>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} size="small">Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}
