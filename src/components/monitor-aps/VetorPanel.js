import { useEffect, useMemo, useState } from 'react';
import { equipeLabel } from '../../utils/equipeLabel';
import { monitorApsApi } from '../../services/monitorApsApi';
import { CampoSelecao } from '../ui/campos';
import { useUid } from '../../lib/useUid';

/**
 * Props:
 *   label     {string}   — "Vetor 1" | "Vetor 2"
 *   equipes   {array}    — lista de equipes do endpoint /config/equipes
 *   vetor     {object}   — { ine, agente_cns, agente_nome, desfecho, geo }
 *   onChange  {function} — (novoVetor, nomeEquipe) => void
 */
export default function VetorPanel({ label, equipes, vetor, onChange }) {
    const [agentesOpcoes, setAgentesOpcoes] = useState([]);
    const anoAtual = useMemo(() => new Date().getFullYear(), []);
    const mesAtual = useMemo(() => new Date().getMonth() + 1, []);
    const uid = useUid('vetor');

    useEffect(() => {
        if (!vetor.ine) { setAgentesOpcoes([]); return; }
        const ctrl = new AbortController();
        const params = new URLSearchParams({ ano: anoAtual, mes: mesAtual, ine: vetor.ine });
        monitorApsApi.get(`/visitas/agentes?${params}`, { signal: ctrl.signal })
            .then(d => setAgentesOpcoes(d.agentes ?? []))
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setAgentesOpcoes([]); });
        return () => ctrl.abort();
    }, [vetor.ine, anoAtual, mesAtual]);

    function update(field, value) {
        const updates = { [field]: value };
        if (field === 'ine') {
            updates.agente_cns = '';
            updates.agente_nome = '';
        }
        if (field === 'agente_cns') {
            updates.agente_nome = agentesOpcoes.find((item) => item.agente_cns === value)?.agente ?? '';
        }
        const newVetor = { ...vetor, ...updates };
        const nomeEquipeFull = equipes.find(e => e.nu_ine === newVetor.ine)?.no_equipe ?? '';
        const nomeEquipe = equipeLabel(nomeEquipeFull);
        onChange(newVetor, nomeEquipe);
    }

    return (
        <div className="min-w-[260px] flex-1 rounded-xl border border-border p-4">
            <p className="mb-3 text-sm font-bold">{label}</p>
            <div className="grid gap-3">
                <CampoSelecao id={`${uid}-equipe`} label="Equipe" value={vetor.ine} onChange={e => update('ine', e.target.value)}>
                    <option value="">Todas as equipes</option>
                    {equipes.map(eq => (
                        <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>
                    ))}
                </CampoSelecao>

                {vetor.ine && (
                    <CampoSelecao id={`${uid}-agente`} label="Agente" value={vetor.agente_cns} onChange={e => update('agente_cns', e.target.value)}>
                        <option value="">Todos os agentes</option>
                        {agentesOpcoes.map(a => (
                            <option key={a.agente_cns ?? a.agente} value={a.agente_cns ?? ''}>{a.agente}</option>
                        ))}
                    </CampoSelecao>
                )}

                <CampoSelecao id={`${uid}-desfecho`} label="Desfecho" value={vetor.desfecho} onChange={e => update('desfecho', e.target.value)}>
                    <option value="">Todos</option>
                    <option value="1">Realizada</option>
                    <option value="2">Recusada</option>
                    <option value="3">Ausente</option>
                </CampoSelecao>

                <CampoSelecao id={`${uid}-geo`} label="Geolocalização" value={vetor.geo} onChange={e => update('geo', e.target.value)}>
                    <option value="">Todas</option>
                    <option value="sim">Com geolocalização</option>
                    <option value="nao">Sem geolocalização</option>
                </CampoSelecao>
            </div>
        </div>
    );
}
