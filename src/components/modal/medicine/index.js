import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Box, Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { api } from '../../../services/api';
import { addAlertMessage } from '../../../store/ducks/Layout';
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
    active: true,
    technical_notes: '',
};

export default function MedicineDialog({ open, onClose, medicine, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);
    const [units, setUnits] = useState([]);
    const [forms, setForms] = useState([]);
    const [presentations, setPresentations] = useState([]);

    useEffect(() => {
        setForm(medicine ? {
            ...EMPTY,
            ...medicine,
        } : EMPTY);
    }, [medicine?.id, open]);

    useEffect(() => {
        if (open) {
            api.get('/pharmacy/catalogs')
                .then((res) => {
                    setUnits(res.data?.units || []);
                    setForms(res.data?.pharmaceutical_forms || []);
                    setPresentations(res.data?.presentations || []);
                })
                .catch(() => dispatch(addAlertMessage('Não foi possível carregar os catálogos da farmácia.')));
        }
    }, [open]);

    const change = ({ target }) => {
        const value = target.type === 'checkbox' ? target.checked : target.value;
        setForm(f => ({ ...f, [target.name]: value }));
    };

    const save = () => {
        if (medicine?.id) {
            dispatch(editMedicineFetch(medicine.id, form, onSuccess));
            return;
        }
        dispatch(addMedicineFetch(form, onSuccess));
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
                },
            }}
        >
            <DialogTitle>{medicine?.id ? 'Editar Medicamento' : 'Novo Medicamento'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
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
                        <TextField name="technical_notes" label="Observações Técnicas" value={form.technical_notes || ''} onChange={change} fullWidth multiline minRows={2} />
                        <FormControlLabel control={<Checkbox name="is_free_distribution" checked={!!form.is_free_distribution} onChange={change} />} label="Distribuição Gratuita" />
                        <FormControlLabel control={<Checkbox name="is_controlled" checked={!!form.is_controlled} onChange={change} />} label="Medicamento Controlado" />
                        <FormControlLabel control={<Checkbox name="active" checked={!!form.active} onChange={change} />} label="Ativo" />
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Cancelar</Button>
                <Button onClick={save} variant="contained">Salvar</Button>
            </DialogActions>
        </Dialog>
    );
}
