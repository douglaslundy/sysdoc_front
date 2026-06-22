import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Alert, Box, Button, Card, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import BasicDatePicker from '../../inputs/datePicker';
import PedidoModal from '../../modal/pedido';
import { api } from '../../../services/api';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';
import { openModal } from '../../../store/ducks/Layout';

const addDays = (date, days) => {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
};

const addMonths = (date, months) => {
    const value = new Date(date);
    value.setMonth(value.getMonth() + months);
    return value;
};

const startOfWeek = (date) => {
    const value = new Date(date);
    const day = value.getDay();
    value.setDate(value.getDate() - day);
    value.setHours(0, 0, 0, 0);
    return value;
};

const startOfMonth = (date) => {
    const value = new Date(date);
    value.setDate(1);
    value.setHours(0, 0, 0, 0);
    return value;
};

const endOfMonth = (date) => {
    const value = new Date(date);
    value.setMonth(value.getMonth() + 1, 0);
    value.setHours(23, 59, 59, 999);
    return value;
};

const toIsoDate = (date) => date.toISOString().split('T')[0];

const formatRangeLabel = (start, end) =>
    `${start.toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}`;

const formatMonthLabel = (date) =>
    date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

const formatDayLabel = (date) =>
    date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
    });

const buildMonthCells = (baseDate) => {
    const firstDay = startOfMonth(baseDate);
    const lastDay = endOfMonth(baseDate);
    const cells = [];

    for (let i = 0; i < firstDay.getDay(); i += 1) {
        cells.push({ key: `empty-start-${i}`, empty: true });
    }

    const cursor = new Date(firstDay);
    while (cursor <= lastDay) {
        cells.push({ key: toIsoDate(cursor), date: new Date(cursor), empty: false });
        cursor.setDate(cursor.getDate() + 1);
    }

    while (cells.length % 7 !== 0) {
        cells.push({ key: `empty-end-${cells.length}`, empty: true });
    }

    return cells;
};

export default function AgendaColeta() {
    const dispatch = useDispatch();
    const [baseDate, setBaseDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week');
    const [agenda, setAgenda] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [defaultDataColeta, setDefaultDataColeta] = useState('');

    const periodStart = useMemo(() => (
        viewMode === 'month' ? startOfMonth(baseDate) : startOfWeek(baseDate)
    ), [baseDate, viewMode]);

    const periodEnd = useMemo(() => (
        viewMode === 'month' ? endOfMonth(baseDate) : addDays(periodStart, 6)
    ), [baseDate, viewMode, periodStart]);

    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(baseDate), index)),
        [baseDate]
    );

    const monthCells = useMemo(() => buildMonthCells(baseDate), [baseDate]);

    const buscarAgenda = useCallback(async () => {
        setCarregando(true);
        setErro('');
        try {
            const res = await api.get('/laboratorio/agenda', {
                params: {
                    inicio: toIsoDate(periodStart),
                    fim: toIsoDate(periodEnd),
                },
            });
            setAgenda(res.data);
        } catch (err) {
            setErro(err.response?.data?.message || 'Erro ao carregar agenda.');
            setAgenda(null);
        } finally {
            setCarregando(false);
        }
    }, [periodStart, periodEnd]);

    useEffect(() => {
        buscarAgenda();
    }, [buscarAgenda]);

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

    const openPedidoForDate = (date) => {
        const dateIso = toIsoDate(date);
        setDefaultDataColeta(dateIso);
        dispatch(openModal());
    };

    const total = agenda?.total ?? 0;
    const periodLabel = viewMode === 'month'
        ? formatMonthLabel(baseDate)
        : formatRangeLabel(periodStart, periodEnd);

    const renderDayCard = (day, options = {}) => {
        const { empty = false, clickToOpen = false, monthCell = false } = options;

        if (empty) {
            return (
                <Box
                    key={day?.key}
                    sx={{
                        minHeight: 156,
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        background: 'transparent',
                        opacity: 0.35,
                    }}
                />
            );
        }

        const dayKey = toIsoDate(day);
        const dayPedidos = pedidosPorDia.get(dayKey) || [];
        const buttonLabel = 'Agendar';

        return (
            <Card
                key={dayKey}
                className="card info-card"
                onClick={clickToOpen ? () => openPedidoForDate(day) : undefined}
                sx={{
                    m: 0,
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: monthCell ? 170 : 190,
                    height: '100%',
                    cursor: clickToOpen ? 'pointer' : 'default',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                    '&:hover': clickToOpen
                        ? {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 18px 30px rgba(2, 8, 27, 0.18)',
                              borderColor: 'rgba(var(--lg-accent-rgb), 0.42)',
                          }
                        : undefined,
                }}
            >
                <Box
                    p={0.2}
                    display="flex"
                    flexDirection="column"
                    gap="3px"
                    sx={{
                        flex: 1,
                        '& .agenda-day__title': { fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.1 },
                        '& .agenda-day__meta': { fontSize: '0.56rem', lineHeight: 1.2 },
                        '& .agenda-day__body': { fontSize: '0.62rem', lineHeight: 1.25 },
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography className="agenda-day__title" sx={{ textTransform: 'capitalize' }}>
                            {monthCell ? day.toLocaleDateString('pt-BR', { day: '2-digit' }) : formatDayLabel(day)}
                        </Typography>
                        <Chip
                            label={dayPedidos.length}
                            size="small"
                            color={dayPedidos.length > 0 ? 'primary' : 'default'}
                        />
                    </Box>

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FeatherIcon icon="plus" size={14} />}
                        onClick={(event) => {
                            event.stopPropagation();
                            openPedidoForDate(day);
                        }}
                        sx={{
                            alignSelf: 'flex-start',
                            py: 0.1,
                            px: 0.25,
                            fontSize: '0.58rem',
                            minWidth: 82,
                            mb: '3px',
                        }}
                    >
                        {buttonLabel}
                    </Button>

                    <Stack spacing="3px" sx={{ flex: 1, minHeight: 0 }}>
                        {dayPedidos.map((pedido, index) => (
                            <Typography
                                key={pedido.id}
                                className="agenda-day__body"
                                sx={{
                                    fontWeight: 700,
                                    pb: index < dayPedidos.length - 1 ? '3px' : 0,
                                    borderBottom: index < dayPedidos.length - 1 ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {pedido.paciente?.nome || 'Paciente não informado'}
                            </Typography>
                        ))}

                        {dayPedidos.length === 0 && (
                            <Typography className="agenda-day__meta" color="text.secondary">
                                Sem pedidos.
                            </Typography>
                        )}
                    </Stack>
                </Box>
            </Card>
        );
    };

    return (
        <Box sx={modalFormRootSx} className="queue-page lab-agenda-page">
            <PedidoModal defaultDataColeta={defaultDataColeta} onSaved={buscarAgenda} />
            <AlertModal />
            <BaseCard
                title="Agenda de Coleta"
                action={
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <Chip label={periodLabel} color="primary" size="small" />
                        <Chip label={`${total} pedido(s)`} color={total > 0 ? 'success' : 'default'} size="small" />
                    </Box>
                }
            >
                <Stack spacing={2}>
                    <Box
                        className="queue-page__toolbar"
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'minmax(200px, 1fr) auto auto auto auto auto' },
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
                            variant={viewMode === 'week' ? 'contained' : 'outlined'}
                            onClick={() => setViewMode('week')}
                        >
                            Semana
                        </Button>
                        <Button
                            variant={viewMode === 'month' ? 'contained' : 'outlined'}
                            onClick={() => setViewMode('month')}
                        >
                            Mês
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setBaseDate((current) => (viewMode === 'month' ? addMonths(current, -1) : addDays(current, -7)))}
                            startIcon={<FeatherIcon icon="chevron-left" size={16} />}
                        >
                            {viewMode === 'month' ? 'Mês anterior' : 'Semana anterior'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setBaseDate(new Date())}
                        >
                            Hoje
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setBaseDate((current) => (viewMode === 'month' ? addMonths(current, 1) : addDays(current, 7)))}
                            endIcon={<FeatherIcon icon="chevron-right" size={16} />}
                        >
                            {viewMode === 'month' ? 'Próximo mês' : 'Próxima semana'}
                        </Button>
                    </Box>

                    {erro && <Alert severity="error">{erro}</Alert>}

                    {carregando && (
                        <Box py={6} display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    )}

                    {!carregando && agenda && (
                        <Stack spacing={1.5}>
                            {viewMode === 'month' && (
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                        gap: '3px',
                                    }}
                                >
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label) => (
                                        <Typography
                                            key={label}
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ textAlign: 'center', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}
                                        >
                                            {label}
                                        </Typography>
                                    ))}
                                </Box>
                            )}

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: viewMode === 'month'
                                    ? 'repeat(7, minmax(0, 1fr))'
                                    : { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(7, minmax(0, 1fr))' },
                                gap: '3px',
                                alignItems: 'stretch',
                            }}
                        >
                            {viewMode === 'month'
                                ? monthCells.map((cell) => renderDayCard(cell.date, { empty: cell.empty, clickToOpen: !cell.empty, monthCell: true }))
                                : weekDays.map((day) => renderDayCard(day, { clickToOpen: false, monthCell: false }))}
                        </Box>
                        </Stack>
                    )}
                </Stack>
            </BaseCard>
        </Box>
    );
}
