import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { addEstabelecimentoFetch, editEstabelecimentoFetch } from '../../../store/fetchActions/estabelecimentos';
import { api } from '../../../services/api';

const EMPTY = {
    nome_responsavel: '',
    nome_estabelecimento: '',
    endereco: '',
    cnaes: [],
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    telefone: '',
    obs: '',
};

export default function EstabelecimentoDialog({ open, onClose, estabelecimento, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);
    const [cnaeOptions, setCnaeOptions] = useState([]);
    const [cnaeBusca, setCnaeBusca] = useState('');
    const [cnaeInputValue, setCnaeInputValue] = useState('');

    const selectedOptions = useMemo(
        () => (form.cnaes || []).map((codigo) => {
            const found = cnaeOptions.find((opt) => opt.codigo === codigo);
            return found || { codigo, descricao: '' };
        }),
        [form.cnaes, cnaeOptions]
    );

    const maskCnaeInput = (raw) => {
        const digits = String(raw || '').replace(/\D/g, '').slice(0, 7);
        if (digits.length <= 4) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
        return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`;
    };

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            const res = await api.get('/cnaes/select', { params: { busca: cnaeBusca || undefined } });
            setCnaeOptions(Array.isArray(res.data) ? res.data : []);
        };
        load();
    }, [open, cnaeBusca]);

    useEffect(() => {
        if (!open) return;
        setForm(estabelecimento
            ? {
                nome_responsavel: estabelecimento.nome_responsavel || '',
                nome_estabelecimento: estabelecimento.nome_estabelecimento || '',
                endereco: estabelecimento.endereco || '',
                cnaes: Array.isArray(estabelecimento.cnaes) ? estabelecimento.cnaes : [],
                razao_social: estabelecimento.razao_social || '',
                nome_fantasia: estabelecimento.nome_fantasia || '',
                cnpj: estabelecimento.cnpj || '',
                telefone: estabelecimento.telefone || '',
                obs: estabelecimento.obs || '',
            }
            : EMPTY);
        setCnaeBusca('');
        setCnaeInputValue('');
    }, [open, estabelecimento?.id]);

    const change = ({ target }) => setForm((f) => ({ ...f, [target.name]: target.value }));

    const handleSalvar = () => {
        const payload = { ...form, cnaes: form.cnaes || [] };
        if (estabelecimento?.id) {
            dispatch(editEstabelecimentoFetch(estabelecimento.id, payload, onSuccess));
        } else {
            dispatch(addEstabelecimentoFetch(payload, onSuccess));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { width: '960px', maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto' } }}>
            <DialogTitle>{estabelecimento?.id ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Dados principais</Typography>
                    <Stack spacing={2}>
                        <TextField label="Nome do Estabelecimento" name="nome_estabelecimento" value={form.nome_estabelecimento} onChange={change} required fullWidth />
                        <TextField label="Responsável" name="nome_responsavel" value={form.nome_responsavel} onChange={change} required fullWidth />
                        <TextField label="Endereço" name="endereco" value={form.endereco} onChange={change} required fullWidth />
                        <Autocomplete
                            multiple
                            options={cnaeOptions}
                            value={selectedOptions}
                            inputValue={cnaeInputValue}
                            onChange={(_, values) => setForm((f) => ({ ...f, cnaes: values.map((v) => v.codigo) }))}
                            onInputChange={(_, value, reason) => {
                                if (reason === 'input') {
                                    const masked = maskCnaeInput(value);
                                    setCnaeInputValue(masked);
                                    setCnaeBusca(masked);
                                }
                                if (reason === 'clear') {
                                    setCnaeInputValue('');
                                    setCnaeBusca('');
                                }
                            }}
                            filterOptions={(options) => options}
                            getOptionLabel={(option) => `${option.codigo}${option.descricao ? ` - ${option.descricao}` : ''}`}
                            isOptionEqualToValue={(a, b) => a.codigo === b.codigo}
                            renderInput={(params) => <TextField {...params} label="CNAEs" required helperText="Selecione um ou mais CNAEs oficiais" />}
                        />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Dados complementares</Typography>
                    <Stack spacing={2}>
                        <TextField label="Razão Social" name="razao_social" value={form.razao_social} onChange={change} fullWidth />
                        <TextField label="Nome Fantasia" name="nome_fantasia" value={form.nome_fantasia} onChange={change} fullWidth />
                        <TextField label="CNPJ" name="cnpj" value={form.cnpj} onChange={change} fullWidth helperText="Formato: 00.000.000/0000-00" />
                        <TextField label="Telefone" name="telefone" value={form.telefone} onChange={change} fullWidth />
                        <TextField
                            label="Observações"
                            name="obs"
                            value={form.obs}
                            onChange={change}
                            fullWidth
                            multiline
                            minRows={1}
                            sx={{
                                '&& .MuiInputBase-root': {
                                    minHeight: '30px !important',
                                },
                                '&& .MuiInputBase-inputMultiline': {
                                    minHeight: '30px !important',
                                    height: '30px !important',
                                    lineHeight: '30px !important',
                                    paddingTop: '0 !important',
                                    paddingBottom: '0 !important',
                                },
                            }}
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
