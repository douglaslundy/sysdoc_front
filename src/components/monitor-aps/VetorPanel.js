import { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Typography } from '@mui/material';
import { monitorApsApi } from '../../services/monitorApsApi';

/**
 * Props:
 *   label     {string}   — "Vetor 1" | "Vetor 2"
 *   equipes   {array}    — lista de equipes do endpoint /config/equipes
 *   vetor     {object}   — { ine, agente, desfecho, geo }
 *   onChange  {function} — (novoVetor, nomeEquipe) => void
 */
export default function VetorPanel({ label, equipes, vetor, onChange }) {
    const [agentesOpcoes, setAgentesOpcoes] = useState([]);
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    useEffect(() => {
        if (!vetor.ine) { setAgentesOpcoes([]); return; }
        const params = new URLSearchParams({ ano: anoAtual, mes: mesAtual, ine: vetor.ine });
        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => setAgentesOpcoes(d.agentes ?? []))
            .catch(() => setAgentesOpcoes([]));
    }, [vetor.ine, anoAtual, mesAtual]);

    function update(field, value) {
        const updates = { [field]: value };
        if (field === 'ine') updates.agente = '';
        const newVetor = { ...vetor, ...updates };
        const nomeEquipeFull = equipes.find(e => e.nu_ine === newVetor.ine)?.no_equipe ?? '';
        const nomeEquipe = nomeEquipeFull.split(' - ').slice(1).join(' - ').trim() || nomeEquipeFull;
        onChange(newVetor, nomeEquipe);
    }

    return (
        <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 260 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>{label}</Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
                <FormControl size="small" fullWidth>
                    <InputLabel>Equipe</InputLabel>
                    <Select label="Equipe" value={vetor.ine}
                        onChange={e => update('ine', e.target.value)}>
                        <MenuItem value="">Todas as equipes</MenuItem>
                        {equipes.map(eq => (
                            <MenuItem key={eq.nu_ine} value={eq.nu_ine}>
                                {eq.no_equipe?.split(' - ').slice(1).join(' - ').trim() || eq.no_equipe}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {vetor.ine && (
                    <FormControl size="small" fullWidth>
                        <InputLabel>Agente</InputLabel>
                        <Select label="Agente" value={vetor.agente}
                            onChange={e => update('agente', e.target.value)}>
                            <MenuItem value="">Todos os agentes</MenuItem>
                            {agentesOpcoes.map((a, i) => (
                                <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <FormControl size="small" fullWidth>
                    <InputLabel>Desfecho</InputLabel>
                    <Select label="Desfecho" value={vetor.desfecho}
                        onChange={e => update('desfecho', e.target.value)}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="1">Realizada</MenuItem>
                        <MenuItem value="2">Recusada</MenuItem>
                        <MenuItem value="3">Ausente</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                    <InputLabel>Geolocalização</InputLabel>
                    <Select label="Geolocalização" value={vetor.geo}
                        onChange={e => update('geo', e.target.value)}>
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="sim">Com geolocalização</MenuItem>
                        <MenuItem value="nao">Sem geolocalização</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Paper>
    );
}
