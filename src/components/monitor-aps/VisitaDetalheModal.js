import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { CameraOff, MapPin } from 'lucide-react';
import { Button, buttonVariants } from '../ui/button';
import { Carregando } from '../ui/carregando';
import { Dialogo, DialogoCabecalho, DialogoRodape, DialogoTitulo } from '../ui/dialogo';
import { Pilula, tomDaCor } from '../ui/pilula';

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
        return <Carregando className="h-full justify-center py-0" />;
    }

    if (imgUrl) {
        return (
            <a href={GOOGLE_SV_URL(lat, lng)} target="_blank" rel="noopener noreferrer" className="block size-full">
                <img src={imgUrl} alt="Street view" className="size-full object-cover" />
            </a>
        );
    }

    if (noImage && googleKey) {
        return (
            <iframe
                title="Street View"
                width="100%"
                height="100%"
                className="block border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={GOOGLE_EMBED_SV(lat, lng, googleKey)}
            />
        );
    }

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <CameraOff aria-hidden className="size-6" />
            <p className="px-4 text-center text-xs">
                {apiError ? 'Erro ao acessar o serviço de imagens.' : 'Sem cobertura de imagens nesta área.'}
            </p>
            <a
                href={GOOGLE_SV_URL(lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
                <MapPin /> Ver no Google Maps
            </a>
        </div>
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
        if (!visita?.visited_date) return '—';
        const d = new Date(visita.visited_date.length === 10 ? `${visita.visited_date}T12:00:00` : visita.visited_date).toLocaleDateString('pt-BR');
        const h = visita.hora != null ? ` ${String(visita.hora).padStart(2, '0')}:00` : '';
        return d + h;
    })();
    const agente = visita?.agent_name ? `${visita.agent_name}${visita?.cbo_label ? ` (${visita.cbo_label})` : ''}` : '—';

    return (
        <Dialogo aberto={!!open} aoFechar={onClose} tamanho="xl" className="max-h-[96vh] overflow-y-auto">
            <DialogoCabecalho>
                <DialogoTitulo>Detalhe da Visita</DialogoTitulo>
            </DialogoCabecalho>

            {!visita ? (
                <Carregando className="justify-center py-16">Carregando visita...</Carregando>
            ) : (
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="rounded-md border-l-[3px] border-primary bg-muted px-3 py-2 md:col-span-12">
                        <p className="font-semibold">Cidadão visitado: {visita.citizen_name || '—'}</p>
                    </div>

                    <div className="md:col-span-12">
                        <span className="block text-xs text-muted-foreground">Endereço</span>
                        <p className="text-sm">{endereco || '—'}</p>
                    </div>

                    <div className="md:col-span-7">
                        <h3 className="mb-1 text-sm font-bold text-muted-foreground">Informações</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span><strong>Agente:</strong> {agente}</span>
                            <span><strong>Equipe:</strong> {visita.team_name || '—'}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span><strong>Data:</strong> {dataVisita}</span>
                            <span><strong>Instrumento:</strong> {visita.instrument_label || '—'}</span>
                            <span className="flex items-center gap-2">
                                <strong>Desfecho:</strong>
                                <Pilula tom={tomDaCor(COR_DESFECHO[visita.outcome_code] ?? 'default')}>{visita.outcome_label || '—'}</Pilula>
                            </span>
                            <span className="flex flex-wrap items-center gap-2">
                                <strong>Motivos:</strong>
                                {visita.motives?.length > 0 ? (
                                    visita.motives.map((m, i) => <Pilula key={i} tom="neutro" contorno>{m}</Pilula>)
                                ) : (
                                    <span>{'—'}</span>
                                )}
                            </span>
                        </div>

                        {visita.accompaniments?.length > 0 && (
                            <div className="mt-2">
                                <span className="block text-xs text-muted-foreground">Acompanhamentos</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {visita.accompaniments.map((a, i) => <Pilula key={i} tom="info" contorno>{a}</Pilula>)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-5">
                        <h3 className="mb-1 text-sm font-bold text-muted-foreground">Relato / Anotação</h3>
                        <div className="min-h-11 rounded-md bg-muted p-2 text-sm whitespace-pre-wrap">
                            <span className={visita.notes ? '' : 'text-muted-foreground'}>
                                {visita.notes || 'Nenhum relato registrado.'}
                            </span>
                        </div>
                    </div>

                    {temGeo && (
                        <>
                            <div className="border-t border-border pt-3 md:col-span-12">
                                <h3 className="text-sm font-bold text-muted-foreground">Localização</h3>
                            </div>

                            <div className="h-[360px] overflow-hidden rounded-lg md:col-span-6 md:h-[520px]">
                                {typeof window !== 'undefined' && (
                                    <MapContainer center={[visita.lat, visita.lng]} zoom={17} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        />
                                        <Marker position={[visita.lat, visita.lng]} />
                                    </MapContainer>
                                )}
                            </div>

                            <div className="h-[360px] overflow-hidden rounded-lg bg-muted md:col-span-6 md:h-[520px]">
                                <StreetViewPanel lat={visita.lat} lng={visita.lng} />
                            </div>
                        </>
                    )}
                </div>
            )}

            <DialogoRodape>
                <Button variant="outline" onClick={onClose}>Fechar</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
