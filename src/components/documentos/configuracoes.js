import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';
import { api } from '../../services/api';

const SIGILO_OPTIONS = [
  { value: 'publico', label: 'Público' },
  { value: 'interno', label: 'Interno' },
  { value: 'restrito', label: 'Restrito/Sigiloso' },
];

const initialForm = {
  triple_signature_enabled: false,
  triple_signature_sigilos: ['interno', 'restrito'],
  signer_user_1_id: '',
  signer_user_2_id: '',
  signer_user_3_id: '',
};

export default function DocumentosConfiguracoes() {
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });

  useEffect(() => {
    (async () => {
      try {
        const [configRes, usersRes] = await Promise.all([
          api.get('/documentos/configuracoes'),
          api.get('/users', { params: { per_page: 200 } }),
        ]);

        setForm({
          triple_signature_enabled: Boolean(configRes.data?.triple_signature_enabled),
          triple_signature_sigilos: Array.isArray(configRes.data?.triple_signature_sigilos)
            ? configRes.data.triple_signature_sigilos
            : ['interno', 'restrito'],
          signer_user_1_id: configRes.data?.signer_user_1_id || '',
          signer_user_2_id: configRes.data?.signer_user_2_id || '',
          signer_user_3_id: configRes.data?.signer_user_3_id || '',
        });
        setUsers(Array.isArray(usersRes.data?.data) ? usersRes.data.data : (usersRes.data || []));
      } catch (error) {
        setAlertState({
          visible: true,
          type: 'error',
          message: error?.response?.data?.message || 'Não foi possível carregar as configurações de documentos.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        triple_signature_enabled: form.triple_signature_enabled,
        triple_signature_sigilos: form.triple_signature_sigilos,
        signer_user_1_id: form.signer_user_1_id || null,
        signer_user_2_id: form.signer_user_2_id || null,
        signer_user_3_id: form.signer_user_3_id || null,
      };

      const { data } = await api.put('/documentos/configuracoes', payload);
      setForm({
        triple_signature_enabled: Boolean(data?.triple_signature_enabled),
        triple_signature_sigilos: Array.isArray(data?.triple_signature_sigilos) ? data.triple_signature_sigilos : [],
        signer_user_1_id: data?.signer_user_1_id || '',
        signer_user_2_id: data?.signer_user_2_id || '',
        signer_user_3_id: data?.signer_user_3_id || '',
      });
      setAlertState({ visible: true, type: 'success', message: 'Configurações salvas com sucesso.' });
    } catch (error) {
      const message = error?.response?.data?.message
        || Object.values(error?.response?.data?.errors || {}).flat()?.[0]
        || 'Não foi possível salvar as configurações de documentos.';
      setAlertState({ visible: true, type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page documentos-page">
      <BaseCard title="Configurações de Documentos">
        {alertState.visible && (
          <Alert
            sx={{ mb: 2 }}
            variant="filled"
            severity={alertState.type}
            onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}
          >
            {alertState.message}
          </Alert>
        )}

        {loading ? (
          <Typography color="text.secondary">Carregando configurações...</Typography>
        ) : (
          <Stack spacing={2.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.triple_signature_enabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, triple_signature_enabled: event.target.checked }))}
                />
              }
              label="Ativar tripla assinatura para exclusão"
            />

            <Typography variant="body2" color="text.secondary">
              Defina os 3 usuários responsáveis e em quais níveis de sigilo a regra será aplicada.
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Aplicar em</InputLabel>
              <Select
                multiple
                value={form.triple_signature_sigilos}
                label="Aplicar em"
                onChange={(event) => setForm((prev) => ({ ...prev, triple_signature_sigilos: event.target.value }))}
                renderValue={(selected) => selected.map((value) => SIGILO_OPTIONS.find((option) => option.value === value)?.label || value).join(', ')}
              >
                {SIGILO_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              {[1, 2, 3].map((index) => {
                const key = `signer_user_${index}_id`;
                return (
                  <Grid item xs={12} md={4} key={key}>
                    <FormControl fullWidth>
                      <InputLabel>{`Usuário ${index}`}</InputLabel>
                      <Select
                        value={form[key]}
                        label={`Usuário ${index}`}
                        onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                      >
                        <MenuItem value=""><em>Selecione</em></MenuItem>
                        {users.map((user) => (
                          <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                );
              })}
            </Grid>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" href="/documentos">Voltar</Button>
              <Button variant="contained" onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </Stack>
          </Stack>
        )}
      </BaseCard>
    </Box>
  );
}
