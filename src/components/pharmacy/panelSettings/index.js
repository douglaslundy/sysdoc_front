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

const ALL_FILTERS_ENABLED = {
  filter_is_free_distribution: true,
  filter_is_controlled: true,
  filter_is_judicial_order: true,
  filter_is_high_cost: true,
  filter_active: true,
};

const normalizeForm = (data) => {
  const next = { ...EMPTY, ...data };

  if (next.filter_show_all) {
    return { ...next, ...ALL_FILTERS_ENABLED };
  }

  return next;
};

export default function MedicinesPanelSettings() {
  const dispatch = useDispatch();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    dispatch(turnLoading());
    api.get('/pharmacy/medicines/panel-settings')
      .then((res) => {
        setForm(normalizeForm(res.data));
        dispatch(turnLoading());
      })
      .catch(() => {
        dispatch(addAlertMessage('Não foi possível carregar as configurações do painel de medicamentos.'));
        dispatch(turnLoading());
      });
  }, [dispatch]);

  const change = ({ target }) => {
    if (target.name === 'filter_show_all') {
      setForm((prev) => ({
        ...prev,
        ...(target.checked ? ALL_FILTERS_ENABLED : {}),
        filter_show_all: target.checked,
      }));
      return;
    }

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
    <Box sx={modalFormRootSx} className="queue-page pharmacy-panelsettings-page">
      <BaseCard title="Configuração do Painel de Medicamentos">
        <AlertModal />
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Selecione quais tipos de medicamentos devem aparecer no painel público de disponibilidade.
        </Typography>

        <Stack spacing={1.2} sx={{ mb: 2 }}>
          <FormControlLabel control={<Checkbox name="filter_show_all" checked={!!form.filter_show_all} onChange={change} />} label="Todos" />
          <FormControlLabel control={<Checkbox name="filter_is_free_distribution" checked={!!form.filter_is_free_distribution} disabled={!!form.filter_show_all} onChange={change} />} label="Distribuição Gratuita" />
          <FormControlLabel control={<Checkbox name="filter_is_controlled" checked={!!form.filter_is_controlled} disabled={!!form.filter_show_all} onChange={change} />} label="Medicamento Controlado" />
          <FormControlLabel control={<Checkbox name="filter_is_judicial_order" checked={!!form.filter_is_judicial_order} disabled={!!form.filter_show_all} onChange={change} />} label="Ordem Judicial" />
          <FormControlLabel control={<Checkbox name="filter_is_high_cost" checked={!!form.filter_is_high_cost} disabled={!!form.filter_show_all} onChange={change} />} label="Alto Custo" />
          <FormControlLabel control={<Checkbox name="filter_active" checked={!!form.filter_active} disabled={!!form.filter_show_all} onChange={change} />} label="Ativo" />
        </Stack>

        <Button className="queue-page__action queue-page__action--success" variant="contained" onClick={save}>Salvar Configurações</Button>
      </BaseCard>
    </Box>
  );
}
