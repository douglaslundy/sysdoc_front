import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Modal, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import TableLoadingRows from '../tableLoadingRows';
import { modalBackdropSx, modalFormRootSx, modalShellSx } from '../modal/_shared/modalFormStyles';

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

const STATUS = (value, minimum) => {
  const qty = Number(value || 0);
  const min = Number(minimum || 0);
  if (qty <= 0) return { color: 'error', label: 'Sem estoque' };
  if (min > 0 && qty < min) return { color: 'warning', label: 'Abaixo do mínimo' };
  return { color: 'success', label: 'OK' };
};

const EMPTY = { almoxarifado_produto_id: '', almoxarifado_secretaria_id: '', tipo: 'entrada', quantidade: '', motivo: '', observacao: '', secretaria_destino_id: '' };

export default function EstoquePage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [abaixoMinimo, setAbaixoMinimo] = useState(false);
  const [secretarias, setSecretarias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const loadOptions = async () => {
    const [sRes, pRes] = await Promise.all([
      api.get('/almoxarifado/catalogos/secretarias'),
      api.get('/almoxarifado/produtos', { params: { per_page: 100, page: 1, ativo: true } }),
    ]);
    setSecretarias(Array.isArray(sRes.data) ? sRes.data : []);
    setProdutos(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/almoxarifado/estoque', {
        params: {
          page: page + 1,
          per_page: perPage,
          search: search || undefined,
          abaixo_minimo: abaixoMinimo ? 1 : undefined,
        },
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total ?? res.data?.meta?.total ?? 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions().catch(() => {});
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [page, perPage, abaixoMinimo]);

  const selectedProduct = useMemo(() => produtos.find((p) => String(p.id) === String(form.almoxarifado_produto_id)), [form.almoxarifado_produto_id, produtos]);
  const selectedStockType = form.tipo;

  const submitMovement = async () => {
    await api.post('/almoxarifado/estoque/movimentar', {
      ...form,
      quantidade: Number(form.quantidade),
      almoxarifado_secretaria_id: form.almoxarifado_secretaria_id || null,
      secretaria_destino_id: form.secretaria_destino_id || null,
    });
    setOpen(false);
    setForm(EMPTY);
    await load();
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-estoque-page">
      <BaseCard title="Estoque">
        <AlertModal />
        <Box className="queue-page__toolbar" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField
            className="lg-search-field"
            placeholder="Pesquisar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            sx={{ flex: '1 1 280px', minWidth: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filtro</InputLabel>
            <Select value={abaixoMinimo ? 'baixo' : 'todos'} label="Filtro" onChange={(e) => setAbaixoMinimo(e.target.value === 'baixo')}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="baixo">Abaixo do mínimo</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => setOpen(true)} sx={{ ml: 'auto' }}>
            Novo Movimento
          </Button>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Produto</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Secretaria</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Disponível</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Reservado</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Separação</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Entregue</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Status</Typography></TableCell>
              </TableRow>
            </TableHead>
            {loading ? (
              <TableLoadingRows columns={7} rows={5} />
            ) : (
              <TableBody>
                {rows.map((row) => {
                  const meta = STATUS(row.quantidade_disponivel, row.produto?.estoque_minimo);
                  return (
                    <StyledTableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{row.produto?.nome || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.produto?.codigo_interno || '-'}</Typography>
                      </TableCell>
                      <TableCell>{row.secretaria?.nome || 'Estoque central'}</TableCell>
                      <TableCell>{Number(row.quantidade_disponivel || 0).toFixed(3)}</TableCell>
                      <TableCell>{Number(row.quantidade_reservada || 0).toFixed(3)}</TableCell>
                      <TableCell>{Number(row.quantidade_em_separacao || 0).toFixed(3)}</TableCell>
                      <TableCell>{Number(row.quantidade_entregue || 0).toFixed(3)}</TableCell>
                      <TableCell><Chip size="small" color={meta.color} label={meta.label} /></TableCell>
                    </StyledTableRow>
                  );
                })}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Nenhum saldo encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
          <TablePagination
            className="queue-page__pagination"
            component="div"
            count={total}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </TableContainer>
      </BaseCard>

      <Modal keepMounted open={open} onClose={() => setOpen(false)} slotProps={{ backdrop: { sx: modalBackdropSx } }}>
        <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>
          <BaseCard title="Novo Movimento">
            <Stack spacing={2.2}>
              <FormControl fullWidth>
                <InputLabel>Produto</InputLabel>
                <Select value={form.almoxarifado_produto_id} label="Produto" onChange={(e) => setForm((prev) => ({ ...prev, almoxarifado_produto_id: e.target.value }))}>
                  <MenuItem value=""><em>Selecione</em></MenuItem>
                  {produtos.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Secretaria</InputLabel>
                <Select value={form.almoxarifado_secretaria_id} label="Secretaria" onChange={(e) => setForm((prev) => ({ ...prev, almoxarifado_secretaria_id: e.target.value }))}>
                  <MenuItem value=""><em>Estoque central</em></MenuItem>
                  {secretarias.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={form.tipo} label="Tipo" onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}>
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saida">Saída</MenuItem>
                  <MenuItem value="ajuste">Ajuste</MenuItem>
                  <MenuItem value="transferencia">Transferência</MenuItem>
                </Select>
              </FormControl>
              {selectedStockType === 'transferencia' && (
                <FormControl fullWidth>
                  <InputLabel>Destino</InputLabel>
                  <Select value={form.secretaria_destino_id} label="Destino" onChange={(e) => setForm((prev) => ({ ...prev, secretaria_destino_id: e.target.value }))}>
                    <MenuItem value=""><em>Selecione</em></MenuItem>
                    {secretarias.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
              <TextField label="Quantidade" type="number" value={form.quantidade} onChange={(e) => setForm((prev) => ({ ...prev, quantidade: e.target.value }))} inputProps={{ min: 0, step: '0.001' }} />
              <TextField label="Motivo" value={form.motivo} onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))} />
              <TextField label="Observação" multiline rows={3} value={form.observacao} onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))} />
              {selectedProduct ? <Typography variant="caption" color="text.secondary">Produto selecionado: {selectedProduct.nome}</Typography> : null}
            </Stack>
            <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
              <Button variant="contained" onClick={submitMovement}>Gravar</Button>
              <Button variant="outlined" onClick={() => setOpen(false)}>Cancelar</Button>
            </Box>
          </BaseCard>
        </Box>
      </Modal>
    </Box>
  );
}
