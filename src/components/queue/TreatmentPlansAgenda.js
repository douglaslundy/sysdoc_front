import { useEffect, useState } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import TreatmentPlanPanel from './TreatmentPlanPanel';
import { api } from '../../services/api';

const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

export default function TreatmentPlansAgenda() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/queue-treatment-plans', { params: { status: 'active' } })
            .then((res) => setPlans(res.data || []))
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const doneCount = (plan) => plan.sessions.filter((s) => s.status === 'done').length;

    return (
        <BaseCard title="Agenda de Tratamentos">
            {loading ? (
                <Typography>Carregando…</Typography>
            ) : (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Paciente</TableCell>
                            <TableCell>Especialidade</TableCell>
                            <TableCell>Progresso</TableCell>
                            <TableCell>Previsão de término</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id} hover onClick={() => setSelected(plan)} sx={{ cursor: 'pointer' }}>
                                <TableCell>{plan.client_name}</TableCell>
                                <TableCell>{plan.speciality_name}</TableCell>
                                <TableCell>{doneCount(plan)} de {plan.total_sessions} sessões concluídas</TableCell>
                                <TableCell>{formatDate(plan.expected_end_at)}</TableCell>
                            </TableRow>
                        ))}
                        {plans.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4}>Nenhum tratamento ativo no momento.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
                <DialogTitle>{selected?.client_name} — {selected?.speciality_name}</DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <Box>
                            <TreatmentPlanPanel
                                queueId={selected.queue_id}
                                speciality={{ id: selected.speciality_id, name: selected.speciality_name, allows_session_scheduling: true }}
                                onChanged={load}
                            />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </BaseCard>
    );
}
