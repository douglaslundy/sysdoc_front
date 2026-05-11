import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Button, Card, CardContent, CircularProgress,
    Divider, FormControlLabel, Grid, Switch, TextField, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../src/components/baseCard/BaseCard';
import AlertModal from '../../src/components/messagesModal';
import { getLabConfig, updateLabConfig } from '../../src/store/fetchActions/labConfig';

const emptyForm = {
    nome_estabelecimento: '',
    razao_social: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cep: '',
    telefone: '',
    cnpj: '',
    email_lab: '',
    rodape1: '',
    rodape2: '',
    email_habilitado: false,
};

export default function ConfiguracoesLaboratorio() {
    const dispatch = useDispatch();
    const { config, loading } = useSelector((state) => state.labConfig);

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(getLabConfig());
    }, []);

    useEffect(() => {
        if (config) {
            setForm({
                nome_estabelecimento: config.nome_estabelecimento ?? '',
                razao_social:         config.razao_social         ?? '',
                endereco_rua:         config.endereco_rua         ?? '',
                endereco_numero:      config.endereco_numero      ?? '',
                endereco_bairro:      config.endereco_bairro      ?? '',
                endereco_cep:         config.endereco_cep         ?? '',
                telefone:             config.telefone             ?? '',
                cnpj:                 config.cnpj                 ?? '',
                email_lab:            config.email_lab            ?? '',
                rodape1:              config.rodape1              ?? '',
                rodape2:              config.rodape2              ?? '',
                email_habilitado:     config.email_habilitado     ?? false,
            });
        }
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (form.endereco_cep && form.endereco_cep.replace(/\D/g, '').length !== 8)
            errs.endereco_cep = 'CEP deve ter 8 dígitos';
        if (form.cnpj && form.cnpj.replace(/\D/g, '').length !== 14)
            errs.cnpj = 'CNPJ deve ter 14 dígitos';
        if (form.email_lab && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_lab))
            errs.email_lab = 'E-mail inválido';
        return errs;
    };

    const handleSave = () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        dispatch(updateLabConfig({
            ...form,
            endereco_cep: form.endereco_cep.replace(/\D/g, ''),
            cnpj:         form.cnpj.replace(/\D/g, ''),
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
        <Box>
            <AlertModal />
            <BaseCard title="Configurações do Laboratório">

                {/* ── Dados do Estabelecimento ── */}
                <Typography variant="h6" gutterBottom mt={1}>
                    Dados do Estabelecimento
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth label="Nome do Estabelecimento"
                            name="nome_estabelecimento"
                            value={form.nome_estabelecimento}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth label="Razão Social"
                            name="razao_social"
                            value={form.razao_social}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth label="Rua"
                            name="endereco_rua"
                            value={form.endereco_rua}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth label="Número"
                            name="endereco_numero"
                            value={form.endereco_numero}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Bairro"
                            name="endereco_bairro"
                            value={form.endereco_bairro}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth label="CEP"
                            name="endereco_cep"
                            value={form.endereco_cep}
                            onChange={handleChange}
                            error={!!errors.endereco_cep}
                            helperText={errors.endereco_cep}
                            inputProps={{ maxLength: 9 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Telefone"
                            name="telefone"
                            value={form.telefone}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="CNPJ"
                            name="cnpj"
                            value={form.cnpj}
                            onChange={handleChange}
                            error={!!errors.cnpj}
                            helperText={errors.cnpj}
                            inputProps={{ maxLength: 18 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth label="E-mail do Laboratório"
                            name="email_lab"
                            value={form.email_lab}
                            onChange={handleChange}
                            error={!!errors.email_lab}
                            helperText={errors.email_lab}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Rodapé do Laudo ── */}
                <Typography variant="h6" gutterBottom>
                    Rodapé do Laudo
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={2}
                            label="Rodapé 1"
                            name="rodape1"
                            value={form.rodape1}
                            onChange={handleChange}
                            placeholder="Ex: Laboratório Participante do Programa Nacional de Controle de Qualidade - PNCQ/SBAC"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={3}
                            label="Rodapé 2"
                            name="rodape2"
                            value={form.rodape2}
                            onChange={handleChange}
                            placeholder="Ex: *Os exames sofrem influência fisiopatológica..."
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Notificações ── */}
                <Typography variant="h6" gutterBottom>
                    Notificações
                </Typography>
                <Card variant="outlined" sx={{ maxWidth: 480 }}>
                    <CardContent>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.email_habilitado}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, email_habilitado: e.target.checked }))
                                    }
                                    disabled={loading}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">
                                        {form.email_habilitado ? 'E-mail habilitado' : 'E-mail desabilitado'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Quando habilitado, envia e-mail ao paciente ao liberar resultado.
                                        Requer e-mail do paciente cadastrado.
                                    </Typography>
                                </Box>
                            }
                        />
                    </CardContent>
                </Card>

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
