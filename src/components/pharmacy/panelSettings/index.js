import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import AlertModal from '../../messagesModal';
import { api } from '../../../services/api';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../../store/ducks/Layout';
import { Button } from '../../ui/button';
import { CaixaDeMarcacao } from '../../ui/caixa-de-marcacao';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../secretaria/CampoSecretariaObrigatorio';

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

const OPCOES = [
  ['filter_is_free_distribution', 'Distribuição Gratuita'],
  ['filter_is_controlled', 'Medicamento Controlado'],
  ['filter_is_judicial_order', 'Ordem Judicial'],
  ['filter_is_high_cost', 'Alto Custo'],
  ['filter_active', 'Ativo'],
];

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
  const secretaria = useSecretariaObrigatoria();

  useEffect(() => {
    if (!secretaria.pronta) return;
    dispatch(turnLoading());
    api.get('/pharmacy/medicines/panel-settings', { params: secretaria.payload() })
      .then((res) => {
        setForm(normalizeForm(res.data));
        dispatch(turnLoading());
      })
      .catch(() => {
        dispatch(addAlertMessage('Não foi possível carregar as configurações do painel de medicamentos.'));
        dispatch(turnLoading());
      });
  }, [dispatch, secretaria.exigir, secretaria.valor]);

  const change = (name, checked) => {
    if (name === 'filter_show_all') {
      setForm((prev) => ({
        ...prev,
        ...(checked ? ALL_FILTERS_ENABLED : {}),
        filter_show_all: checked,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const save = () => {
    dispatch(turnLoading());
    api.put('/pharmacy/medicines/panel-settings', { ...form, ...secretaria.payload() }, { params: secretaria.payload() })
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
    <Card className="pharmacy-panelsettings-page">
      <CardHeader>
        <CardTitle>Configuração do Painel de Medicamentos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <AlertModal />
        <p className="text-sm text-muted-foreground">
          Selecione quais tipos de medicamentos devem aparecer no painel público de disponibilidade.
        </p>

        <div className="max-w-sm"><CampoSecretariaObrigatorio controle={secretaria} id="painel-secretaria" /></div>

        <div className="grid gap-3">
          <CaixaDeMarcacao id="painel-filter_show_all" name="filter_show_all" marcado={!!form.filter_show_all} aoMudar={(v) => change('filter_show_all', v)}>Todos</CaixaDeMarcacao>
          {OPCOES.map(([name, rotulo]) => (
            <CaixaDeMarcacao key={name} id={`painel-${name}`} name={name} marcado={!!form[name]} disabled={!!form.filter_show_all} aoMudar={(v) => change(name, v)}>
              {rotulo}
            </CaixaDeMarcacao>
          ))}
        </div>

        <div>
          <Button onClick={save} disabled={!secretaria.pronta}>Salvar Configurações</Button>
        </div>
      </CardContent>
    </Card>
  );
}
