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
import { api } from '../../../services/api';
import { addAlertMessage } from '../../../store/ducks/Layout';
import { upsertMonthlyAcquisitionFetch } from '../../../store/fetchActions/medicineMonthlyAcquisitions';

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

    useEffect(() => {
        if (open) {
            setForm({ ...EMPTY, reference_month: new Date().toISOString().slice(0, 7) });
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
            acquired_quantity: Number(form.acquired_quantity || 0),
            source_document: form.source_document || null,
            note: form.note || null,
        }, onSuccess));
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { width: '90%', maxWidth: '700px' } }}>
            <DialogTitle>Aquisição Mensal</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        <FormControl fullWidth required>
                            <InputLabel>Medicamento</InputLabel>
                            <Select name="medicine_item_id" value={form.medicine_item_id} label="Medicamento" onChange={change}>
                                {medicines.map((m) => (
                                    <MenuItem key={m.id} value={m.id}>{m.active_ingredient} ({m.internal_code})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField name="reference_month" label="Mês de Referência (AAAA-MM)" value={form.reference_month} onChange={change} fullWidth required />
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
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Cancelar</Button>
                <Button onClick={save} variant="contained">Salvar</Button>
            </DialogActions>
        </Dialog>
    );
}
