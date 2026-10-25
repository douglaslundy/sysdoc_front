import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import ptBrLocale from 'date-fns/locale/pt-BR';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { replicateTripFetch } from '../../../../store/fetchActions/trips';
import { Button } from '../../../ui/button';
import { Dialogo, DialogoCabecalho, DialogoDescricao, DialogoRodape } from '../../../ui/dialogo';
import { cn } from '../../../../lib/cn';

const DIAS_DA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// shortcut: calendário só para esta tela (seleção múltipla de dias futuros); extrair para ui/ se outra tela precisar.
function CalendarioMultiplo({ mes, selecionadas, aoMudarMes, aoAlternar }) {
    const hoje = startOfDay(new Date());
    const dias = eachDayOfInterval({ start: startOfWeek(startOfMonth(mes)), end: endOfWeek(endOfMonth(mes)) });
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Mês anterior" disabled={!isBefore(hoje, startOfMonth(mes))} onClick={() => aoMudarMes(addMonths(mes, -1))}>
                    <ChevronLeft />
                </Button>
                <span className="font-display text-sm font-bold capitalize" aria-live="polite">{format(mes, 'MMMM yyyy', { locale: ptBrLocale })}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Próximo mês" onClick={() => aoMudarMes(addMonths(mes, 1))}>
                    <ChevronRight />
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {DIAS_DA_SEMANA.map((d, i) => <span key={i} aria-hidden>{d}</span>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
                {dias.map((dia) => {
                    const marcado = selecionadas.some((d) => isSameDay(d, dia));
                    const passado = isBefore(dia, hoje);
                    const doMes = isSameMonth(dia, mes);
                    return (
                        <button
                            key={dia.toISOString()}
                            type="button"
                            disabled={passado}
                            aria-pressed={marcado}
                            aria-label={format(dia, "d 'de' MMMM 'de' yyyy", { locale: ptBrLocale })}
                            onClick={() => aoAlternar(dia)}
                            className={cn(
                                'h-9 rounded-md text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-30',
                                marcado ? 'bg-primary font-bold text-primary-foreground' : 'hover:bg-hover',
                                !doMes && !marcado && 'text-muted-foreground/60',
                            )}
                        >
                            {format(dia, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function ReplicateTripModal({ open, trip, onClose }) {
    const dispatch = useDispatch();
    const [viewedDate, setViewedDate] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        setSelectedDates([]);
        setViewedDate(new Date());
        setSubmitting(false);
        onClose();
    };

    const toggleDate = (day) => {
        setSelectedDates((prev) => {
            const exists = prev.some((d) => isSameDay(d, day));
            return exists ? prev.filter((d) => !isSameDay(d, day)) : [...prev, day];
        });
    };

    const handleConfirm = () => {
        if (!trip?.id || selectedDates.length === 0) return;

        setSubmitting(true);
        const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));

        dispatch(replicateTripFetch(trip.id, dates, () => {
            handleClose();
        }, () => {
            setSubmitting(false);
        }));
    };

    return (
        <Dialogo aberto={Boolean(open)} aoFechar={handleClose} tamanho="sm">
            <DialogoCabecalho>Replicar Viagem</DialogoCabecalho>
            <DialogoDescricao className="mb-3">
                Selecione os dias para os quais deseja repetir esta viagem. Motorista e veículo ficarão em branco em cada nova viagem — atribua depois.
            </DialogoDescricao>

            <CalendarioMultiplo mes={viewedDate} selecionadas={selectedDates} aoMudarMes={setViewedDate} aoAlternar={toggleDate} />

            <p className="mt-3 text-sm" aria-live="polite">
                {selectedDates.length === 0
                    ? 'Nenhuma data selecionada.'
                    : `${selectedDates.length} data(s) selecionada(s).`}
            </p>

            <DialogoRodape>
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button type="button" onClick={handleConfirm} disabled={selectedDates.length === 0 || submitting}>Confirmar</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
