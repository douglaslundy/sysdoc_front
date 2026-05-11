import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Box, Button, Stack, TextField } from '@mui/material';
import { addEstabelecimentoFetch, editEstabelecimentoFetch } from '../../../store/fetchActions/estabelecimentos';

const EMPTY = { nome_responsavel: '', nome_estabelecimento: '', endereco: '', cnaes: '' };

export default function EstabelecimentoDialog({ open, onClose, estabelecimento, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        if (open) {
            setForm(estabelecimento
                ? {
                    nome_responsavel: estabelecimento.nome_responsavel || '',
                    nome_estabelecimento: estabelecimento.nome_estabelecimento || '',
                    endereco: estabelecimento.endereco || '',
                    cnaes: estabelecimento.cnaes || '',
                }
                : EMPTY
            );
        }
    }, [open, estabelecimento?.id]);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const handleSalvar = () => {
        if (estabelecimento?.id) {
            dispatch(editEstabelecimentoFetch(estabelecimento.id, form, onSuccess));
        } else {
            dispatch(addEstabelecimentoFetch(form, onSuccess));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {estabelecimento?.id ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="Nome do Estabelecimento"
                            name="nome_estabelecimento"
                            value={form.nome_estabelecimento}
                            onChange={change}
                            required
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 255 }}
                        />
                        <TextField
                            label="Responsável"
                            name="nome_responsavel"
                            value={form.nome_responsavel}
                            onChange={change}
                            required
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 255 }}
                        />
                        <TextField
                            label="Endereço"
                            name="endereco"
                            value={form.endereco}
                            onChange={change}
                            required
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 500 }}
                        />
                        <TextField
                            label="CNAE(s)"
                            name="cnaes"
                            value={form.cnaes}
                            onChange={change}
                            required
                            fullWidth
                            multiline
                            minRows={2}
                            inputProps={{ autoComplete: 'off' }}
                            helperText="Ex: 86.30-3-04"
                        />
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Cancelar</Button>
                <Button onClick={handleSalvar} variant="contained">Gravar</Button>
            </DialogActions>
        </Dialog>
    );
}
