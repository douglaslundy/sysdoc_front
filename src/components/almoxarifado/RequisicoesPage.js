import React, { useContext, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Modal, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import TableLoadingRows from '../tableLoadingRows';
import { modalBackdropSx, modalFormRootSx, modalShellSx } from '../modal/_shared/modalFormStyles';
import { AuthContext } from '../../contexts/AuthContext';

const StyledTableRow = styled(TableRow)(() => ({
  '& td': {
    background: 'var(--queue-row-bg)',
    borderTop: '0.5px solid var(--lg-border)',
    borderBottom: '0.5px solid var(--lg-border)',
    paddingTop: 12,
    paddingBottom: 12,
    color: 'var(--queue-text-primary)',
  },
  '& td:first-of-type': { borderLeft: '0.5px solid var(--lg-border)', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  '& td:last-of-type': { borderRight: '0.5px solid var(--lg-border)', borderTopRightRadius: 14, borderBottomRightRadius: 14 },
  '&:hover td': { background: 'var(--queue-row-hover)' },
}));

const STATUS_META = {
  recebida: { color: 'default', label: 'Recebida' },
  em_analise: { color: 'info', label: 'Em análise' },
  aprovada: { color: 'success', label: 'Aprovada' },
  recusada: { color: 'error', label: 'Recusada' },
  em_separacao: { color: 'warning', label: 'Em separação' },
  em_processo_de_entrega: { color: 'secondary', label: 'Em entrega' },
  entregue: { color: 'success', label: 'Entregue' },
  cancelada: { color: 'error', label: 'Cancelada' },
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

  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-requisicoes-page">
      <BaseCard title="Requisições">
        <AlertModal />
        {feedback && (
          <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        )}
        <Box className="queue-page__toolbar" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField className="lg-search-field" placeholder="Pesquisar requisição..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} sx={{ flex: '1 1 280px', minWidth: 220 }} />
          {capabilities?.almoxarifado_create && (
            <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => setOpen(true)}>Nova Requisição</Button>
          )}
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Número</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Secretaria</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Solicitante</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Status</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Itens</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Ações</Typography></TableCell>
              </TableRow>
            </TableHead>
            {loading ? (
              <TableLoadingRows columns={6} rows={5} />
            ) : (
              <TableBody>
                {rows.map((row) => {
                  const meta = STATUS_META[row.status] || { color: 'default', label: row.status };
                  return (
                    <StyledTableRow key={row.id} hover>
                      <TableCell><Typography variant="h6" sx={{ fontWeight: 600 }}>{row.numero}</Typography></TableCell>
                      <TableCell>{row.secretaria?.nome || '-'}</TableCell>
                      <TableCell>{row.solicitante}</TableCell>
                      <TableCell><Chip size="small" color={meta.color} label={meta.label} /></TableCell>
                      <TableCell>{row.itens?.length || 0}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => openDetail(row.id)}>Detalhes</Button>
                          {(Number(row.requisitante_user_id) === Number(currentUserId) || capabilities?.almoxarifado_approve || capabilities?.almoxarifado_deliver) && (
                            <Button size="small" variant="outlined" onClick={() => printRequest(row)}>Imprimir</Button>
                          )}
                          {row.status === 'recebida' && capabilities?.almoxarifado_approve && <Button size="small" variant="contained" disabled={updatingId === row.id} onClick={() => updateStatus(row.id, 'aprovada')}>{updatingId === row.id ? <CircularProgress size={16} /> : 'Aprovar'}</Button>}
                          {row.status === 'aprovada' && capabilities?.almoxarifado_deliver && <Button size="small" variant="contained" disabled={updatingId === row.id} onClick={() => updateStatus(row.id, 'em_separacao')}>{updatingId === row.id ? <CircularProgress size={16} /> : 'Separar'}</Button>}
                          {row.status === 'em_separacao' && capabilities?.almoxarifado_deliver && <Button size="small" variant="contained" disabled={updatingId === row.id} onClick={() => updateStatus(row.id, 'entregue')}>{updatingId === row.id ? <CircularProgress size={16} /> : 'Entregar'}</Button>}
                          {row.status !== 'entregue' && row.status !== 'cancelada' && (Number(row.requisitante_user_id) === Number(currentUserId) || capabilities?.almoxarifado_approve || capabilities?.almoxarifado_deliver) && <Button size="small" color="error" variant="outlined" disabled={updatingId === row.id} onClick={() => updateStatus(row.id, 'cancelada')}>Cancelar</Button>}
                        </Stack>
                      </TableCell>
                    </StyledTableRow>
                  );
                })}
                {!rows.length && (
                  <TableRow><TableCell colSpan={6} align="center">Nenhuma requisição encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            )}
          </Table>
          <TablePagination className="queue-page__pagination" component="div" count={total} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={perPage} onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </TableContainer>
      </BaseCard>

      <Modal keepMounted open={open} onClose={() => setOpen(false)} slotProps={{ backdrop: { sx: modalBackdropSx } }}>
        <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>
          <BaseCard title="Nova Requisição">
            <Stack spacing={2.2}>
              <FormControl fullWidth>
                <InputLabel>Secretaria</InputLabel>
                <Select value={form.almoxarifado_secretaria_id} label="Secretaria" onChange={(e) => setForm((prev) => ({ ...prev, almoxarifado_secretaria_id: e.target.value }))}>
                  <MenuItem value=""><em>Selecione</em></MenuItem>
                  {secretarias.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
                </Select>
              </FormControl>
              <Box>
                <Typography variant="caption" color="text.secondary">Requisitante</Typography>
                <Typography>{username || 'Usuário logado'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Data da solicitação</Typography>
                <Typography>{new Date().toLocaleDateString('pt-BR')}</Typography>
              </Box>
              <TextField label="Justificativa" value={form.justificativa} onChange={(e) => setForm((prev) => ({ ...prev, justificativa: e.target.value }))} multiline rows={2} />
              <TextField label="Observações" value={form.observacoes} onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))} multiline rows={2} />

              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="h6">Itens</Typography>
                  <Button size="small" onClick={addItem}>Adicionar item</Button>
                </Box>
                <Stack spacing={1.5}>
                  {form.itens.map((item, index) => (
                    <Box key={`${index}-${item.almoxarifado_produto_id || 'novo'}`} display="grid" gap={1.2} gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr 1fr auto' }}>
                      <FormControl fullWidth>
                        <InputLabel>Produto</InputLabel>
                        <Select value={item.almoxarifado_produto_id} label="Produto" onChange={(e) => setItem(index, { almoxarifado_produto_id: e.target.value })}>
                          <MenuItem value=""><em>Selecione</em></MenuItem>
                          {produtos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField label="Quantidade" type="number" value={item.quantidade_solicitada} onChange={(e) => setItem(index, { quantidade_solicitada: e.target.value })} inputProps={{ min: 0, step: '0.001' }} />
                      <TextField label="Observação" value={item.observacao} onChange={(e) => setItem(index, { observacao: e.target.value })} />
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <IconButton onClick={() => removeItem(index)} disabled={form.itens.length === 1}>
                          <FeatherIcon icon="trash" width="18" height="18" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
              <Button variant="contained" onClick={submit}>Gravar</Button>
              <Button variant="outlined" onClick={() => setOpen(false)}>Cancelar</Button>
            </Box>
          </BaseCard>
        </Box>
      </Modal>

      <Modal open={Boolean(detail) || detailLoading} onClose={() => setDetail(null)} slotProps={{ backdrop: { sx: modalBackdropSx } }}>
        <Box sx={{ ...modalShellSx, ...modalFormRootSx, maxWidth: 900 }}>
          <BaseCard title={detail ? `Requisição ${detail.numero}` : 'Carregando requisição'}>
            {detailLoading ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : detail ? (
              <Stack spacing={2}>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
                  <Box><Typography variant="caption">Requisitante</Typography><Typography>{detail.requisitante?.name || detail.solicitante}</Typography></Box>
                  <Box><Typography variant="caption">Data</Typography><Typography>{formatDate(detail.data_solicitacao)}</Typography></Box>
                  <Box><Typography variant="caption">Status</Typography><Typography>{STATUS_META[detail.status]?.label || detail.status}</Typography></Box>
                </Box>

                <Typography variant="h6">Itens</Typography>
                {(detail.itens || []).map((item) => (
                  <Box key={item.id} sx={{ p: 1.5, border: '1px solid var(--lg-border)', borderRadius: 2 }}>
                    <Typography fontWeight={700}>{item.produto?.nome || '-'}</Typography>
                    <Typography variant="body2">Quantidade solicitada: {item.quantidade_solicitada}</Typography>
                  </Box>
                ))}

                <Typography variant="h6">Histórico</Typography>
                <Stack divider={<Box sx={{ borderBottom: '1px solid var(--lg-border)' }} />}>
                  {[...(detail.historicos || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((entry) => (
                    <Box key={entry.id} py={1.25}>
                      <Typography fontWeight={700}>{STATUS_META[entry.novo_status]?.label || entry.novo_status}</Typography>
                      <Typography variant="body2">{entry.user?.name || 'Sistema'} · {new Date(entry.created_at).toLocaleString('pt-BR')}</Typography>
                      {entry.observacao && <Typography variant="body2" color="text.secondary">{entry.observacao}</Typography>}
                    </Box>
                  ))}
                </Stack>

                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Button variant="outlined" onClick={() => printRequest(detail)}>Imprimir</Button>
                  <Button variant="contained" onClick={() => setDetail(null)}>Fechar</Button>
                </Box>
              </Stack>
            ) : null}
          </BaseCard>
        </Box>
      </Modal>
    </Box>
  );
}
