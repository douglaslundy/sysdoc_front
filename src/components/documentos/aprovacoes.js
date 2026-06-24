import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';
import { api } from '../../services/api';

const STATUS_LABELS = {
  approved: 'Aprovada',
  pending: 'Pendente',
  rejected: 'Rejeitada',
};

export default function DocumentosAprovacoes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });

  const load = async (nextPage = page, nextRows = rowsPerPage) => {
    setLoading(true);
    try {
      const res = await api.get('/documentos/aprovacoes', { params: { page: nextPage + 1, per_page: nextRows } });
      setItems(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível carregar as aprovações.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={modalFormRootSx} className="queue-page documentos-page">
      <BaseCard title="Aprovações de Documentos">
        {alertState.visible && (
          <Alert sx={{ mb: 2 }} variant="filled" severity={alertState.type} onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}>
            {alertState.message}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Histórico formal das exclusões aprovadas com tripla assinatura.
        </Typography>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Documento</TableCell>
                <TableCell>Ação</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Solicitante</TableCell>
                <TableCell>Aprovador</TableCell>
                <TableCell>Assinantes</TableCell>
                <TableCell>Data</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.document?.titulo || `#${item.document_id}`}</TableCell>
                  <TableCell>{String(item.action || '').toUpperCase()}</TableCell>
                  <TableCell><Chip size="small" label={STATUS_LABELS[item.status] || item.status} /></TableCell>
                  <TableCell>{item.requester?.name || '—'}</TableCell>
                  <TableCell>{item.approver?.name || '—'}</TableCell>
                  <TableCell>{Array.isArray(item.signer_user_ids) ? item.signer_user_ids.join(', ') : '—'}</TableCell>
                  <TableCell>{item.approved_at ? new Date(item.approved_at).toLocaleString('pt-BR') : '—'}</TableCell>
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
    </Box>
  );
}
