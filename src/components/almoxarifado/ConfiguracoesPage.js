import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import AlertModal from '../messagesModal';
import { BotaoLink } from '../ui/botao-link';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoTexto } from '../ui/campos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Interruptor } from '../ui/interruptor';
import { Pilula } from '../ui/pilula';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../secretaria/CampoSecretariaObrigatorio';

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

const REGRAS = [
  ['permitir_saida_sem_saldo', 'Permitir saída sem saldo'],
  ['permitir_transferencia_entre_secretarias', 'Permitir transferência entre secretarias'],
  ['exigir_justificativa_saida', 'Exigir justificativa na saída'],
  ['exigir_localizacao_produto', 'Exigir localização no cadastro do produto'],
  ['notificar_estoque_minimo', 'Notificar estoque mínimo'],
  ['permite_produto_sem_validade', 'Permitir produto sem validade'],
];

export default function ConfiguracoesPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const secretaria = useSecretariaObrigatoria();

  useEffect(() => {
    let mounted = true;
    if (!secretaria.pronta) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    api.get('/almoxarifado/configuracoes', { params: secretaria.payload() })
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
  }, [secretaria.exigir, secretaria.valor]);

  const handleSwitch = (name) => (checked) => setForm((prev) => ({ ...prev, [name]: checked }));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        ...secretaria.payload(),
        estoque_minimo_alerta_percentual: form.estoque_minimo_alerta_percentual === '' ? null : Number(form.estoque_minimo_alerta_percentual),
      };
      const res = await api.put('/almoxarifado/configuracoes', payload, { params: secretaria.payload() });
      setForm({ ...EMPTY, ...(res.data || {}) });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => ([
    { label: 'Saída sem saldo', value: form.permitir_saida_sem_saldo ? 'Liberada' : 'Bloqueada', tom: form.permitir_saida_sem_saldo ? 'alerta' : 'sucesso' },
    { label: 'Transferência', value: form.permitir_transferencia_entre_secretarias ? 'Ativa' : 'Desativada', tom: form.permitir_transferencia_entre_secretarias ? 'sucesso' : 'perigo' },
    { label: 'Justificativa', value: form.exigir_justificativa_saida ? 'Obrigatória' : 'Opcional', tom: form.exigir_justificativa_saida ? 'alerta' : 'neutro' },
    { label: 'Alerta estoque', value: `${form.estoque_minimo_alerta_percentual || 0}%`, tom: 'info' },
  ]), [form]);

  return (
    <div>
      <CabecalhoDePagina titulo="Configurações do Almoxarifado" subtitulo="Regras operacionais e atalhos para os cadastros-base." />
      <AlertModal />

      <div className="mb-4 flex flex-wrap gap-2">
        {summary.map((item) => (
          <Pilula key={item.label} tom={item.tom} contorno>{`${item.label}: ${item.value}`}</Pilula>
        ))}
      </div>

      <div className="mb-4 max-w-sm">
        <CampoSecretariaObrigatorio controle={secretaria} id="cfg-secretaria" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[7fr_5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Regras operacionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {REGRAS.map(([name, label]) => (
              <Interruptor key={name} id={`cfg-${name}`} marcado={!!form[name]} aoMudar={handleSwitch(name)}>{label}</Interruptor>
            ))}
            <CampoTexto
              id="cfg-percentual"
              label="Percentual de alerta de estoque mínimo"
              type="number"
              name="estoque_minimo_alerta_percentual"
              min={1}
              max={100}
              value={form.estoque_minimo_alerta_percentual}
              onChange={handleChange}
            />
            <CampoTexto id="cfg-observacoes" label="Observações" name="observacoes" multiline rows={4} value={form.observacoes} onChange={handleChange} />
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <BotaoLink href="/almoxarifado" variant="outline">Voltar</BotaoLink>
              <Button onClick={handleSave} disabled={saving || loading || !secretaria.pronta}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cadastros-base</CardTitle>
            <CardDescription>Alimentam produtos, estoque e requisições. Use-os para manter o módulo padronizado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_LINKS.map((item) => (
              <BotaoLink key={item.href} href={item.href} variant="outline" className="w-full justify-between">
                {item.label}
                <ChevronRight />
              </BotaoLink>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
