import React, { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Chip, Divider, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import { api } from '../../services/api';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const EMPTY = {
  permitir_saida_sem_saldo: false,
  permitir_transferencia_entre_secretarias: true,
  exigir_justificativa_saida: true,
  exigir_localizacao_produto: false,
  notificar_estoque_minimo: true,
  estoque_minimo_alerta_percentual: 20,
  permite_produto_sem_validade: true,
  observacoes: '',
};

const QUICK_LINKS = [
  { href: '/almoxarifado/produtos', label: 'Produtos' },
  { href: '/almoxarifado/categorias', label: 'Categorias' },
  { href: '/almoxarifado/especies', label: 'Espécies' },
  { href: '/almoxarifado/unidades-medida', label: 'Unidades' },
  { href: '/almoxarifado/fornecedores', label: 'Fornecedores' },
  { href: '/almoxarifado/localizacoes', label: 'Localizações' },
  { href: '/almoxarifado/secretarias', label: 'Secretarias' },
];

export default function ConfiguracoesPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get('/almoxarifado/configuracoes')
      .then((res) => {
        if (!mounted) return;
        setForm({ ...EMPTY, ...(res.data || {}) });
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSwitch = (name) => (event) => {
    const { checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'estoque_minimo_alerta_percentual' ? value : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        estoque_minimo_alerta_percentual: form.estoque_minimo_alerta_percentual === '' ? null : Number(form.estoque_minimo_alerta_percentual),
      };
      const res = await api.put('/almoxarifado/configuracoes', payload);
      setForm({ ...EMPTY, ...(res.data || {}) });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => ([
    { label: 'Saída sem saldo', value: form.permitir_saida_sem_saldo ? 'Liberada' : 'Bloqueada', color: form.permitir_saida_sem_saldo ? 'warning' : 'success' },
    { label: 'Transferência', value: form.permitir_transferencia_entre_secretarias ? 'Ativa' : 'Desativada', color: form.permitir_transferencia_entre_secretarias ? 'success' : 'error' },
    { label: 'Justificativa', value: form.exigir_justificativa_saida ? 'Obrigatória' : 'Opcional', color: form.exigir_justificativa_saida ? 'warning' : 'default' },
    { label: 'Alerta estoque', value: `${form.estoque_minimo_alerta_percentual || 0}%`, color: 'info' },
  ]), [form]);

  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-configuracoes-page">
      <BaseCard title="Configurações do Almoxarifado">
        <AlertModal />
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Aqui ficam as regras operacionais do almoxarifado e os atalhos para manter os cadastros-base organizados.
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
          {summary.map((item) => (
            <Chip key={item.label} color={item.color} variant="outlined" label={`${item.label}: ${item.value}`} />
          ))}
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <BaseCard title="Regras operacionais">
              <Stack spacing={1.25}>
                <FormControlLabel control={<Switch checked={!!form.permitir_saida_sem_saldo} onChange={handleSwitch('permitir_saida_sem_saldo')} />} label="Permitir saída sem saldo" />
                <FormControlLabel control={<Switch checked={!!form.permitir_transferencia_entre_secretarias} onChange={handleSwitch('permitir_transferencia_entre_secretarias')} />} label="Permitir transferência entre secretarias" />
                <FormControlLabel control={<Switch checked={!!form.exigir_justificativa_saida} onChange={handleSwitch('exigir_justificativa_saida')} />} label="Exigir justificativa na saída" />
                <FormControlLabel control={<Switch checked={!!form.exigir_localizacao_produto} onChange={handleSwitch('exigir_localizacao_produto')} />} label="Exigir localização no cadastro do produto" />
                <FormControlLabel control={<Switch checked={!!form.notificar_estoque_minimo} onChange={handleSwitch('notificar_estoque_minimo')} />} label="Notificar estoque mínimo" />
                <FormControlLabel control={<Switch checked={!!form.permite_produto_sem_validade} onChange={handleSwitch('permite_produto_sem_validade')} />} label="Permitir produto sem validade" />

                <TextField
                  fullWidth
                  label="Percentual de alerta de estoque mínimo"
                  type="number"
                  name="estoque_minimo_alerta_percentual"
                  value={form.estoque_minimo_alerta_percentual}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 100 }}
                />

                <TextField
                  fullWidth
                  label="Observações"
                  name="observacoes"
                  value={form.observacoes}
                  onChange={handleChange}
                  multiline
                  minRows={4}
                />
              </Stack>

              <Box sx={{ display: 'flex', gap: 1, mt: 2.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <NextLink href="/almoxarifado" passHref>
                  <Button variant="outlined" component="a">
                    Voltar
                  </Button>
                </NextLink>
                <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </Box>
            </BaseCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <BaseCard title="Cadastros-base">
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Os cadastros abaixo alimentam produtos, estoque e requisições. Use-os para manter o módulo padronizado.
              </Typography>
              <Stack spacing={1}>
                {QUICK_LINKS.map((item) => (
                  <NextLink key={item.href} href={item.href} passHref>
                    <Button
                      component="a"
                      variant="outlined"
                      sx={{ justifyContent: 'space-between' }}
                    >
                      {item.label}
                    </Button>
                  </NextLink>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Quando o módulo crescer, esta tela pode concentrar alertas, padrões de validação, regras de movimentação e parâmetros por secretaria.
              </Typography>
            </BaseCard>
          </Grid>
        </Grid>
      </BaseCard>
    </Box>
  );
}
