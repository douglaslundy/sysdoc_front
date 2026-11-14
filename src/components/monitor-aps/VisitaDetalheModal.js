import MapaPonto from '../mapa/MapaPonto';
import StreetViewPanel from '../mapa/StreetViewPanel';
import { Button } from '../ui/button';
import { Carregando } from '../ui/carregando';
import { Dialogo, DialogoCabecalho, DialogoRodape, DialogoTitulo } from '../ui/dialogo';
import { Pilula, tomDaCor } from '../ui/pilula';

const COR_DESFECHO = {
    1: 'success',
    2: 'error',
    3: 'warning',
    4: 'default',
};

function cleanAddressPart(value) {
    const text = value == null ? '' : String(value).trim();
    return /^[a-f0-9]{12,}$/i.test(text) ? '' : text;
}

export default function VisitaDetalheModal({ open, onClose, visita }) {
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
                                <MapaPonto lat={visita.lat} lng={visita.lng} rotulo="Mapa com a posição da visita" />
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
