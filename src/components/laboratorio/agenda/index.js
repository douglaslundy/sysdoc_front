import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import AlertModal from '../../messagesModal';
import BasicDatePicker from '../../inputs/datePicker';
import PedidoModal from '../../modal/pedido';
import { api } from '../../../services/api';
import { openPedidoModal } from '../../../store/ducks/Layout';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Carregando } from '../../ui/carregando';
import { Pilula } from '../../ui/pilula';
import { cn } from '../../../lib/cn';

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
        dispatch(openPedidoModal());
    };

    const total = agenda?.total ?? 0;
    const periodLabel = viewMode === 'month'
        ? formatMonthLabel(baseDate)
        : formatRangeLabel(periodStart, periodEnd);

    const renderDayCard = (day, options = {}) => {
        const { empty = false, clickToOpen = false, monthCell = false } = options;

        if (empty) {
            return <div key={day?.key} className="min-h-[156px] rounded-xl border border-dashed border-border opacity-35" />;
        }

        const dayKey = toIsoDate(day);
        const dayPedidos = pedidosPorDia.get(dayKey) || [];

        return (
            <div
                key={dayKey}
                onClick={clickToOpen ? () => openPedidoForDate(day) : undefined}
                className={cn(
                    'flex h-full flex-col gap-1 rounded-xl border border-border bg-card p-2 transition-colors',
                    monthCell ? 'min-h-[170px]' : 'min-h-[190px]',
                    clickToOpen && 'cursor-pointer hover:border-primary/60 hover:bg-hover',
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold capitalize">
                        {monthCell ? day.toLocaleDateString('pt-BR', { day: '2-digit' }) : formatDayLabel(day)}
                    </span>
                    <Pilula tom={dayPedidos.length > 0 ? 'alerta' : 'neutro'}>{dayPedidos.length}</Pilula>
                </div>

                <Button
                    variant="outline"
                    size="xs"
                    className="self-start"
                    onClick={(event) => {
                        event.stopPropagation();
                        openPedidoForDate(day);
                    }}
                >
                    <Plus /> Agendar
                </Button>

                <div className="grid flex-1 content-start gap-1">
                    {dayPedidos.map((pedido, index) => (
                        <p
                            key={pedido.id}
                            className={cn('truncate text-[11px] font-bold', index < dayPedidos.length - 1 && 'border-b border-border pb-1')}
                        >
                            {pedido.paciente?.nome || 'Paciente não informado'}
                        </p>
                    ))}

                    {dayPedidos.length === 0 && <p className="text-[10px] text-muted-foreground">Sem pedidos.</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="lab-agenda-page">
            <PedidoModal defaultDataColeta={defaultDataColeta} onSaved={buscarAgenda} />
            <AlertModal />
            <Card>
                <CardHeader>
                    <CardTitle>Agenda de Coleta</CardTitle>
                    <CardAction className="flex flex-wrap items-center gap-2">
                        <Pilula tom="alerta">{periodLabel}</Pilula>
                        <Pilula tom={total > 0 ? 'sucesso' : 'neutro'}>{`${total} pedido(s)`}</Pilula>
                    </CardAction>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[200px] flex-1">
                            <BasicDatePicker
                                label="Data base"
                                value={baseDate}
                                setValue={(value) => setBaseDate(value || new Date())}
                            />
                        </div>
                        <Button variant={viewMode === 'week' ? 'default' : 'outline'} onClick={() => setViewMode('week')}>
                            Semana
                        </Button>
                        <Button variant={viewMode === 'month' ? 'default' : 'outline'} onClick={() => setViewMode('month')}>
                            Mês
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setBaseDate((current) => (viewMode === 'month' ? addMonths(current, -1) : addDays(current, -7)))}
                        >
                            <ChevronLeft /> {viewMode === 'month' ? 'Mês anterior' : 'Semana anterior'}
                        </Button>
                        <Button variant="outline" onClick={() => setBaseDate(new Date())}>
                            Hoje
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setBaseDate((current) => (viewMode === 'month' ? addMonths(current, 1) : addDays(current, 7)))}
                        >
                            {viewMode === 'month' ? 'Próximo mês' : 'Próxima semana'} <ChevronRight />
                        </Button>
                    </div>

                    {erro && <Banner tom="perigo">{erro}</Banner>}

                    {carregando && <Carregando>Carregando agenda...</Carregando>}

                    {!carregando && agenda && (
                        <div className="grid gap-3">
                            {viewMode === 'month' && (
                                <div className="grid grid-cols-7 gap-[3px]">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label) => (
                                        <span key={label} className="text-center text-xs font-bold tracking-[0.06em] text-muted-foreground uppercase">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div
                                className={cn(
                                    'grid items-stretch gap-[3px]',
                                    viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-7',
                                )}
                            >
                                {viewMode === 'month'
                                    ? monthCells.map((cell) => renderDayCard(cell.date, { empty: cell.empty, clickToOpen: !cell.empty, monthCell: true }))
                                    : weekDays.map((day) => renderDayCard(day, { clickToOpen: false, monthCell: false }))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
