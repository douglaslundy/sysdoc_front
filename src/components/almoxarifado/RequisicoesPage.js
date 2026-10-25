import React, { useContext, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import AlertModal from '../messagesModal';
import { AuthContext } from '../../contexts/AuthContext';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { DataTable } from '../ui/data-table';
import { Dado } from '../ui/dado';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../ui/dialogo';
import { Paginacao } from '../ui/paginacao';
import { Pilula } from '../ui/pilula';

const STATUS_META = {
  recebida: { tom: 'neutro', label: 'Recebida' },
  em_analise: { tom: 'info', label: 'Em análise' },
  aprovada: { tom: 'sucesso', label: 'Aprovada' },
  recusada: { tom: 'perigo', label: 'Recusada' },
  em_separacao: { tom: 'alerta', label: 'Em separação' },
  em_processo_de_entrega: { tom: 'info', label: 'Em entrega' },
  entregue: { tom: 'sucesso', label: 'Entregue' },
  cancelada: { tom: 'perigo', label: 'Cancelada' },
};

const EMPTY_ITEM = { almoxarifado_produto_id: '', quantidade_solicitada: '', observacao: '' };
const EMPTY = { almoxarifado_secretaria_id: '', justificativa: '', observacoes: '', itens: [EMPTY_ITEM] };
const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
};

export default function RequisicoesPage() {
  const { user: currentUserId, username, capabilities } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [secretarias, setSecretarias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/almoxarifado/requisicoes', { params: { page: page + 1, per_page: perPage, search: search || undefined } });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total ?? res.data?.meta?.total ?? 0));
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    const [sRes, pRes] = await Promise.all([
      api.get('/almoxarifado/catalogos/secretarias'),
      api.get('/almoxarifado/produtos', { params: { per_page: 100, page: 1, ativo: true } }),
    ]);
    setSecretarias(Array.isArray(sRes.data) ? sRes.data : []);
    setProdutos(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
  };

  useEffect(() => { loadOptions().catch(() => {}); }, []);
  useEffect(() => { load().catch(() => {}); }, [page, perPage]);

  const addItem = () => setForm((prev) => ({ ...prev, itens: [...prev.itens, EMPTY_ITEM] }));
  const removeItem = (index) => setForm((prev) => ({ ...prev, itens: prev.itens.filter((_, i) => i !== index) }));

  const setItem = (index, patch) => setForm((prev) => ({
    ...prev,
    itens: prev.itens.map((item, i) => (i === index ? { ...item, ...patch } : item)),
  }));

  const submit = async () => {
    await api.post('/almoxarifado/requisicoes', {
      ...form,
      itens: form.itens.filter((item) => item.almoxarifado_produto_id && item.quantidade_solicitada),
    });
    setOpen(false);
    setForm(EMPTY);
    await load();
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    setFeedback(null);
    try {
      await api.patch(`/almoxarifado/requisicoes/${id}/status`, { status });
      setFeedback({ type: 'success', message: 'Status da requisição atualizado com sucesso.' });
      await load();
    } catch (error) {
      const validationMessage = Object.values(error?.response?.data?.errors || {})?.[0]?.[0];
      setFeedback({
        type: 'error',
        message:
          validationMessage ||
          error?.response?.data?.message ||
          'Não foi possível atualizar o status da requisição.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/almoxarifado/requisicoes/${id}`);
      setDetail(data);
    } catch (error) {
      setFeedback({ type: 'error', message: error?.response?.data?.message || 'Não foi possível carregar a requisição.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const printRequest = async (row) => {
    try {
      const response = await api.get(`/almoxarifado/requisicoes/${row.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `requisicao-${row.numero}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback({ type: 'error', message: error?.response?.data?.message || 'Não foi possível imprimir a requisição.' });
    }
  };

  const botaoStatus = (row, status, rotulo) => (
    <Button size="sm" disabled={updatingId === row.id} onClick={() => updateStatus(row.id, status)}>
      {updatingId === row.id ? <Loader2 aria-label="Atualizando" className="animate-spin" /> : rotulo}
    </Button>
  );

  const colunas = [
    { chave: 'numero', titulo: 'Número', render: (row) => <span className="font-semibold">{row.numero}</span> },
    { chave: 'secretaria', titulo: 'Secretaria', render: (row) => row.secretaria?.nome || '-' },
    { chave: 'solicitante', titulo: 'Solicitante', render: (row) => row.solicitante },
    {
      chave: 'status',
      titulo: 'Status',
      render: (row) => {
        const meta = STATUS_META[row.status] || { tom: 'neutro', label: row.status };
        return <Pilula tom={meta.tom}>{meta.label}</Pilula>;
      },
    },
    { chave: 'itens', titulo: 'Itens', numerica: true, render: (row) => row.itens?.length || 0 },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (row) => {
        const podeGerir = Number(row.requisitante_user_id) === Number(currentUserId) || capabilities?.almoxarifado_approve || capabilities?.almoxarifado_deliver;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openDetail(row.id)}>Detalhes</Button>
            {podeGerir && <Button size="sm" variant="outline" onClick={() => printRequest(row)}>Imprimir</Button>}
            {row.status === 'recebida' && capabilities?.almoxarifado_approve && botaoStatus(row, 'aprovada', 'Aprovar')}
            {row.status === 'aprovada' && capabilities?.almoxarifado_deliver && botaoStatus(row, 'em_separacao', 'Separar')}
            {row.status === 'em_separacao' && capabilities?.almoxarifado_deliver && botaoStatus(row, 'entregue', 'Entregar')}
            {row.status !== 'entregue' && row.status !== 'cancelada' && podeGerir && (
              <Button size="sm" variant="destructive" disabled={updatingId === row.id} onClick={() => updateStatus(row.id, 'cancelada')}>Cancelar</Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <CabecalhoDePagina titulo="Requisições" subtitulo="Solicitações, aprovações e entrega." />
      <AlertModal />
      {feedback && (
        <div className="mb-4">
          <Banner tom={feedback.type === 'success' ? 'sucesso' : 'perigo'} onDispensar={() => setFeedback(null)}>{feedback.message}</Banner>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CampoDeBusca
          rotulo="Pesquisar requisição"
          placeholder="Pesquisar requisição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
        />
        {capabilities?.almoxarifado_create && (
          <Button onClick={() => setOpen(true)}><Plus /> Nova requisição</Button>
        )}
      </div>

      <DataTable rotulo="Requisições" colunas={colunas} linhas={rows} chaveDaLinha={(row) => row.id} carregando={loading} vazio="Nenhuma requisição encontrada." />
      <Paginacao
        total={total}
        pagina={page}
        porPagina={perPage}
        aoMudarPagina={setPage}
        aoMudarPorPagina={(n) => {
          setPerPage(n);
          setPage(0);
        }}
      />

      <Dialogo aberto={open} aoFechar={() => setOpen(false)} tamanho="lg">
        <DialogoCabecalho>Nova Requisição</DialogoCabecalho>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <CampoSelecao id="req-secretaria" label="Secretaria" value={form.almoxarifado_secretaria_id} onChange={(e) => setForm((prev) => ({ ...prev, almoxarifado_secretaria_id: e.target.value }))}>
            <option value="">Selecione</option>
            {secretarias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </CampoSelecao>
          <div className="grid gap-4 sm:grid-cols-2">
            <Dado rotulo="Requisitante">{username || 'Usuário logado'}</Dado>
            <Dado rotulo="Data da solicitação">{new Date().toLocaleDateString('pt-BR')}</Dado>
          </div>
          <CampoTexto id="req-justificativa" label="Justificativa" multiline rows={2} value={form.justificativa} onChange={(e) => setForm((prev) => ({ ...prev, justificativa: e.target.value }))} />
          <CampoTexto id="req-observacoes" label="Observações" multiline rows={2} value={form.observacoes} onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))} />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Itens</h3>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}><Plus /> Adicionar item</Button>
            </div>
            <div className="space-y-3">
              {form.itens.map((item, index) => (
                <div key={`${index}-${item.almoxarifado_produto_id || 'novo'}`} className="grid items-end gap-3 rounded-lg border border-border p-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                  <CampoSelecao id={`req-item-${index}-produto`} label="Produto" value={item.almoxarifado_produto_id} onChange={(e) => setItem(index, { almoxarifado_produto_id: e.target.value })}>
                    <option value="">Selecione</option>
                    {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </CampoSelecao>
                  <CampoTexto id={`req-item-${index}-qtd`} label="Quantidade" type="number" min={0} step="0.001" value={item.quantidade_solicitada} onChange={(e) => setItem(index, { quantidade_solicitada: e.target.value })} />
                  <CampoTexto id={`req-item-${index}-obs`} label="Observação" value={item.observacao} onChange={(e) => setItem(index, { observacao: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover item" onClick={() => removeItem(index)} disabled={form.itens.length === 1}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogoRodape>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Gravar</Button>
          </DialogoRodape>
        </form>
      </Dialogo>

      <Dialogo aberto={Boolean(detail) || detailLoading} aoFechar={() => setDetail(null)} tamanho="lg">
        <DialogoCabecalho>{detail ? `Requisição ${detail.numero}` : 'Carregando requisição'}</DialogoCabecalho>
        {detailLoading ? (
          <div className="flex justify-center py-8"><Loader2 aria-label="Carregando" className="size-8 animate-spin text-muted-foreground" /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Dado rotulo="Requisitante">{detail.requisitante?.name || detail.solicitante}</Dado>
              <Dado rotulo="Data">{formatDate(detail.data_solicitacao)}</Dado>
              <Dado rotulo="Status">{STATUS_META[detail.status]?.label || detail.status}</Dado>
            </div>

            <h3 className="font-display text-base font-bold">Itens</h3>
            {(detail.itens || []).map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <p className="font-semibold">{item.produto?.nome || '-'}</p>
                <p className="text-sm text-muted-foreground">Quantidade solicitada: {item.quantidade_solicitada}</p>
              </div>
            ))}

            <h3 className="font-display text-base font-bold">Histórico</h3>
            <ul className="divide-y divide-border">
              {[...(detail.historicos || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((entry) => (
                <li key={entry.id} className="py-3">
                  <p className="font-semibold">{STATUS_META[entry.novo_status]?.label || entry.novo_status}</p>
                  <p className="text-sm text-muted-foreground">{entry.user?.name || 'Sistema'} · {new Date(entry.created_at).toLocaleString('pt-BR')}</p>
                  {entry.observacao && <p className="text-sm text-muted-foreground">{entry.observacao}</p>}
                </li>
              ))}
            </ul>

            <DialogoRodape>
              <Button variant="outline" onClick={() => printRequest(detail)}>Imprimir</Button>
              <Button onClick={() => setDetail(null)}>Fechar</Button>
            </DialogoRodape>
          </div>
        ) : null}
      </Dialogo>
    </div>
  );
}
