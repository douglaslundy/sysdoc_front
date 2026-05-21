import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import { upsertDailyStatusFetch } from '../../../store/fetchActions/medicineDailyStatuses';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';

const EMPTY = {
    medicine_item_id: '',
    reference_date: '',
    availability_status: 'available',
    available_quantity: '',
    restock_forecast_date: '',
    public_note: '',
};

export default function MedicineDailyStatusDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { medicines } = useSelector(state => state.medicines);
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        if (open) {
            dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
            setForm({ ...EMPTY, reference_date: new Date().toISOString().slice(0, 10) });
        }
    }, [open]);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const save = () => {
        dispatch(upsertDailyStatusFetch({
            ...form,
            available_quantity: form.available_quantity === '' ? null : Number(form.available_quantity),
            restock_forecast_date: form.restock_forecast_date || null,
            public_note: form.public_note || null,
        }, onSuccess));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '700px',
                    maxWidth: '96vw',
                    maxHeight: '92vh',
                    background: 'var(--lg-glass-modal)',
                    backdropFilter: 'var(--lg-blur-modal)',
                    WebkitBackdropFilter: 'var(--lg-blur-modal)',
                    border: '0.5px solid var(--lg-border)',
                    borderTop: '1px solid var(--lg-border-strong)',
                    boxShadow: 'var(--lg-shadow-modal)',
                    borderRadius: '20px',
                    '& .MuiInputLabel-root': {
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--lg-text-muted)',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                    },
                    '& .MuiInputBase-root': {
                        background: 'var(--lg-glass-input)',
                        border: '0.5px solid var(--lg-border-input)',
                        borderRadius: '10px',
                        color: 'var(--lg-text-primary)',
                        boxShadow: '0 1px 3px rgba(var(--lg-accent-rgb), 0.05), 0 1px 0 rgba(255,255,255,0.1) inset',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                    },
                    '& .MuiInputBase-root.Mui-focused': {
                        background: 'var(--lg-glass-input-focus)',
                        boxShadow: 'var(--lg-focus-ring)',
                    },
                    '& .MuiInputBase-input::placeholder': {
                        color: 'var(--lg-text-muted)',
                        opacity: 1,
                    },
                },
            }}
        >
            <DialogTitle>Atualizar Status Diário</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        <FormControl fullWidth required>
                            <InputLabel>Medicamento</InputLabel>
                            <Select name="medicine_item_id" value={form.medicine_item_id} label="Medicamento" onChange={change}>
                                {medicines.map((m) => (
                                    <MenuItem key={m.id} value={m.id}>{m.active_ingredient} {m.concentration}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField name="reference_date" label="Data de Referência" type="date" value={form.reference_date} onChange={change} InputLabelProps={{ shrink: true }} fullWidth required />
                        <FormControl fullWidth required>
                            <InputLabel>Disponibilidade</InputLabel>
                            <Select name="availability_status" value={form.availability_status} label="Disponibilidade" onChange={change}>
                                <MenuItem value="available">Disponível</MenuItem>
                                <MenuItem value="unavailable">Indisponível</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField name="available_quantity" type="number" label="Quantidade Disponível" value={form.available_quantity} onChange={change} fullWidth />
                        <TextField name="restock_forecast_date" label="Previsão de Reposição" type="date" value={form.restock_forecast_date} onChange={change} InputLabelProps={{ shrink: true }} fullWidth />
                        <TextField name="public_note" label="Observação Pública" value={form.public_note} onChange={change} fullWidth />
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.6, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        py: 1.1,
                        px: 2.2,
                        borderRadius: '10px',
                        background: 'var(--lg-glass-input)',
                        border: '0.5px solid var(--lg-border-input)',
                        color: 'var(--lg-text-secondary)',
                        textTransform: 'none',
                        '&:hover': {
                            background: 'var(--lg-glass-input-focus)',
                            color: 'var(--lg-text-primary)',
                            border: '0.5px solid var(--lg-border-input)',
                        },
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={save}
                    variant="contained"
                    sx={{
                        py: 1.1,
                        px: 2.2,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--lg-accent), #6D28D9)',
                        boxShadow: 'var(--lg-shadow-btn)',
                        textTransform: 'none',
                        '&:hover': {
                            opacity: 0.92,
                            transform: 'translateY(-1px)',
                            boxShadow: 'var(--lg-shadow-btn-hover)',
                            background: 'linear-gradient(135deg, var(--lg-accent-hover), #7C3AED)',
                        },
                    }}
                >
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
