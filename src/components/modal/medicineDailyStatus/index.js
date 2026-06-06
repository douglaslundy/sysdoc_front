import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    Box,
    Button,
    Dialog,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import BaseCard from '../../baseCard/BaseCard';
import { upsertDailyStatusFetch } from '../../../store/fetchActions/medicineDailyStatuses';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';
import { modalPrimaryButtonSx, modalSecondaryButtonSx } from '../_shared/modalFormStyles';

const EMPTY = {
    medicine_item_id: '',
    reference_date: '',
    availability_status: 'available',
    available_quantity: '',
    restock_forecast_date: '',
    public_note: '',
};

const localDate = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export default function MedicineDailyStatusDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { medicines } = useSelector(state => state.medicines);
    const [form, setForm] = useState(EMPTY);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (open) {
            dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
            setForm({ ...EMPTY, reference_date: localDate() });
            setErrorMessage('');
        }
    }, [open, dispatch]);

    const change = ({ target }) => {
        setForm(f => ({ ...f, [target.name]: target.value }));
        if (errorMessage) setErrorMessage('');
    };

    const save = () => {
        dispatch(upsertDailyStatusFetch({
            ...form,
            available_quantity: form.available_quantity === '' ? null : Number(form.available_quantity),
            restock_forecast_date: form.restock_forecast_date || null,
            public_note: form.public_note || null,
        }, onSuccess, setErrorMessage));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                className: 'pharmacy-daily-status-dialog-shell',
            }}
        >
            <BaseCard title="Atualizar Status Diário">
                <Stack spacing={2}>
                    {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
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
                <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
                    <Button onClick={onClose} variant="outlined" sx={modalSecondaryButtonSx}>
                        Cancelar
                    </Button>
                    <Button onClick={save} variant="contained" sx={modalPrimaryButtonSx}>
                        Salvar
                    </Button>
                </Box>
            </BaseCard>
        </Dialog>
    );
}

