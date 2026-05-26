import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Alert, Box, Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { api } from '../../../services/api';
import { addMedicineFetch, editMedicineFetch } from '../../../store/fetchActions/medicines';

const EMPTY = {
    internal_code: '',
    brand_name: '',
    active_ingredient: '',
    concentration: '',
    pharmaceutical_form: '',
    presentation: '',
    unit_measure: '',
    ean_code: '',
    is_free_distribution: true,
    is_controlled: false,
    is_judicial_order: false,
    is_high_cost: false,
    active: true,
    technical_notes: '',
};

export default function MedicineDialog({ open, onClose, medicine, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);
    const [units, setUnits] = useState([]);
    const [forms, setForms] = useState([]);
    const [presentations, setPresentations] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        setForm(medicine ? {
            ...EMPTY,
            ...medicine,
        } : EMPTY);
        setErrorMessage('');
    }, [medicine?.id, open]);

    useEffect(() => {
        if (open) {
            api.get('/pharmacy/catalogs')
                .then((res) => {
                    setUnits(res.data?.units || []);
                    setForms(res.data?.pharmaceutical_forms || []);
                    setPresentations(res.data?.presentations || []);
                })
                .catch(() => setErrorMessage('Não foi possível carregar os catálogos da farmácia.'));
        }
    }, [open]);

    const change = ({ target }) => {
        const value = target.type === 'checkbox' ? target.checked : target.value;
        setForm((f) => ({ ...f, [target.name]: value }));
        if (errorMessage) setErrorMessage('');
    };

    const save = () => {
        if (medicine?.id) {
            dispatch(editMedicineFetch(medicine.id, form, onSuccess, setErrorMessage));
            return;
        }
        dispatch(addMedicineFetch(form, onSuccess, setErrorMessage));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '900px',
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
            <DialogTitle>{medicine?.id ? 'Editar Medicamento' : 'Novo Medicamento'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
                        <TextField name="internal_code" label="Código Interno" value={form.internal_code} onChange={change} fullWidth required />
                        <TextField name="brand_name" label="Nome Comercial" value={form.brand_name || ''} onChange={change} fullWidth />
                        <TextField name="active_ingredient" label="Princípio Ativo" value={form.active_ingredient} onChange={change} fullWidth required />
                        <TextField name="concentration" label="Concentração" value={form.concentration} onChange={change} fullWidth required />
                        <FormControl fullWidth required>
                            <InputLabel>Forma Farmacêutica</InputLabel>
                            <Select name="pharmaceutical_form" value={form.pharmaceutical_form} label="Forma Farmacêutica" onChange={change}>
                                {forms.map((f) => (
                                    <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Apresentação</InputLabel>
                            <Select name="presentation" value={form.presentation} label="Apresentação" onChange={change}>
                                {presentations.map((p) => (
                                    <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Unidade de Medida</InputLabel>
                            <Select name="unit_measure" value={form.unit_measure} label="Unidade de Medida" onChange={change}>
                                {units.map((u) => (
                                    <MenuItem key={u.id} value={u.code}>{u.code} - {u.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField name="ean_code" label="Código EAN" value={form.ean_code || ''} onChange={change} fullWidth />
                        <TextField name="technical_notes" label="Observações Técnicas" value={form.technical_notes || ''} onChange={change} fullWidth />
                        <FormControlLabel control={<Checkbox name="is_free_distribution" checked={!!form.is_free_distribution} onChange={change} />} label="Distribuição Gratuita" />
                        <FormControlLabel control={<Checkbox name="is_controlled" checked={!!form.is_controlled} onChange={change} />} label="Medicamento Controlado" />
                        <FormControlLabel control={<Checkbox name="is_judicial_order" checked={!!form.is_judicial_order} onChange={change} />} label="Ordem Judicial" />
                        <FormControlLabel control={<Checkbox name="is_high_cost" checked={!!form.is_high_cost} onChange={change} />} label="Alto Custo" />
                        <FormControlLabel control={<Checkbox name="active" checked={!!form.active} onChange={change} />} label="Ativo" />
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
