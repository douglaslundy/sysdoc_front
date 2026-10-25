import React, { useContext, useEffect, useState } from 'react';
import { Eye, Image as ImagemIcone, Save } from 'lucide-react';
import ConfirmDialog from '../confirmDialog';
import { AuthContext } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import NoticeRichTextEditor from './NoticeRichTextEditor';
import NoticeModal from './NoticeModal';
import { Banner } from '../ui/banner';
import { Button, buttonVariants } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { DataTable } from '../ui/data-table';
import { Pilula } from '../ui/pilula';

const EMPTY = {
  title: '',
  subtitle: '',
  body: '',
  image_data: '',
  times_per_day: 1,
  interval_minutes: 60,
  target_user_id: 'all',
  valid_until: '',
  is_active: true,
};

export default function AdminSystemNotices() {
  const { permissionsLoaded } = useContext(AuthContext);
  const [form, setForm] = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    subTitle: '',
    confirm: null,
    onConfirm: null,
  });
  const [previewNotice, setPreviewNotice] = useState(null);

  const load = async () => {
    setError('');
    const [usersRes, noticesRes] = await Promise.allSettled([
      api.get('/users'),
      api.get('/system-notices'),
    ]);

    setUsers(usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : []);
    setNotices(noticesRes.status === 'fulfilled' ? (noticesRes.value.data || []) : []);

    const failures = [];
    if (usersRes.status === 'rejected') failures.push('usuários');
    if (noticesRes.status === 'rejected') failures.push('avisos');
    setError(failures.length === 2 ? 'Não foi possível carregar usuários ou avisos.' : '');
  };

  useEffect(() => {
    if (!permissionsLoaded) return;
    load().catch(() => setError('Não foi possível carregar usuários ou avisos.'));
  }, [permissionsLoaded]);

  const change = ({ target: { name, type, checked, value } }) => {
    const novo = type === 'checkbox' ? checked : value;
    setForm((current) => ({ ...current, [name]: novo }));
  };

  const handleImage = async ({ target }) => {
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image_data: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const normalizedBody = String(form.body || '').replace(/<(.|\n)*?>/g, ' ').replace(/&nbsp;/g, ' ').trim();
      if (!normalizedBody) {
        setError('Informe o conteúdo do aviso.');
        return;
      }

      const targetUserId = form.target_user_id === 'all' ? null : Number(form.target_user_id);
      await api.post('/system-notices', {
        ...form,
        times_per_day: Number(form.times_per_day),
        interval_minutes: Number(form.interval_minutes),
        target_user_id: Number.isFinite(targetUserId) ? targetUserId : null,
        valid_until: form.valid_until || null,
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível salvar o aviso.');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/system-notices/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível remover o aviso.');
    }
  };

  const confirmRemove = (notice) => {
    setConfirmDialog({
      isOpen: true,
      title: `Deseja remover o aviso "${notice?.title || ''}"?`,
      subTitle: 'Esta ação não poderá ser desfeita.',
      confirm: null,
      onConfirm: () => remove(notice.id),
    });
  };

  const colunas = [
    {
      chave: 'titulo',
      titulo: 'Título',
      render: (notice) => (
        <>
          <span className="block font-bold">{notice.title}</span>
          <span className="block text-sm text-muted-foreground">{notice.subtitle || '-'}</span>
        </>
      ),
    },
    {
      chave: 'destinatario',
      titulo: 'Destinatário',
      render: (notice) => (notice.target_user_id ? notice.target_user?.name || `Usuário #${notice.target_user_id}` : 'Todos'),
    },
    { chave: 'periodo', titulo: 'Período', render: (notice) => notice.valid_until || '-' },
    {
      chave: 'status',
      titulo: 'Status',
      render: (notice) => <Pilula tom={notice.is_active ? 'sucesso' : 'neutro'}>{notice.is_active ? 'Ativo' : 'Inativo'}</Pilula>,
    },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (notice) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPreviewNotice(notice)}>
            <Eye /> Preview
          </Button>
          <Button variant="destructive" size="sm" onClick={() => confirmRemove(notice)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-reset avisos-page">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Avisos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {error ? <Banner tom="perigo">{error}</Banner> : null}

          <form onSubmit={submit} className="grid gap-4">
            <CampoTexto id="aviso-titulo" name="title" label="Título" value={form.title} onChange={change} required obrigatorio />
            <CampoTexto id="aviso-subtitulo" name="subtitle" label="Subtítulo" value={form.subtitle} onChange={change} />
            <div>
              <p className="mb-2 text-sm font-semibold">Texto do aviso</p>
              <NoticeRichTextEditor
                value={form.body}
                onChange={(content) => setForm((current) => ({ ...current, body: content }))}
              />
            </div>
            <label className={`${buttonVariants({ variant: 'outline' })} cursor-pointer self-start has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25`}>
              <ImagemIcone /> Inserir imagem
              <input type="file" accept="image/*" className="sr-only" onChange={handleImage} />
            </label>
            {form.image_data ? <img src={form.image_data} alt="Pré-visualização" className="max-w-[360px] rounded-xl border border-border" /> : null}
            <div className="grid gap-4 md:grid-cols-3">
              <CampoTexto id="aviso-vezes" name="times_per_day" label="Vezes por dia" type="number" min={1} max={24} value={form.times_per_day} onChange={change} />
              <CampoTexto id="aviso-intervalo" name="interval_minutes" label="Intervalo em minutos" type="number" min={1} max={1440} value={form.interval_minutes} onChange={change} />
              <CampoTexto id="aviso-validade" name="valid_until" label="Válido até" type="date" value={form.valid_until} onChange={change} />
            </div>
            <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
              <CampoSelecao id="aviso-destinatario" name="target_user_id" label="Destinatário" value={form.target_user_id} onChange={change}>
                <option value="all">Todos</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </CampoSelecao>
              <Button type="submit">
                <Save /> Salvar
              </Button>
            </div>
          </form>

          <DataTable
            rotulo="avisos"
            colunas={colunas}
            linhas={notices}
            chaveDaLinha={(notice) => notice.id}
            vazio="Nenhum aviso cadastrado."
          />
        </CardContent>
      </Card>
      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
      <NoticeModal previewNotice={previewNotice} onPreviewClose={() => setPreviewNotice(null)} />
    </div>
  );
}
