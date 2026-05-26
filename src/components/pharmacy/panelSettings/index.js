import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import { api } from '../../../services/api';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../../store/ducks/Layout';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const EMPTY = {
  filter_is_free_distribution: false,
  filter_is_controlled: false,
  filter_is_judicial_order: false,
  filter_is_high_cost: false,
  filter_active: true,
  filter_show_all: false,
};

export default function MedicinesPanelSettings() {
  const dispatch = useDispatch();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    dispatch(turnLoading());
    api.get('/pharmacy/medicines/panel-settings')
      .then((res) => {
        setForm({ ...EMPTY, ...res.data });
        dispatch(turnLoading());
      })
      .catch(() => {
        dispatch(addAlertMessage('Não foi possível carregar as configurações do painel de medicamentos.'));
        dispatch(turnLoading());
      });
  }, [dispatch]);

  const change = ({ target }) => {
    setForm((prev) => ({ ...prev, [target.name]: target.checked }));
  };

  const save = () => {
    dispatch(turnLoading());
    api.put('/pharmacy/medicines/panel-settings', form)
      .then(() => {
        dispatch(addMessage('Configurações do painel salvas com sucesso!'));
        dispatch(turnAlert());
        dispatch(turnLoading());
      })
      .catch(() => {
        dispatch(addAlertMessage('Não foi possível salvar as configurações do painel.'));
        dispatch(turnLoading());
      });
  };

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title="Configuração do Painel de Medicamentos">
        <AlertModal />
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Selecione quais tipos de medicamentos devem aparecer no painel público de disponibilidade.
        </Typography>

        <Stack spacing={1.2} sx={{ mb: 2 }}>
          <FormControlLabel control={<Checkbox name="filter_show_all" checked={!!form.filter_show_all} onChange={change} />} label="Todos" />
          <FormControlLabel control={<Checkbox name="filter_is_free_distribution" checked={!!form.filter_is_free_distribution} onChange={change} />} label="Distribuição Gratuita" />
          <FormControlLabel control={<Checkbox name="filter_is_controlled" checked={!!form.filter_is_controlled} onChange={change} />} label="Medicamento Controlado" />
          <FormControlLabel control={<Checkbox name="filter_is_judicial_order" checked={!!form.filter_is_judicial_order} onChange={change} />} label="Ordem Judicial" />
          <FormControlLabel control={<Checkbox name="filter_is_high_cost" checked={!!form.filter_is_high_cost} onChange={change} />} label="Alto Custo" />
          <FormControlLabel control={<Checkbox name="filter_active" checked={!!form.filter_active} onChange={change} />} label="Ativo" />
        </Stack>

        <Button variant="contained" onClick={save}>Salvar Configurações</Button>
      </BaseCard>
    </Box>
  );
}
