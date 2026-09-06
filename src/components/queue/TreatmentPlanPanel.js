import { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import BasicDatePicker from '../inputs/datePicker';
import { AuthContext } from '../../contexts/AuthContext';
import {
    previewTreatmentPlan,
    createTreatmentPlan,
    getTreatmentPlanForQueue,
    rescheduleTreatmentSession,
    completeTreatmentSession,
    cancelTreatmentPlan,
} from '../../services/queueTreatmentPlans';

const WEEKDAY_LABELS = [
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' },
];

const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function TreatmentPlanPanel({ queueId, speciality, onChanged }) {
    const { profile } = useContext(AuthContext);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weekdays, setWeekdays] = useState([]);
    const [totalSessions, setTotalSessions] = useState(1);
    const [previewDates, setPreviewDates] = useState(null);
    const [rescheduling, setRescheduling] = useState(null); // { sessionId, date, reason }
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [error, setError] = useState('');

    const loadPlan = () => {
        setLoading(true);
        setError('');
        getTreatmentPlanForQueue(queueId)
            .then((data) => setPlan(data.plan !== undefined ? data.plan : data))
            .catch((err) => {
                setPlan(null);
                setError(err?.response?.data?.message || 'Erro ao carregar o agendamento por sessões. Tente novamente.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (queueId) loadPlan();
    }, [queueId]);

    const toggleWeekday = (value) => {
        setWeekdays((current) => current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value].sort());
        setPreviewDates(null);
    };

    const handlePreview = async () => {
        setError('');
        try {
            const result = await previewTreatmentPlan(speciality.id, weekdays, totalSessions);
            setPreviewDates(result.dates);
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao calcular as datas.');
        }
    };

    const handleConfirm = async () => {
        setError('');
        try {
            await createTreatmentPlan(queueId, weekdays, totalSessions);
            setPreviewDates(null);
            loadPlan();
            onChanged && onChanged();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao criar o agendamento.');
        }
    };

    const handleReschedule = async () => {
        if (!rescheduling?.date || !rescheduling?.reason) return;
        setError('');
        try {
            const updated = await rescheduleTreatmentSession(
                rescheduling.sessionId,
                toIsoDate(rescheduling.date),
                rescheduling.reason
            );
            setPlan(updated);
            setRescheduling(null);
            onChanged && onChanged();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao adiar a sessão.');
        }
    };

    const handleComplete = async (sessionId) => {
        setError('');
        try {
            const updated = await completeTreatmentSession(sessionId);
            setPlan(updated);
            onChanged && onChanged();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao concluir a sessão.');
        }
    };

    const handleCancelPlan = async () => {
        if (cancelReason.trim().length < 10) {
            setError('A justificativa precisa ter pelo menos 10 caracteres.');
            return;
        }
        setError('');
        try {
            const updated = await cancelTreatmentPlan(plan.id, cancelReason.trim());
            setPlan(updated);
            setShowCancelForm(false);
            setCancelReason('');
            onChanged && onChanged();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao cancelar o plano.');
        }
    };

    if (!speciality?.allows_session_scheduling) return null;
    if (loading) return <Typography variant="body2">Carregando agendamento por sessões…</Typography>;

    return (
        <Box sx={{ mt: 2, p: 2, border: '1px solid var(--lg-border)', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Agendamento por sessões
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

            {!plan && (
                <Stack spacing={1.5}>
                    <Typography variant="body2">Dias da semana:</Typography>
                    <Stack direction="row" flexWrap="wrap">
                        {WEEKDAY_LABELS.map((day) => (
                            <FormControlLabel
                                key={day.value}
                                control={
                                    <Checkbox
                                        checked={weekdays.includes(day.value)}
                                        onChange={() => toggleWeekday(day.value)}
                                    />
                                }
                                label={day.label}
                            />
                        ))}
                    </Stack>
                    <TextField
                        label="Quantidade total de sessões"
                        type="number"
                        value={totalSessions}
                        onChange={(e) => { setTotalSessions(Math.max(1, Number(e.target.value) || 1)); setPreviewDates(null); }}
                        sx={{ maxWidth: 240 }}
                    />

                    {!previewDates && (
                        <Button
                            variant="outlined"
                            disabled={weekdays.length === 0}
                            onClick={handlePreview}
                        >
                            Calcular datas
                        </Button>
                    )}

                    {previewDates && (
                        <>
                            <Alert severity="warning">
                                Ao confirmar, o paciente sairá da fila de espera imediatamente. As sessões
                                ficarão agendadas nas datas geradas abaixo.
                            </Alert>
                            <Typography variant="body2">
                                {previewDates.join(', ')}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" onClick={handleConfirm}>
                                    Confirmar agendamento
                                </Button>
                                <Button variant="text" onClick={() => setPreviewDates(null)}>
                                    Voltar
                                </Button>
                            </Stack>
                        </>
                    )}
                </Stack>
            )}

            {plan && (
                <Stack spacing={1.5}>
                    <Typography variant="body2">
                        Status: <strong>{plan.status}</strong> — Previsão de término: {plan.expected_end_at}
                    </Typography>

                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {plan.sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>{session.scheduled_date}</TableCell>
                                    <TableCell>{session.status}</TableCell>
                                    <TableCell align="right">
                                        {['pending', 'rescheduled_pending'].includes(session.status) && (
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button size="small" onClick={() => handleComplete(session.id)}>
                                                    Concluir
                                                </Button>
                                                <Button size="small" onClick={() => setRescheduling({ sessionId: session.id, date: null, reason: '' })}>
                                                    Adiar
                                                </Button>
                                            </Stack>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {rescheduling && (
                        <Stack spacing={1} sx={{ p: 1.5, border: '1px dashed var(--lg-border)' }}>
                            <BasicDatePicker
                                label="Nova data da sessão"
                                name="new_date"
                                value={rescheduling.date}
                                setValue={(value) => setRescheduling((current) => ({ ...current, date: value }))}
                            />
                            <TextField
                                label="Motivo do adiamento"
                                value={rescheduling.reason}
                                onChange={(e) => setRescheduling((current) => ({ ...current, reason: e.target.value }))}
                                multiline
                                minRows={2}
                            />
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" onClick={handleReschedule}>Salvar adiamento</Button>
                                <Button variant="text" onClick={() => setRescheduling(null)}>Cancelar</Button>
                            </Stack>
                        </Stack>
                    )}

                    {profile === 'admin' && plan.status === 'active' && (
                        <Box sx={{ mt: 1 }}>
                            {!showCancelForm ? (
                                <Button color="error" variant="outlined" onClick={() => setShowCancelForm(true)}>
                                    Cancelar tratamento e devolver à fila
                                </Button>
                            ) : (
                                <Stack spacing={1} sx={{ p: 1.5, border: '1px dashed var(--lg-border)' }}>
                                    <TextField
                                        label="Justificativa (obrigatória, mínimo 10 caracteres)"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        multiline
                                        minRows={2}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <Button color="error" variant="contained" onClick={handleCancelPlan}>
                                            Confirmar cancelamento
                                        </Button>
                                        <Button variant="text" onClick={() => setShowCancelForm(false)}>
                                            Voltar
                                        </Button>
                                    </Stack>
                                </Stack>
                            )}
                        </Box>
                    )}
                </Stack>
            )}
        </Box>
    );
}
