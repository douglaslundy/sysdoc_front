import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Banner } from '../ui/banner';
import { Button, buttonVariants } from '../ui/button';
import { CaixaDeMarcacao } from '../ui/caixa-de-marcacao';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CampoSelecao } from '../ui/campos';
import { Carregando } from '../ui/carregando';
import { Interruptor } from '../ui/interruptor';

const SIGILO_OPTIONS = [
  { value: 'publico', label: 'Público' },
  { value: 'interno', label: 'Interno' },
  { value: 'restrito', label: 'Restrito/Sigiloso' },
];

const TOM_DO_ALERTA = { success: 'sucesso', error: 'perigo', warning: 'alerta' };

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

  const alternarSigilo = (valor, marcado) => {
    setForm((prev) => ({
      ...prev,
      triple_signature_sigilos: marcado
        ? [...prev.triple_signature_sigilos, valor]
        : prev.triple_signature_sigilos.filter((v) => v !== valor),
    }));
  };

  return (
    <Card className="ui-reset documentos-page">
      <CardHeader>
        <CardTitle>Configurações de Documentos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        {alertState.visible && (
          <Banner tom={TOM_DO_ALERTA[alertState.type] || 'info'} onDispensar={() => setAlertState({ visible: false, type: 'success', message: '' })}>
            {alertState.message}
          </Banner>
        )}

        {loading ? (
          <Carregando>Carregando configurações...</Carregando>
        ) : (
          <>
            <Interruptor
              id="docs-tripla"
              marcado={form.triple_signature_enabled}
              aoMudar={(v) => setForm((prev) => ({ ...prev, triple_signature_enabled: v }))}
            >
              Ativar tripla assinatura para exclusão
            </Interruptor>

            <p className="text-sm text-muted-foreground">
              Defina os 3 usuários responsáveis e em quais níveis de sigilo a regra será aplicada.
            </p>

            <fieldset className="grid max-w-md gap-2">
              <legend className="mb-1 text-[13px] text-muted-foreground">Aplicar em</legend>
              {SIGILO_OPTIONS.map((option) => (
                <CaixaDeMarcacao
                  key={option.value}
                  id={`docs-sigilo-${option.value}`}
                  marcado={form.triple_signature_sigilos.includes(option.value)}
                  aoMudar={(v) => alternarSigilo(option.value, v)}
                >
                  {option.label}
                </CaixaDeMarcacao>
              ))}
            </fieldset>

            <div className="grid max-w-md gap-4">
              {[1, 2, 3].map((index) => {
                const key = `signer_user_${index}_id`;
                return (
                  <CampoSelecao
                    key={key}
                    id={`docs-${key}`}
                    label={`Usuário ${index}`}
                    value={form[key]}
                    onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </CampoSelecao>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <a className={buttonVariants({ variant: 'outline' })} href="/documentos">Voltar</a>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
