import React, { useEffect, useState } from 'react';
import ConfirmDialog from '../confirmDialog';
import { api } from '../../services/api';
import { AcoesDeLinha } from '../ui/acoes-de-linha';
import { Banner } from '../ui/banner';
import { Button, buttonVariants } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DataTable } from '../ui/data-table';
import { FormularioModal } from '../ui/formulario-modal';

const initialForm = { id: null, codigo: '', nome: '', descricao: '', ordem: 0, ativo: true };

const CAMPOS = [
  { name: 'codigo', label: 'Código' },
  { name: 'nome', label: 'Nome' },
  { name: 'descricao', label: 'Descrição', rows: 3 },
  { name: 'ordem', label: 'Ordem', type: 'number' },
  { name: 'ativo', label: 'Ativo', interruptor: true },
];

const TOM_DO_ALERTA = { success: 'sucesso', error: 'perigo', warning: 'alerta' };

export default function DocumentosTipos() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [open, setOpen] = useState(false);
  const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', onConfirm: null });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documentos/tipos');
      setTypes(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      if (form.id) {
        await api.put(`/documentos/tipos/${form.id}`, form);
      } else {
        await api.post('/documentos/tipos', form);
      }
      setAlertState({ visible: true, type: 'success', message: 'Tipo salvo com sucesso.' });
      setOpen(false);
      setForm(initialForm);
      await load();
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível salvar o tipo.' });
    }
  };

  const edit = (type) => {
    setForm({
      id: type.id,
      codigo: type.codigo || '',
      nome: type.nome || '',
      descricao: type.descricao || '',
      ordem: type.ordem ?? 0,
      ativo: type.ativo !== false,
    });
    setOpen(true);
  };

  const askDelete = (type) => {
    setConfirmDialog({
      isOpen: true,
      title: `Excluir tipo "${type.nome}"`,
      subTitle: 'Esta ação não poderá ser desfeita.',
      onConfirm: async () => {
        await api.delete(`/documentos/tipos/${type.id}`);
        setAlertState({ visible: true, type: 'success', message: 'Tipo removido com sucesso.' });
        await load();
      },
    });
  };

  const aoMudar = ({ target: { name, value } }) => {
    setForm((prev) => ({ ...prev, [name]: name === 'ordem' ? Number(value) : value }));
  };

  const colunas = [
    { chave: 'codigo', titulo: 'Código', render: (type) => type.codigo },
    { chave: 'nome', titulo: 'Nome', render: (type) => type.nome },
    { chave: 'ordem', titulo: 'Ordem', render: (type) => type.ordem },
    { chave: 'ativo', titulo: 'Ativo', render: (type) => (type.ativo ? 'Sim' : 'Não') },
    { chave: 'acoes', titulo: 'Ações', render: (type) => <AcoesDeLinha aoEditar={() => edit(type)} aoExcluir={() => askDelete(type)} /> },
  ];

  return (
    <Card className="ui-reset">
      <CardHeader>
        <CardTitle>Tipos de Documentos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {alertState.visible && (
          <Banner tom={TOM_DO_ALERTA[alertState.type] || 'info'} onDispensar={() => setAlertState({ visible: false, type: 'success', message: '' })}>
            {alertState.message}
          </Banner>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setForm(initialForm); setOpen(true); }}>Novo tipo</Button>
          <a className={buttonVariants({ variant: 'outline' })} href="/documentos">Voltar para documentos</a>
        </div>

        <DataTable rotulo="tipos de documentos" colunas={colunas} linhas={types} chaveDaLinha={(type) => type.id} carregando={loading} vazio="Nenhum tipo cadastrado." />
      </CardContent>

      <FormularioModal
        aberto={open}
        titulo={form.id ? 'Editar tipo' : 'Novo tipo'}
        aoFechar={() => setOpen(false)}
        aoGravar={save}
        campos={CAMPOS}
        valores={form}
        aoMudar={aoMudar}
        tamanho="md"
      />

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </Card>
  );
}
