import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import ConfirmDialog from '../confirmDialog';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';
import { api } from '../../services/api';

const STATUS_LABELS = {
  approved: 'Aprovada',
  pending: 'Pendente',
  rejected: 'Rejeitada',
};

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

  return (
    <Box sx={modalFormRootSx} className="queue-page documentos-page">
      <BaseCard title="Aprovações de Documentos">
        {alertState.visible && (
          <Alert
            sx={{ mb: 2 }}
            variant="filled"
            severity={alertState.type}
            onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}
          >
            {alertState.message}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Solicitações pendentes e histórico formal de exclusões submetidas à tripla assinatura.
        </Typography>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Documento</TableCell>
                <TableCell>Ação</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Solicitante</TableCell>
                <TableCell>Assinaturas</TableCell>
                <TableCell>Conclusão</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.document?.titulo || `#${item.document_id}`}</TableCell>
                  <TableCell>{String(item.action || '').toUpperCase()}</TableCell>
                  <TableCell>
                    <Chip size="small" label={STATUS_LABELS[item.status] || item.status} />
                  </TableCell>
                  <TableCell>{item.requester?.name || '—'}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {(item.signers || []).map((signer) => (
                        <Typography key={signer.id} variant="body2" color={signer.signed ? 'success.main' : 'text.secondary'}>
                          {signer.name}{signer.signed ? ' - assinou' : ' - pendente'}
                        </Typography>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(item.approved_at || item.rejected_at || item.updated_at)}
                  </TableCell>
                  <TableCell align="center">
                    {item.can_current_user_approve ? (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={actionLoadingId === item.id}
                          onClick={() => askApprove(item)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={actionLoadingId === item.id}
                          onClick={() => askReject(item)}
                        >
                          Rejeitar
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {item.status === 'pending' ? 'Aguardando responsáveis' : 'Sem ações'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">Nenhuma aprovação registrada.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[15, 25, 50]}
            onPageChange={(_, nextPage) => {
              setPage(nextPage);
              load(nextPage, rowsPerPage);
            }}
            onRowsPerPageChange={(e) => {
              const nextRows = Number(e.target.value);
              setRowsPerPage(nextRows);
              setPage(0);
              load(0, nextRows);
            }}
          />
        </TableContainer>
      </BaseCard>
      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </Box>
  );
}
