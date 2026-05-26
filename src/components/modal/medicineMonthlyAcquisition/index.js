import { useEffect, useState } from 'react';
import InputMask from 'react-input-mask';
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
import { api } from '../../../services/api';
import { addAlertMessage } from '../../../store/ducks/Layout';
import { upsertMonthlyAcquisitionFetch } from '../../../store/fetchActions/medicineMonthlyAcquisitions';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';

const EMPTY = {
    medicine_item_id: '',
    reference_month: '',
    acquired_quantity: '',
    unit_measure: '',
    source_document: '',
    note: '',
};

export default function MedicineMonthlyAcquisitionDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { medicines } = useSelector(state => state.medicines);
    const [form, setForm] = useState(EMPTY);
    const [units, setUnits] = useState([]);
    const [sources, setSources] = useState([]);

    const toApiMonth = (masked) => {
        const parts = (masked || '').replace(/_/g, '').split('/');
        if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 4) return '';
        return `${parts[1]}-${parts[0]}`;
    };

    useEffect(() => {
        if (open) {
            dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
            const now = new Date();
            const maskedDefault = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            setForm({ ...EMPTY, reference_month: maskedDefault });
            api.get('/pharmacy/catalogs')
                .then((res) => {
                    setUnits(res.data?.units || []);
                    setSources(res.data?.acquisition_sources || []);
                })
                .catch(() => dispatch(addAlertMessage('Não foi possível carregar os catálogos da farmácia.')));
        }
    }, [open]);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const save = () => {
        dispatch(upsertMonthlyAcquisitionFetch({
            ...form,
            reference_month: toApiMonth(form.reference_month),
            acquired_quantity: Number(form.acquired_quantity || 0),
            source_document: form.source_document || null,
            note: form.note || null,
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
            <DialogTitle>Aquisição Mensal</DialogTitle>
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
                        <InputMask mask="99/9999" value={form.reference_month} onChange={change}>
                            {(inputProps) => (
                                <TextField
                                    {...inputProps}
                                    name="reference_month"
                                    label="Mês de Referência"
                                    placeholder="MM/AAAA"
                                    fullWidth
                                    required
                                    inputProps={{ ...inputProps.inputProps, inputMode: 'numeric' }}
                                />
                            )}
                        </InputMask>
                        <TextField name="acquired_quantity" type="number" label="Quantidade Adquirida" value={form.acquired_quantity} onChange={change} fullWidth required />
                        <FormControl fullWidth required>
                            <InputLabel>Unidade de Medida</InputLabel>
                            <Select name="unit_measure" value={form.unit_measure} label="Unidade de Medida" onChange={change}>
                                {units.map((u) => (
                                    <MenuItem key={u.id} value={u.code}>{u.code} - {u.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Origem da Aquisição</InputLabel>
                            <Select name="source_document" value={form.source_document} label="Origem da Aquisição" onChange={change}>
                                <MenuItem value=""><em>Não informar</em></MenuItem>
                                {sources.map((s) => (
                                    <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField name="note" label="Observação" value={form.note} onChange={change} fullWidth />
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
