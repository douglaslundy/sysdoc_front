import React from 'react';
import { Box, Button, Chip, Divider, Grid, Modal, Stack, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import BaseCard from '../../../baseCard/BaseCard';
import { modalFormRootSx, modalSecondaryButtonSx, modalShellSx } from '../../_shared/modalFormStyles';

const fieldLabel = {
  id: 'ID',
  name: 'Nome',
  mother: 'Nome da mãe',
  father: 'Nome do pai',
  cpf: 'CPF',
  cns: 'CNS',
  phone: 'Telefone',
  email: 'E-mail',
  obs: 'Observações',
  born_date: 'Data de nascimento',
  sexo: 'Sexo',
  raca_cor: 'Raça/Cor',
  data_obito: 'Data do óbito',
  active: 'Situação',
  st_falecido: 'Falecido',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',
};

const formatValue = (key, value) => {
  if (value == null || value === '') return 'Não informado';
  if (key === 'sexo') {
    if (value === 'FEMININE') return 'Feminino';
    if (value === 'MASCULINE') return 'Masculino';
  }
  if (key === 'active') return value ? 'Ativo' : 'Inativo';
  if (key === 'st_falecido') return value ? 'Sim' : 'Não';
  if (key === 'born_date' || key === 'data_obito') {
    try {
      return format(parseISO(String(value)), 'dd/MM/yyyy');
    } catch {
      return String(value);
    }
  }
  if (key === 'created_at' || key === 'updated_at') {
    try {
      return format(parseISO(String(value)), 'dd/MM/yyyy HH:mm:ss');
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const isDisplayField = (key, value) => (
  !['addresses', 'pivot', 'queue', 'trips', 'pedidosExame'].includes(key)
  && (typeof value !== 'object' || value === null)
);

const getFieldEntries = (client) => Object.entries(client || {})
  .filter(([key, value]) => isDisplayField(key, value));

export default function ClientViewModal({ open, client, loading, error, onClose }) {
  const address = client?.addresses || {};
  const fields = getFieldEntries(client);
  const showDeathInfo = client?.st_falecido === true && !!client?.data_obito;

  return (
    <Modal
      keepMounted
      open={open}
      onClose={onClose}
      aria-labelledby="client-view-title"
      aria-describedby="client-view-description"
    >
      <Box className="clients-modal-shell clients-view-modal-shell" sx={{ ...modalShellSx, ...modalFormRootSx }}>
        <BaseCard title={client?.id ? `Visualizar Cliente ${client.name || `#${client.id}`}` : 'Visualizar Cliente'}>
          {loading ? (
            <Typography sx={{ py: 2 }}>Carregando dados do cliente...</Typography>
          ) : error ? (
            <Typography sx={{ py: 2, color: 'error.main' }}>{error}</Typography>
          ) : client?.id ? (
            <Stack spacing={2.2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {client.name || 'Cliente sem nome'}
                </Typography>
                <Chip
                  label={client.active ? 'Ativo' : 'Inativo'}
                  color={client.active ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>

              <Divider />

              <Grid container spacing={2}>
                {fields
                  .filter(([key]) => showDeathInfo || (key !== 'st_falecido' && key !== 'data_obito'))
                  .map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ height: '100%' }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--lg-text-muted)' }}>
                        {fieldLabel[key] || key}
                      </Typography>
                      <Typography sx={{ fontSize: 14, wordBreak: 'break-word' }}>
                        {formatValue(key, value)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider />

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Endereço
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--lg-text-muted)' }}>CEP</Typography>
                    <Typography sx={{ fontSize: 14 }}>{address.zip_code || 'Não informado'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={5}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--lg-text-muted)' }}>Rua</Typography>
                    <Typography sx={{ fontSize: 14, wordBreak: 'break-word' }}>{address.street || 'Não informado'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--lg-text-muted)' }}>Número</Typography>
                    <Typography sx={{ fontSize: 14 }}>{address.number || 'Não informado'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--lg-text-muted)' }}>Bairro</Typography>
                    <Typography sx={{ fontSize: 14, wordBreak: 'break-word' }}>{address.district || 'Não informado'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--lg-text-muted)' }}>Cidade</Typography>
                    <Typography sx={{ fontSize: 14, wordBreak: 'break-word' }}>{address.city || 'Não informado'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--lg-text-muted)' }}>Complemento</Typography>
                    <Typography sx={{ fontSize: 14, wordBreak: 'break-word' }}>{address.complement || 'Não informado'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={modalSecondaryButtonSx}>
                  Voltar
                </Button>
              </Box>
            </Stack>
          ) : (
            <Typography sx={{ py: 2 }}>Nenhum cliente selecionado.</Typography>
          )}
        </BaseCard>
      </Box>
    </Modal>
  );
}
