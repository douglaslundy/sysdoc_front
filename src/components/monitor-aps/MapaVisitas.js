import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Abas } from '../ui/abas';

const COR_DESFECHO = { 1: '#168821', 2: '#E52207', 3: '#FF8C00', 4: '#888' };
const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não informado' };
const PALETTE = [
    '#2196F3', '#9C27B0', '#FF5722', '#009688', '#FFC107',
    '#E91E63', '#00BCD4', '#8BC34A', '#FF9800', '#3F51B5',
];
const MODOS = [
    { chave: 'todos', rotulo: 'Todos' },
    { chave: 'equipe', rotulo: 'Equipe' },
    { chave: 'agente', rotulo: 'Agente' },
];

function buildColorMap(values) {
    const unique = [...new Set(values)];
    return Object.fromEntries(unique.map((v, i) => [v, PALETTE[i % PALETTE.length]]));
}

function stripLegendPrefix(value) {
    const text = String(value ?? '').trim();
    if (!text) return '—';
    const parts = text.split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ').trim() : text;
}

function Legend({ modo, colorMap }) {
    const items = useMemo(() => {
        if (modo === 'agente') {
            return Object.entries(LABEL_DESFECHO).map(([code, label]) => ({
                label: stripLegendPrefix(label),
                color: COR_DESFECHO[Number(code)] ?? '#888',
            }));
        }
        if (!colorMap) return [];
        return Object.entries(colorMap).map(([key, color]) => ({
            label: stripLegendPrefix(key),
            color,
        }));
    }, [modo, colorMap]);

    if (!items.length) return null;

    const titulo = modo === 'todos' ? 'Equipe' : modo === 'equipe' ? 'Agente' : 'Desfecho';

    return (
        <div className="absolute bottom-4 left-4 z-[1500] max-h-60 max-w-[260px] overflow-y-auto rounded-lg border border-border bg-card p-3 text-foreground shadow-lg">
            <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">{titulo}</span>
            {items.map(({ label, color }, idx) => (
                <div key={`${label}-${color}-${idx}`} className="mb-1 flex items-center gap-2">
                    <span className="size-[11px] shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate text-xs leading-snug font-semibold">{label}</span>
                </div>
            ))}
        </div>
    );
}

export default function MapaVisitas({
    pontos = [],
    centro = [-20.9, -44.9],
    zoom = 13,
    onPinClick,
    modoExterno = null,
    showToggle = true,
}) {
    const [modoInterno, setModoInterno] = useState('todos');
    const modo = modoExterno ?? modoInterno;

    const colorMap = useMemo(() => {
        if (modo === 'todos') return buildColorMap(pontos.map((p) => p.equipe ?? p.equipe_ine ?? ''));
        if (modo === 'equipe') return buildColorMap(pontos.map((p) => p.agente ?? ''));
        return null;
    }, [pontos, modo]);

    function getColor(p) {
        if (modo === 'agente') return COR_DESFECHO[p.desfecho] ?? '#888';
        const key = modo === 'todos' ? (p.equipe ?? p.equipe_ine ?? '') : (p.agente ?? '');
        return colorMap?.[key] ?? '#888';
    }

    if (pontos.length === 0) {
        return (
            <div className="flex h-[588px] items-center justify-center rounded-lg border border-dashed border-border bg-card">
                <p className="text-sm text-muted-foreground">Nenhuma visita georreferenciada no período</p>
            </div>
        );
    }

    const lats = pontos.map((p) => p.lat);
    const lngs = pontos.map((p) => p.lng);
    const centroCalc = [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];

    return (
        <div>
            {showToggle && (
                <div className="mb-2 flex justify-end">
                    <Abas rotulo="Agrupar cores do mapa" itens={MODOS} valor={modoInterno} aoMudar={setModoInterno} />
                </div>
            )}

            <div className="relative h-[672px] w-full overflow-hidden rounded-lg">
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
                                color: getColor(p),
                                fillColor: getColor(p),
                                fillOpacity: 0.8,
                                weight: 1,
                            }}
                            eventHandlers={onPinClick ? { click: () => onPinClick(p.id) } : undefined}
                        >
                            <Tooltip>
                                <div className="min-w-[160px] leading-[1.7]">
                                    {p.cidadao && <div><strong>{p.cidadao}</strong></div>}
                                    {p.logradouro && (
                                        <div className="text-[11px] text-neutral-600">
                                            {[p.logradouro, p.num_endereco, p.complemento].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    {p.bairro && <div className="text-[11px] text-neutral-600">{p.bairro}</div>}
                                    {p.micro_area && <div className="text-[11px]">Microárea: {p.micro_area}</div>}
                                    <div className="mt-[3px]">
                                        <strong style={{ color: p.desfecho === 1 ? '#168821' : p.desfecho === 2 ? '#E52207' : '#FF8C00' }}>
                                            {LABEL_DESFECHO[p.desfecho] ?? '—'}
                                        </strong>
                                    </div>
                                    <div>{p.agente}</div>
                                    {p.equipe && <div className="text-[11px] text-neutral-600">Equipe: {p.equipe}</div>}
                                    {p.data && (
                                        <div className="text-[11px]">
                                            {(() => {
                                                const d = new Date(p.data.length === 10 ? `${p.data}T12:00:00` : p.data).toLocaleDateString('pt-BR');
                                                const h = p.hora != null ? ` ${String(p.hora).padStart(2, '0')}:00` : '';
                                                return d + h;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    ))}
                </MapContainer>

                <Legend modo={modo} colorMap={colorMap} />
            </div>
        </div>
    );
}
