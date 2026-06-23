import React, { useEffect, useState } from 'react';
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import TableLoadingRows from '../tableLoadingRows';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

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

const TYPE_META = {
  entrada: { color: 'success', label: 'Entrada' },
  saida: { color: 'error', label: 'Saída' },
  ajuste: { color: 'warning', label: 'Ajuste' },
  transferencia: { color: 'info', label: 'Transferência' },
  reservado: { color: 'secondary', label: 'Reserva' },
};

export default function MovimentacoesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/almoxarifado/movimentacoes', {
        params: { page: page + 1, per_page: perPage, search: search || undefined, tipo: tipo || undefined },
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total ?? res.data?.meta?.total ?? 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [page, perPage, tipo]);

  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-movimentacoes-page">
      <BaseCard title="Movimentações">
        <AlertModal />
        <Box className="queue-page__toolbar" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField className="lg-search-field" placeholder="Pesquisar produto..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} sx={{ flex: '1 1 280px', minWidth: 220 }} />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="saida">Saída</MenuItem>
              <MenuItem value="ajuste">Ajuste</MenuItem>
              <MenuItem value="transferencia">Transferência</MenuItem>
              <MenuItem value="reservado">Reserva</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Data</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Produto</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Tipo</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Qtd</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Motivo</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6" color="text.secondary">Usuário</Typography></TableCell>
              </TableRow>
            </TableHead>
            {loading ? (
              <TableLoadingRows columns={6} rows={5} />
            ) : (
              <TableBody>
                {rows.map((row) => {
                  const meta = TYPE_META[row.tipo] || { color: 'default', label: row.tipo };
                  return (
                    <StyledTableRow key={row.id} hover>
                      <TableCell>{row.created_at || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{row.produto?.nome || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.produto?.codigo_interno || '-'}</Typography>
                      </TableCell>
                      <TableCell><Chip size="small" color={meta.color} label={meta.label} /></TableCell>
                      <TableCell>{Number(row.quantidade || 0).toFixed(3)}</TableCell>
                      <TableCell>{row.motivo || '-'}</TableCell>
                      <TableCell>{row.user?.name || '-'}</TableCell>
                    </StyledTableRow>
                  );
                })}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Nenhuma movimentação encontrada.</TableCell>
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
    </Box>
  );
}
