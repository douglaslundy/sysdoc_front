import { useContext, useEffect, useState } from 'react';
import BasicDatePicker from '../inputs/datePicker';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CaixaDeMarcacao } from '../ui/caixa-de-marcacao';
import { CampoTexto } from '../ui/campos';
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

const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

const STATUS_LABELS = {
    active: 'Ativo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    pending: 'Pendente',
    rescheduled_pending: 'Reagendado (pendente)',
    done: 'Concluída',
};
const statusLabel = (status) => STATUS_LABELS[status] || status;

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
    const [submitting, setSubmitting] = useState(false);

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
        setSubmitting(true);
        try {
            const result = await previewTreatmentPlan(speciality.id, weekdays, totalSessions);
            setPreviewDates(result.dates);
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao calcular as datas.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        setError('');
        setSubmitting(true);
        try {
            await createTreatmentPlan(queueId, weekdays, totalSessions);
            setPreviewDates(null);
            loadPlan();
            onChanged && onChanged();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao criar o agendamento.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduling?.date || !rescheduling?.reason) return;
        setError('');
        setSubmitting(true);
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
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async (sessionId) => {
        if (!window.confirm('Confirmar conclusão desta sessão?')) return;
        setError('');
        setSubmitting(true);
        try {
            const updated = await completeTreatmentSession(sessionId);
            setPlan(updated);
            onChanged && onChanged();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao concluir a sessão.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelPlan = async () => {
        if (cancelReason.trim().length < 10) {
            setError('A justificativa precisa ter pelo menos 10 caracteres.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            const updated = await cancelTreatmentPlan(plan.id, cancelReason.trim());
            setPlan(updated);
            setShowCancelForm(false);
            setCancelReason('');
            onChanged && onChanged();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erro ao cancelar o plano.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderSessionsTable = (sessions, { readOnly = false } = {}) => (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr>
                        <th scope="col" className="border-b border-border px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Data</th>
                        <th scope="col" className="border-b border-border px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                        {!readOnly && <th scope="col" className="border-b border-border px-3 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Ações</th>}
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((session) => (
                        <tr key={session.id}>
                            <td className="border-b border-border px-3 py-2">{formatDate(session.scheduled_date)}</td>
                            <td className="border-b border-border px-3 py-2">{statusLabel(session.status)}</td>
                            {!readOnly && (
                                <td className="border-b border-border px-3 py-2 text-right">
                                    {['pending', 'rescheduled_pending'].includes(session.status) && (
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" disabled={submitting} onClick={() => handleComplete(session.id)}>
                                                Concluir
                                            </Button>
                                            <Button variant="ghost" size="sm" disabled={submitting} onClick={() => setRescheduling({ sessionId: session.id, date: null, reason: '' })}>
                                                Adiar
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    if (!speciality?.allows_session_scheduling) return null;
    if (loading) return <p className="ui-reset text-sm text-muted-foreground">Carregando agendamento por sessões…</p>;

    const hasActivePlan = plan && plan.status === 'active';

    return (
        <div className="ui-reset mt-4 rounded-lg border border-border p-4">
            <h4 className="mb-2 font-display text-sm font-bold">Agendamento por sessões</h4>

            {error && <div className="mb-2"><Banner tom="perigo">{error}</Banner></div>}

            {plan && !hasActivePlan && (
                <div className="mb-4 grid gap-3">
                    <p className="text-sm">
                        Histórico: <strong>{statusLabel(plan.status)}</strong> — Previsão de término: {formatDate(plan.expected_end_at)}
                    </p>
                    {renderSessionsTable(plan.sessions, { readOnly: true })}
                </div>
            )}

            {!hasActivePlan && (
                <div className="grid gap-3">
                    <p className="text-sm">Dias da semana:</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {WEEKDAY_LABELS.map((day) => (
                            <CaixaDeMarcacao
                                key={day.value}
                                id={`dia-semana-${day.value}`}
                                marcado={weekdays.includes(day.value)}
                                aoMudar={() => toggleWeekday(day.value)}
                            >
                                {day.label}
                            </CaixaDeMarcacao>
                        ))}
                    </div>
                    <CampoTexto
                        id="total-sessoes"
                        label="Quantidade total de sessões"
                        type="number"
                        value={totalSessions}
                        onChange={(e) => { setTotalSessions(Math.max(1, Number(e.target.value) || 1)); setPreviewDates(null); }}
                        className="max-w-[240px]"
                    />

                    {!previewDates && (
                        <Button
                            variant="outline"
                            className="justify-self-start"
                            disabled={weekdays.length === 0 || submitting}
                            onClick={handlePreview}
                        >
                            Calcular datas
                        </Button>
                    )}

                    {previewDates && (
                        <>
                            <Banner tom="alerta">
                                Ao confirmar, o paciente sairá da fila de espera imediatamente. As sessões
                                ficarão agendadas nas datas geradas abaixo.
                            </Banner>
                            <p className="text-sm">{previewDates.map(formatDate).join(', ')}</p>
                            <div className="flex flex-wrap gap-2">
                                <Button disabled={submitting} onClick={handleConfirm}>
                                    Confirmar agendamento
                                </Button>
                                <Button variant="ghost" disabled={submitting} onClick={() => setPreviewDates(null)}>
                                    Voltar
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {hasActivePlan && (
                <div className="grid gap-3">
                    <p className="text-sm">
                        Status: <strong>{statusLabel(plan.status)}</strong> — Previsão de término: {formatDate(plan.expected_end_at)}
                    </p>

                    {renderSessionsTable(plan.sessions)}

                    {rescheduling && (
                        <div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
                            <BasicDatePicker
                                label="Nova data da sessão"
                                name="new_date"
                                value={rescheduling.date}
                                setValue={(value) => setRescheduling((current) => ({ ...current, date: value }))}
                            />
                            <CampoTexto
                                id="motivo-adiamento"
                                label="Motivo do adiamento"
                                value={rescheduling.reason}
                                onChange={(e) => setRescheduling((current) => ({ ...current, reason: e.target.value }))}
                                multiline
                                rows={2}
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button disabled={submitting} onClick={handleReschedule}>Salvar adiamento</Button>
                                <Button variant="ghost" disabled={submitting} onClick={() => setRescheduling(null)}>Cancelar</Button>
                            </div>
                        </div>
                    )}

                    {profile === 'admin' && plan.status === 'active' && (
                        <div className="mt-1">
                            {!showCancelForm ? (
                                <Button variant="destructive" onClick={() => setShowCancelForm(true)}>
                                    Cancelar tratamento e devolver à fila
                                </Button>
                            ) : (
                                <div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
                                    <CampoTexto
                                        id="justificativa-cancelamento"
                                        label="Justificativa (obrigatória, mínimo 10 caracteres)"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        multiline
                                        rows={2}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="destructive" disabled={submitting} onClick={handleCancelPlan}>
                                            Confirmar cancelamento
                                        </Button>
                                        <Button variant="ghost" disabled={submitting} onClick={() => setShowCancelForm(false)}>
                                            Voltar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
