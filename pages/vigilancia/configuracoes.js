import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Button, CircularProgress, Divider, Grid, IconButton,
    List, ListItem, ListItemText, TextField, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../src/components/baseCard/BaseCard';
import AlertModal from '../../src/components/messagesModal';
import { modalFormRootSx } from '../../src/components/modal/_shared/modalFormStyles';
import { getVigilanciaConfig, updateVigilanciaConfig } from '../../src/store/fetchActions/vigilanciaConfig';

const emptyForm = {
    estado: '',
    nome_municipio: '',
    nome_prefeitura: '',
    cnpj_prefeitura: '',
    nome_secretaria: '',
    cnpj_secretaria: '',
    divisao: '',
    endereco: '',
    cep: '',
    telefone: '',
    email: '',
    nome_responsavel: '',
    cargo_responsavel: '',
    grant_type: 'ALVARÁ SANITÁRIO DE FUNCIONAMENTO',
    observacoes: [],
};

export default function ConfiguracoesVigilancia() {
    const dispatch = useDispatch();
    const { config, loading } = useSelector((state) => state.vigilanciaConfig);

    const [form, setForm]         = useState(emptyForm);
    const [novaObs, setNovaObs]   = useState('');

    useEffect(() => {
        dispatch(getVigilanciaConfig());
    }, []);

    useEffect(() => {
        if (config) {
            setForm({
                estado:           config.estado           ?? '',
                nome_municipio:   config.nome_municipio   ?? '',
                nome_prefeitura:  config.nome_prefeitura  ?? '',
                cnpj_prefeitura:  config.cnpj_prefeitura  ?? '',
                nome_secretaria:  config.nome_secretaria  ?? '',
                cnpj_secretaria:  config.cnpj_secretaria  ?? '',
                divisao:          config.divisao          ?? '',
                endereco:         config.endereco         ?? '',
                cep:              config.cep              ?? '',
                telefone:         config.telefone         ?? '',
                email:            config.email            ?? '',
                nome_responsavel: config.nome_responsavel ?? '',
                cargo_responsavel:config.cargo_responsavel?? '',
                grant_type:       config.grant_type       ?? 'ALVARÁ SANITÁRIO DE FUNCIONAMENTO',
                observacoes:      config.observacoes      ?? [],
            });
        }
    }, [config]);

    const change = ({ target }) =>
        setForm(f => ({ ...f, [target.name]: target.value }));

    const addObs = () => {
        const text = novaObs.trim();
        if (!text) return;
        setForm(f => ({ ...f, observacoes: [...(f.observacoes || []), text] }));
        setNovaObs('');
    };

    const removeObs = (idx) =>
        setForm(f => ({ ...f, observacoes: f.observacoes.filter((_, i) => i !== idx) }));

    const handleSave = () => {
        dispatch(updateVigilanciaConfig({
            ...form,
            cep:             form.cep.replace(/\D/g, ''),
            cnpj_prefeitura: form.cnpj_prefeitura.replace(/\D/g, ''),
            cnpj_secretaria: form.cnpj_secretaria.replace(/\D/g, ''),
        }));
    };

    if (loading && !config) {
        return (
            <Box display="flex" justifyContent="center" p={6}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={modalFormRootSx} className="queue-page vigilancia-config-page">
            <AlertModal />
            <BaseCard title="Configurações da Vigilância Sanitária">

                {/* ── Identificação Institucional ── */}
                <Typography variant="h6" gutterBottom mt={1}>Identificação Institucional</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                        <TextField className="lg-search-field" fullWidth label="UF (Estado)" name="estado"
                            value={form.estado} onChange={change}
                            inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField className="lg-search-field" fullWidth label="Município" name="nome_municipio"
                            value={form.nome_municipio} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Nome da Prefeitura" name="nome_prefeitura"
                            value={form.nome_prefeitura} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField className="lg-search-field" fullWidth label="CNPJ da Prefeitura" name="cnpj_prefeitura"
                            value={form.cnpj_prefeitura} onChange={change}
                            inputProps={{ maxLength: 18 }} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <TextField className="lg-search-field" fullWidth label="Nome da Secretaria" name="nome_secretaria"
                            value={form.nome_secretaria} onChange={change}
                            placeholder="Ex: Secretaria Municipal de Saúde" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField className="lg-search-field" fullWidth label="CNPJ da Secretaria" name="cnpj_secretaria"
                            value={form.cnpj_secretaria} onChange={change}
                            inputProps={{ maxLength: 18 }} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <TextField className="lg-search-field" fullWidth label="Divisão" name="divisao"
                            value={form.divisao} onChange={change}
                            placeholder="Ex: Divisão de Vigilância Sanitária" />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Contato ── */}
                <Typography variant="h6" gutterBottom>Endereço e Contato</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Endereço" name="endereco"
                            value={form.endereco} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField className="lg-search-field" fullWidth label="CEP" name="cep"
                            value={form.cep} onChange={change}
                            inputProps={{ maxLength: 9 }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField className="lg-search-field" fullWidth label="Telefone" name="telefone"
                            value={form.telefone} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="E-mail" name="email"
                            value={form.email} onChange={change}
                            type="email" />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Responsável ── */}
                <Typography variant="h6" gutterBottom>Responsável pela Vigilância</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Nome do Responsável" name="nome_responsavel"
                            value={form.nome_responsavel} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Cargo" name="cargo_responsavel"
                            value={form.cargo_responsavel} onChange={change}
                            placeholder="Ex: Coordenador de Vigilância Sanitária" />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Tipo de Alvará (grant_type) ── */}
                <Typography variant="h6" gutterBottom>Tipo de Alvará</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <TextField className="lg-search-field" fullWidth label="Título do Alvará (grant_type)" name="grant_type"
                            value={form.grant_type} onChange={change}
                            placeholder="Ex: ALVARÁ SANITÁRIO DE FUNCIONAMENTO" />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Observações ── */}
                <Typography variant="h6" gutterBottom>Observações (aparecem no PDF do Alvará)</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField className="lg-search-field"
                        fullWidth
                        size="small"
                        label="Nova observação"
                        value={novaObs}
                        onChange={e => setNovaObs(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addObs()}
                        inputProps={{ maxLength: 500 }}
                    />
                    <Button variant="outlined" onClick={addObs} sx={{ whiteSpace: 'nowrap' }}>
                        Adicionar
                    </Button>
                </Box>
                {form.observacoes && form.observacoes.length > 0 && (
                    <List dense disablePadding>
                        {form.observacoes.map((obs, i) => (
                            <ListItem
                                key={i}
                                disableGutters
                                secondaryAction={
                                    <IconButton size="small" onClick={() => removeObs(i)} color="error">
                                        <FeatherIcon icon="trash-2" width="16" height="16" />
                                    </IconButton>
                                }
                                sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 0.5 }}
                            >
                                <ListItemText primary={`${i + 1}. ${obs}`} />
                            </ListItem>
                        ))}
                    </List>
                )}

                <Divider sx={{ my: 3 }} />

                <Box display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={loading}
                        onClick={handleSave}
                        startIcon={<FeatherIcon icon="save" width="18" height="18" />}
                    >
                        {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                </Box>

            </BaseCard>
        </Box>
    );
}
