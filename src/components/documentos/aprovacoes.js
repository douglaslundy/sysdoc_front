import React, { useEffect, useState } from 'react';
import ConfirmDialog from '../confirmDialog';
import { api } from '../../services/api';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { DataTable } from '../ui/data-table';
import { Paginacao } from '../ui/paginacao';
import { Pilula } from '../ui/pilula';

const STATUS_LABELS = {
  approved: 'Aprovada',
  pending: 'Pendente',
  rejected: 'Rejeitada',
};

const STATUS_TONS = {
  approved: 'sucesso',
  pending: 'alerta',
  rejected: 'perigo',
};

const TOM_DO_ALERTA = { success: 'sucesso', error: 'perigo', warning: 'alerta' };

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  const firstError = data?.errors && Object.values(data.errors).flat().find(Boolean);
  return firstError || fallback;
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('pt-BR') : '—');

export default function DocumentosAprovacoes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', onConfirm: null });

  const load = async (nextPage = page, nextRows = rowsPerPage) => {
    setLoading(true);
    try {
      const res = await api.get('/documentos/aprovacoes', { params: { page: nextPage + 1, per_page: nextRows } });
      setItems(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: getErrorMessage(error, 'Não foi possível carregar as aprovações.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitDecision = async (approvalId, action) => {
    setActionLoadingId(approvalId);
    try {
      const url = action === 'approve'
        ? `/documentos/aprovacoes/${approvalId}/aprovar`
        : `/documentos/aprovacoes/${approvalId}/rejeitar`;
      const response = await api.post(url);
      setAlertState({ visible: true, type: 'success', message: response?.data?.message || 'Operação concluída com sucesso.' });
      await load(page, rowsPerPage);
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: getErrorMessage(error, 'Não foi possível concluir a operação.') });
    } finally {
      setActionLoadingId(null);
      setConfirmDialog({ isOpen: false, title: '', subTitle: '', onConfirm: null });
    }
  };

  const askApprove = (item) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar assinatura',
      subTitle: `Deseja aprovar a exclusão do documento "${item.document?.titulo || `#${item.document_id}`}"?`,
      onConfirm: () => submitDecision(item.id, 'approve'),
    });
  };

  const askReject = (item) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Rejeitar solicitação',
      subTitle: `Deseja rejeitar a exclusão do documento "${item.document?.titulo || `#${item.document_id}`}"?`,
      onConfirm: () => submitDecision(item.id, 'reject'),
    });
  };

  const colunas = [
    { chave: 'documento', titulo: 'Documento', render: (item) => item.document?.titulo || `#${item.document_id}` },
    { chave: 'acao', titulo: 'Ação', render: (item) => String(item.action || '').toUpperCase() },
    {
      chave: 'status',
      titulo: 'Status',
      render: (item) => <Pilula tom={STATUS_TONS[item.status] || 'neutro'}>{STATUS_LABELS[item.status] || item.status}</Pilula>,
    },
    { chave: 'solicitante', titulo: 'Solicitante', render: (item) => item.requester?.name || '—' },
    {
      chave: 'assinaturas',
      titulo: 'Assinaturas',
      render: (item) => (
        <div className="grid gap-1">
          {(item.signers || []).map((signer) => (
            <span key={signer.id} className={`text-sm ${signer.signed ? 'text-success' : 'text-muted-foreground'}`}>
              {signer.name}{signer.signed ? ' - assinou' : ' - pendente'}
            </span>
          ))}
        </div>
      ),
    },
    { chave: 'conclusao', titulo: 'Conclusão', render: (item) => formatDateTime(item.approved_at || item.rejected_at || item.updated_at) },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (item) => (item.can_current_user_approve ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="success" size="sm" disabled={actionLoadingId === item.id} onClick={() => askApprove(item)}>
            Aprovar
          </Button>
          <Button variant="destructive" size="sm" disabled={actionLoadingId === item.id} onClick={() => askReject(item)}>
            Rejeitar
          </Button>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{item.status === 'pending' ? 'Aguardando responsáveis' : 'Sem ações'}</span>
      )),
    },
  ];

  return (
    <div className="documentos-page">
      <CabecalhoDePagina
        titulo="Aprovações de Documentos"
        subtitulo="Solicitações pendentes e histórico formal de exclusões submetidas à tripla assinatura."
      />
      {alertState.visible && (
        <div className="mb-4">
          <Banner tom={TOM_DO_ALERTA[alertState.type] || 'info'} onDispensar={() => setAlertState({ visible: false, type: 'success', message: '' })}>
            {alertState.message}
          </Banner>
        </div>
      )}

      <DataTable
        rotulo="aprovações de documentos"
        colunas={colunas}
        linhas={items}
        chaveDaLinha={(item) => item.id}
        carregando={loading}
        vazio="Nenhuma aprovação registrada."
      />
      <Paginacao
        total={total}
        pagina={page}
        porPagina={rowsPerPage}
        opcoes={[15, 25, 50]}
        aoMudarPagina={(nextPage) => {
          setPage(nextPage);
          load(nextPage, rowsPerPage);
        }}
        aoMudarPorPagina={(nextRows) => {
          setRowsPerPage(nextRows);
          setPage(0);
          load(0, nextRows);
        }}
      />
      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </div>
  );
}
