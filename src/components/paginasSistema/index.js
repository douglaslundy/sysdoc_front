import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Fab,
  FormControlLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { normalizeIconName } from '../../utils/iconResolver';
import {
  getAllPages,
  addPageFetch,
  editPageFetch,
  removePageFetch,
  getAllPageCategories,
} from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import BaseCard from '../baseCard/BaseCard';
import ConfirmDialog from '../confirmDialog';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  height: '98%',
  bgcolor: 'background.paper',
  border: '0px solid transparent',
  boxShadow: 24,
  p: 4,
  overflow: 'scroll',
};

const FORM_INICIAL = {
  titulo: '',
  path: '',
  icone: '',
  categoria: '',
  category_id: '',
  ordem: 1,
  ativo: true,
};

const ICONES = [
  'home', 'pie-chart', 'user', 'users', 'shield', 'bar-chart-2',
  'thermometer', 'clipboard', 'tag', 'user-check', 'calendar',
  'award', 'layers', 'truck', 'map', 'map-pin', 'send', 'file-text',
  'cpu', 'tool', 'grid', 'monitor', 'activity', 'plus-circle', 'layout',
  'alert-triangle', 'maximize', 'settings', 'lock', 'key', 'log-in', 'package', 'check-square',
];

const StyledTableRow = styled(TableRow)(() => ({
  '& td': {
    background: 'var(--queue-row-bg)',
    borderTop: '0.5px solid var(--lg-border)',
    borderBottom: '0.5px solid var(--lg-border)',
    paddingTop: 12,
    paddingBottom: 12,
    color: 'var(--queue-text-primary)',
  },
  '& td:first-of-type': {
    borderLeft: '0.5px solid var(--lg-border)',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  '& td:last-of-type': {
    borderRight: '0.5px solid var(--lg-border)',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  '&:hover td': {
    background: 'var(--queue-row-hover)',
  },
}));

export default function PaginasSistema() {
  const dispatch = useDispatch();
  const { pages, pageCategories } = useSelector((state) => state.accessProfiles);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Deseja realmente excluir?',
    subTitle: 'Esta acao nao podera ser desfeita.',
  });

  useEffect(() => {
    dispatch(getAllPages());
    dispatch(getAllPageCategories());
  }, [dispatch]);

  const filtradas = pages
    .filter(
      (p) =>
        p.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        p.path?.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(busca.toLowerCase())
    )
    .filter((p) => !filtroCategoria || String(p.category_id || '') === String(filtroCategoria))
    .sort((a, b) => {
      const catCmp = (a.categoria || '').localeCompare(b.categoria || '');
      if (catCmp !== 0) return catCmp;
      const orderCmp = Number(a.ordem ?? 999) - Number(b.ordem ?? 999);
      if (orderCmp !== 0) return orderCmp;
      return (a.titulo || '').localeCompare(b.titulo || '');
    });

  const categoriasAtivas = pageCategories
    .filter((c) => c.ativo)
    .sort((a, b) => {
      if ((a.ordem ?? 999) !== (b.ordem ?? 999)) return (a.ordem ?? 999) - (b.ordem ?? 999);
      return (a.nome || '').localeCompare(b.nome || '');
    });

  const handleNova = () => {
    setEditId(null);
    setForm(FORM_INICIAL);
    setOpenModal(true);
  };

  const handleEditar = (pg) => {
    setEditId(pg.id);
    setForm({
      titulo: pg.titulo,
      path: pg.path,
      icone: pg.icone || '-',
      categoria: pg.categoria || '',
      category_id: pg.category_id || pg.category?.id || '',
      ordem: Number(pg.ordem ?? 1),
      ativo: pg.ativo,
    });
    setOpenModal(true);
  };

  const handleSave = () => {
    const payload = { ...form, ordem: Number(form.ordem || 1) };
    if (!payload.category_id) payload.category_id = null;

    if (editId) {
      dispatch(
        editPageFetch(editId, payload, () => {
          setOpenModal(false);
          dispatch(getAllPages());
        })
      );
    } else {
      dispatch(
        addPageFetch(payload, () => {
          setOpenModal(false);
          dispatch(getAllPages());
        })
      );
    }
  };

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'category_id') {
        const selected = pageCategories.find((c) => String(c.id) === String(value));
        next.categoria = selected?.nome || '';
      }
      return next;
    });
  };

  const previewReorder = () => {
    const targetCategoryId = form.category_id || null;
    const targetOrder = Number(form.ordem || 1);
    const sameCategoryPages = pages
      .filter((p) => String(p.category_id || '') === String(targetCategoryId || ''))
      .filter((p) => !editId || p.id !== editId)
      .sort((a, b) => Number(a.ordem ?? 999) - Number(b.ordem ?? 999));

    if (sameCategoryPages.length === 0) {
      return `A pagina sera posicionada como ${targetOrder}a nesta categoria.`;
    }

    const conflict = sameCategoryPages.find((p) => Number(p.ordem) === targetOrder);
    if (conflict) {
      return `Ao salvar, "${conflict.titulo}" e as proximas serao deslocadas automaticamente.`;
    }

    const maxOrder = Number(sameCategoryPages[sameCategoryPages.length - 1].ordem ?? 0);
    if (targetOrder > maxOrder + 1) {
      return 'A ordem informada e maior que a sequencia atual; ela sera posicionada ao final da categoria.';
    }

    return `A pagina sera posicionada como ${targetOrder}a nesta categoria.`;
  };

  const handleRemove = (pg) => {
    setConfirmDialog({
      isOpen: true,
      title: `Deseja remover a pagina ${pg.titulo}?`,
      subTitle: 'Esta acao nao podera ser desfeita.',
      confirm: () => dispatch(removePageFetch(pg.id)),
    });
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page paginas-sistema-page">
      <BaseCard title={`Voce possui ${pages.length} Paginas Cadastradas no Sistema`}>
        <AlertModal />
        <Box className="queue-page__toolbar" display="flex" alignItems="center" justifyContent="space-between" flexWrap="nowrap" gap={1} mb={2} sx={{ overflowX: 'auto' }}>
          <Box display="flex" gap={1} flexWrap="nowrap" sx={{ minWidth: 0, flex: 1 }}>
            <TextField
              className="lg-search-field"
              size="small"
              placeholder="Buscar por titulo, path ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              inputProps={{ maxLength: 80 }}
              sx={{ minWidth: 260, flex: 1 }}
            />
            <FormControl className="lg-search-field" size="small" sx={{ minWidth: 220, width: 220, flexShrink: 0 }}>
              <InputLabel>Filtrar categoria</InputLabel>
              <Select
                value={filtroCategoria}
                label="Filtrar categoria"
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <MenuItem value="">
                  <em>Todas</em>
                </MenuItem>
                {categoriasAtivas.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Fab color="primary" title="Nova Pagina" onClick={handleNova} className="queue-page__fab queue-page__fab--add">
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table aria-label="paginas" className="queue-page__table" sx={{ mt: 1, whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Titulo</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Path</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">icone</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Categoria</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Ordem</Typography></TableCell>
                <TableCell align="center" className="queue-page__th"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                <TableCell align="center" className="queue-page__th"><Typography color="textSecondary" variant="h6">Acoes</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pg) => (
                <StyledTableRow key={pg.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {pg.icone && <FeatherIcon icon={normalizeIconName(pg.icone, 'circle')} width="16" height="16" />}
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>{pg.titulo}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block' }}>
                      {pg.path}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography color="textSecondary" sx={{ fontSize: '12px' }}>{pg.icone || '-'}</Typography></TableCell>
                  <TableCell>{pg.categoria ? <Chip label={pg.categoria} size="small" variant="outlined" /> : <Typography color="textSecondary" sx={{ fontSize: '12px' }}>-</Typography>}</TableCell>
                  <TableCell><Typography>{Number(pg.ordem ?? 999)}</Typography></TableCell>
                  <TableCell align="center"><Chip label={pg.ativo ? 'Ativa' : 'Inativa'} color={pg.ativo ? 'success' : 'error'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ '& button': { mx: 1 } }} className="queue-page__actions">
                      <Button className="queue-page__action queue-page__action--success" title="Editar pagina" onClick={() => handleEditar(pg)} color="success" size="medium" variant="contained">
                        <FeatherIcon icon="edit" width="20" height="20" />
                      </Button>
                      <Button className="queue-page__action queue-page__action--danger" title="Remover pagina" onClick={() => handleRemove(pg)} color="error" size="medium" variant="contained">
                        <FeatherIcon icon="trash" width="20" height="20" />
                      </Button>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center"><Typography color="text.secondary">Nenhuma pagina encontrada</Typography></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            className="queue-page__pagination"
            component="div"
            count={filtradas.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 15, 25]}
            labelRowsPerPage="Por pagina:"
          />
        </TableContainer>
      </BaseCard>

      <Modal keepMounted open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={modalStyle} className="paginas-sistema-modal-shell">
          <AlertModal />
          <BaseCard title={editId ? 'Editar Pagina do Sistema' : 'Nova Pagina do Sistema'}>
            <Stack spacing={3}>
              <TextField
                className="lg-search-field"
                fullWidth
                label="Titulo da Pagina"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                required
                inputProps={{ maxLength: 80 }}
              />

              <TextField
                className="lg-search-field"
                fullWidth
                label="Path (rota)"
                name="path"
                value={form.path}
                onChange={handleChange}
                required
                inputProps={{ maxLength: 120 }}
                helperText="Caminho da pagina, ex: /laboratorio/exames"
              />

              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select name="category_id" value={form.category_id} label="Categoria" onChange={handleChange}>
                  <MenuItem value=""><em>Sem categoria</em></MenuItem>
                  {categoriasAtivas.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                className="lg-search-field"
                fullWidth
                label="Ordem dentro da categoria"
                name="ordem"
                type="number"
                value={form.ordem}
                onChange={handleChange}
                inputProps={{ min: 1 }}
                helperText={previewReorder()}
              />

              <FormControl fullWidth>
                <InputLabel>icone</InputLabel>
                <Select
                  name="icone"
                  value={form.icone}
                  label="icone"
                  onChange={handleChange}
                  renderValue={(val) =>
                    val ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <FeatherIcon icon={normalizeIconName(val, 'circle')} width="16" height="16" />
                        <span>{val}</span>
                      </Box>
                    ) : (
                      <em>Sem icone</em>
                    )
                  }
                >
                  <MenuItem value=""><em>Sem icone</em></MenuItem>
                  {ICONES.map((ic) => (
                    <MenuItem key={ic} value={ic}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <FeatherIcon icon={normalizeIconName(ic, 'circle')} width="16" height="16" />
                        <span>{ic}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Switch checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />}
                label="Pagina ativa"
              />
            </Stack>
            <br />
            <Box sx={{ '& button': { mx: 1 } }}>
              <Button variant="contained" onClick={handleSave}>Gravar</Button>
              <Button variant="outlined" onClick={() => setOpenModal(false)}>Cancelar</Button>
            </Box>
          </BaseCard>
        </Box>
      </Modal>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </Box>
  );
}








