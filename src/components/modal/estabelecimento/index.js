import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { addEstabelecimentoFetch, editEstabelecimentoFetch } from '../../../store/fetchActions/estabelecimentos';

const EMPTY = {
    nome_responsavel: '',
    nome_estabelecimento: '',
    endereco: '',
    cnaes: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    telefone: '',
    obs: '',
};

export default function EstabelecimentoDialog({ open, onClose, estabelecimento, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        if (open) {
            setForm(estabelecimento
                ? {
                    nome_responsavel:     estabelecimento.nome_responsavel || '',
                    nome_estabelecimento: estabelecimento.nome_estabelecimento || '',
                    endereco:             estabelecimento.endereco || '',
                    cnaes:                estabelecimento.cnaes || '',
                    razao_social:         estabelecimento.razao_social || '',
                    nome_fantasia:        estabelecimento.nome_fantasia || '',
                    cnpj:                 estabelecimento.cnpj || '',
                    telefone:             estabelecimento.telefone || '',
                    obs:                  estabelecimento.obs || '',
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
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '960px',
                    maxWidth: '96vw',
                    maxHeight: '92vh',
                    overflowY: 'auto',
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
            <DialogTitle>
                {estabelecimento?.id ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Dados principais</Typography>
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

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Dados complementares</Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Razão Social"
                            name="razao_social"
                            value={form.razao_social}
                            onChange={change}
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 255 }}
                        />
                        <TextField
                            label="Nome Fantasia"
                            name="nome_fantasia"
                            value={form.nome_fantasia}
                            onChange={change}
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 255 }}
                        />
                        <TextField
                            label="CNPJ"
                            name="cnpj"
                            value={form.cnpj}
                            onChange={change}
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 18 }}
                            helperText="Formato: 00.000.000/0000-00"
                        />
                        <TextField
                            label="Telefone"
                            name="telefone"
                            value={form.telefone}
                            onChange={change}
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 20 }}
                        />
                        <TextField
                            label="Observações"
                            name="obs"
                            value={form.obs}
                            onChange={change}
                            fullWidth
                            multiline
                            minRows={3}
                            inputProps={{ autoComplete: 'off', maxLength: 5000 }}
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
