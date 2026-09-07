import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { isSameDay, format } from 'date-fns';
import ptBrLocale from 'date-fns/locale/pt-BR';
import { replicateTripFetch } from '../../../../store/fetchActions/trips';

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
        }));
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>Replicar Viagem</DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Selecione os dias para os quais deseja repetir esta viagem. Motorista e veículo ficarão em branco em cada nova viagem — atribua depois.
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBrLocale}>
                    <CalendarPicker
                        date={viewedDate}
                        minDate={new Date()}
                        onChange={(day) => { if (day) toggleDate(day); }}
                        onMonthChange={(month) => setViewedDate(month)}
                        renderDay={(day, _selectedDays, pickersDayProps) => {
                            const isSelected = selectedDates.some((d) => isSameDay(d, day));
                            return (
                                <PickersDay
                                    {...pickersDayProps}
                                    key={day.toString()}
                                    selected={isSelected}
                                />
                            );
                        }}
                    />
                </LocalizationProvider>

                <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                        {selectedDates.length === 0
                            ? 'Nenhuma data selecionada.'
                            : `${selectedDates.length} data(s) selecionada(s).`}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="outlined">
                    Cancelar
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={selectedDates.length === 0 || submitting}
                >
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
