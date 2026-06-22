import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Alert, Box, Button, Card, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import BasicDatePicker from '../../inputs/datePicker';
import PedidoModal from '../../modal/pedido';
import { api } from '../../../services/api';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';
import { turnModal } from '../../../store/ducks/Layout';

const STATUS_COLORS = {
    solicitado: 'warning',
    coletado: 'info',
    em_analise: 'primary',
    liberado: 'success',
    cancelado: 'error',
};

const STATUS_LABELS = {
    solicitado: 'Solicitado',
    coletado: 'Coletado',
    em_analise: 'Em análise',
    liberado: 'Liberado',
    cancelado: 'Cancelado',
};

const addDays = (date, days) => {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
};

const startOfWeek = (date) => {
    const value = new Date(date);
    const day = value.getDay();
    value.setDate(value.getDate() - day);
    value.setHours(0, 0, 0, 0);
    return value;
};

const toIsoDate = (date) => date.toISOString().split('T')[0];

const formatDayLabel = (date) =>
    date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
    });

const formatRangeLabel = (start, end) => {
    const base = `${start.toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}`;
    return base.replace('.', '');
};

const truncateExamName = (name) => {
    const value = name || '—';
    return value.length > 30 ? `${value.slice(0, 27)}...` : value;
};

export default function AgendaColeta() {
    const dispatch = useDispatch();
    const [baseDate, setBaseDate] = useState(new Date());
    const [agenda, setAgenda] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    const weekStart = useMemo(() => startOfWeek(baseDate), [baseDate]);
    const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
        [weekStart]
    );

    const buscarAgenda = async () => {
        setCarregando(true);
        setErro('');
        try {
            const res = await api.get('/laboratorio/agenda', {
                params: {
                    inicio: toIsoDate(weekStart),
                    fim: toIsoDate(weekEnd),
                },
            });
            setAgenda(res.data);
        } catch (err) {
            setErro(err.response?.data?.message || 'Erro ao carregar agenda.');
            setAgenda(null);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarAgenda();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekStart]);

    const pedidosPorDia = useMemo(() => {
        const grouped = new Map();
        (agenda?.pedidos || []).forEach((pedido) => {
            const key = String(pedido.data_coleta || pedido.data_pedido || '').slice(0, 10);
            if (!key) return;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(pedido);
        });

        return grouped;
    }, [agenda]);

    const total = agenda?.total ?? 0;

    return (
        <Box sx={modalFormRootSx} className="queue-page lab-agenda-page">
            <PedidoModal onSaved={buscarAgenda} />
            <AlertModal />
            <BaseCard
                title="Agenda de Coleta"
                action={
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <Chip label={formatRangeLabel(weekStart, weekEnd)} color="primary" size="small" />
                        <Chip label={`${total} pedido(s)`} color={total > 0 ? 'success' : 'default'} size="small" />
                    </Box>
                }
            >
                <Stack spacing={2}>
                    <Box
                        className="queue-page__toolbar"
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'minmax(200px, 1fr) auto auto auto auto' },
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <BasicDatePicker
                            label="Data base"
                            value={baseDate}
                            setValue={(value) => setBaseDate(value || new Date())}
                            sx={{ width: '100%' }}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => setBaseDate((current) => addDays(current, -7))}
                            startIcon={<FeatherIcon icon="chevron-left" size={16} />}
                        >
                            Semana anterior
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setBaseDate(new Date())}
                        >
                            Hoje
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setBaseDate((current) => addDays(current, 7))}
                            endIcon={<FeatherIcon icon="chevron-right" size={16} />}
                        >
                            Próxima semana
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => dispatch(turnModal())}
                            startIcon={<FeatherIcon icon="plus" size={16} />}
                        >
                            Novo Pedido
                        </Button>
                    </Box>

                    {erro && <Alert severity="error">{erro}</Alert>}

                    {carregando && (
                        <Box py={6} display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    )}

                    {!carregando && agenda && total === 0 && (
                        <Alert severity="info">Nenhum pedido de coleta encontrado para esta semana.</Alert>
                    )}

                    {!carregando && agenda && total > 0 && (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    md: 'repeat(2, minmax(0, 1fr))',
                                    xl: 'repeat(7, minmax(220px, 1fr))',
                                },
                                gap: 2,
                                overflowX: 'auto',
                            }}
                        >
                            {weekDays.map((day) => {
                                const dayKey = toIsoDate(day);
                                const dayPedidos = pedidosPorDia.get(dayKey) || [];

                                return (
                                    <Card key={dayKey} className="card info-card">
                                        <Box p={2}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} mb={1.5}>
                                                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                                                    {formatDayLabel(day)}
                                                </Typography>
                                                <Chip
                                                    label={dayPedidos.length}
                                                    size="small"
                                                    color={dayPedidos.length > 0 ? 'primary' : 'default'}
                                                />
                                            </Box>

                                            <Stack spacing={1.2}>
                                                {dayPedidos.map((pedido) => (
                                                    <Box
                                                        key={pedido.id}
                                                        sx={{
                                                            p: 1.2,
                                                            borderRadius: 2,
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            backgroundColor: 'background.paper',
                                                        }}
                                                    >
                                                        <Typography variant="subtitle2" fontWeight={700}>
                                                            {pedido.paciente?.nome || 'Paciente não informado'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                                            {pedido.medico?.nome
                                                                ? `Dr(a). ${pedido.medico.nome}`
                                                                : 'Sem médico solicitante'}
                                                        </Typography>

                                                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={0.5}>
                                                            {(pedido.exames || []).slice(0, 3).map((exame) => (
                                                                <Chip
                                                                    key={exame.id}
                                                                    label={truncateExamName(exame.nome)}
                                                                    size="small"
                                                                    title={exame.nome}
                                                                />
                                                            ))}
                                                            {(pedido.exames || []).length > 3 && (
                                                                <Chip
                                                                    label={`+${pedido.exames.length - 3}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>

                                                        <Chip
                                                            label={STATUS_LABELS[pedido.status] || pedido.status}
                                                            color={STATUS_COLORS[pedido.status] || 'default'}
                                                            size="small"
                                                        />
                                                    </Box>
                                                ))}

                                                {dayPedidos.length === 0 && (
                                                    <Typography color="text.secondary" variant="body2">
                                                        Sem pedidos.
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Box>
                    )}
                </Stack>
            </BaseCard>
        </Box>
    );
}
