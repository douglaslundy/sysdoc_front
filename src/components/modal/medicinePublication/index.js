import { useState } from 'react';
import { useDispatch } from 'react-redux';
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
import { registerMedicinePublicationFetch } from '../../../store/fetchActions/medicinePublications';

const EMPTY = {
    reference_type: 'daily',
    reference_id: '',
    channel: 'site',
    status: 'published',
    published_at: '',
};

export default function MedicinePublicationDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));
    const save = () => {
        dispatch(registerMedicinePublicationFetch({
            ...form,
            reference_id: Number(form.reference_id),
            published_at: form.published_at || null,
        }, onSuccess));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '600px',
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
            <DialogTitle>Register Publication Evidence</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel>Reference Type</InputLabel>
                            <Select name="reference_type" value={form.reference_type} label="Reference Type" onChange={change}>
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField name="reference_id" label="Reference ID" value={form.reference_id} onChange={change} fullWidth required />
                        <FormControl fullWidth>
                            <InputLabel>Channel</InputLabel>
                            <Select name="channel" value={form.channel} label="Channel" onChange={change}>
                                <MenuItem value="site">Site</MenuItem>
                                <MenuItem value="panel">Panel</MenuItem>
                                <MenuItem value="instagram">Instagram</MenuItem>
                                <MenuItem value="facebook">Facebook</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select name="status" value={form.status} label="Status" onChange={change}>
                                <MenuItem value="published">Published</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField name="published_at" type="datetime-local" label="Published At" value={form.published_at} onChange={change} InputLabelProps={{ shrink: true }} fullWidth />
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Cancel</Button>
                <Button onClick={save} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
