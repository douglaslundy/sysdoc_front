import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Fab,
  FormControl,
  FormControlLabel,
  InputLabel,
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
  styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { normalizeIconName } from '../../utils/iconResolver';
import {
  getAllPageCategories,
  addPageCategoryFetch,
  editPageCategoryFetch,
  removePageCategoryFetch,
} from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import BaseCard from '../baseCard/BaseCard';
import ConfirmDialog from '../confirmDialog';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const FORM_INICIAL = { nome: '', icone: '', ordem: 999, ativo: true };
const ICONES = [
  'home', 'pie-chart', 'user', 'users', 'shield', 'bar-chart-2',
  'thermometer', 'clipboard', 'tag', 'user-check', 'calendar',
  'award', 'layers', 'truck', 'map', 'map-pin', 'send', 'file-text',
  'cpu', 'tool', 'grid', 'monitor', 'activity', 'plus-circle', 'layout',
  'alert-triangle', 'maximize', 'settings', 'lock', 'key', 'log-in', 'package', 'check-square',
];

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '900px',
  maxWidth: '96vw',
  maxHeight: '92vh',
  overflow: 'auto',
  background: 'var(--lg-glass-modal)',
  backdropFilter: 'var(--lg-blur-modal)',
  WebkitBackdropFilter: 'var(--lg-blur-modal)',
  border: '0.5px solid var(--lg-border)',
  borderTop: '1px solid var(--lg-border-strong)',
  boxShadow: 'var(--lg-shadow-modal)',
  borderRadius: '20px',
  p: 3.2,
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export default function PaginasCategorias() {
  const dispatch = useDispatch();
  const { pageCategories } = useSelector((state) => state.accessProfiles);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Deseja realmente remover?',
    subTitle: 'Esta acao nao podera ser desfeita.',
  });

  useEffect(() => {
    dispatch(getAllPageCategories());
  }, [dispatch]);

  const categoriasFiltradas = [...pageCategories]
    .filter(
      (cat) =>
        (cat.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (cat.icone || '').toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));

  const handleNova = () => {
    setEditId(null);
    setForm(FORM_INICIAL);
    setOpenModal(true);
  };

  const handleEditar = (cat) => {
    setEditId(cat.id);
    setForm({
      nome: cat.nome || '',
      icone: cat.icone || '',
      ordem: Number(cat.ordem ?? 999),
      ativo: !!cat.ativo,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setEditId(null);
    setForm(FORM_INICIAL);
    setOpenModal(false);
  };

  const handleSave = () => {
    const payload = { ...form, ordem: Number(form.ordem || 999) };

    if (editId) {
      dispatch(
        editPageCategoryFetch(editId, payload, () => {
          handleCloseModal();
          dispatch(getAllPageCategories());
        })
      );
      return;
    }

    dispatch(
      addPageCategoryFetch(payload, () => {
        handleCloseModal();
        dispatch(getAllPageCategories());
      })
    );
  };

  const handleRemove = (cat) => {
    setConfirmDialog({
      isOpen: true,
      title: `Deseja remover a categoria ${cat.nome}?`,
      subTitle: 'Esta acao nao podera ser desfeita.',
      confirm: () => dispatch(removePageCategoryFetch(cat.id)),
    });
  };

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title={`Voce possui ${pageCategories.length} Categorias de Paginas Cadastradas`}>
        <AlertModal />

        <Box
          sx={{
            '& > :not(style)': { m: 2 },
            display: 'flex',
            justifyContent: 'stretch',
          }}
        >
          <TextField
            className="lg-search-field"
            sx={{ width: '100%' }}
            placeholder="Pesquisar categoria: Nome ou Icone"
            autoComplete="off"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <Fab color="primary" title="Nova Categoria" onClick={handleNova}>
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer>
          <Table aria-label="categorias de paginas" sx={{ mt: 3, whiteSpace: 'nowrap' }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">Nome</Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">Icone</Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">Ordem</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography color="textSecondary" variant="h6">Status</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography color="textSecondary" variant="h6">Acoes</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoriasFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((cat) => (
                  <StyledTableRow key={cat.id} hover>
                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {(cat.nome || '').toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {cat.icone ? (
                          <>
                            <FeatherIcon icon={normalizeIconName(cat.icone, 'circle')} width="16" height="16" />
                            <Typography color="textSecondary" sx={{ fontSize: '12px' }}>{cat.icone}</Typography>
                          </>
                        ) : (
                          <Typography color="textSecondary" sx={{ fontSize: '12px' }}>-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography>{cat.ordem ?? 999}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={cat.ativo ? 'Ativa' : 'Inativa'} color={cat.ativo ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ '& button': { mx: 1 } }}>
                        <Button
                          title="Editar categoria"
                          onClick={() => handleEditar(cat)}
                          color="success"
                          size="medium"
                          variant="contained"
                        >
                          <FeatherIcon icon="edit" width="20" height="20" />
                        </Button>

                        <Button
                          title="Remover categoria"
                          onClick={() => handleRemove(cat)}
                          color="error"
                          size="medium"
                          variant="contained"
                        >
                          <FeatherIcon icon="trash" width="20" height="20" />
                        </Button>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
              {categoriasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhum registro encontrado!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={categoriasFiltradas.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </BaseCard>

      <Modal
        keepMounted
        open={openModal}
        onClose={handleCloseModal}
        slotProps={{
          backdrop: {
            sx: {
              background: 'var(--lg-overlay-bg)',
              backdropFilter: 'var(--lg-blur-overlay)',
              WebkitBackdropFilter: 'var(--lg-blur-overlay)',
            },
          },
        }}
      >
        <Box
          sx={{
            ...modalStyle,
            '& .MuiCard-root': {
              background: 'transparent',
              boxShadow: 'none',
            },
            '& .MuiCardContent-root': {
              p: 0,
            },
            '& .MuiInputLabel-root': {
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--lg-text-muted)',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            },
            '& .MuiInputBase-root': {
              background: 'var(--lg-glass-input)',
              border: '0.5px solid var(--lg-border-input)',
              borderRadius: '10px',
              color: 'var(--lg-text-primary)',
              boxShadow: '0 1px 3px rgba(var(--lg-accent-rgb), 0.05), 0 1px 0 rgba(255,255,255,0.1) inset',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '& .MuiInputBase-root.Mui-focused': {
              background: 'var(--lg-glass-input-focus)',
              boxShadow: 'var(--lg-focus-ring)',
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--lg-text-muted)',
              opacity: 1,
            },
          }}
        >
          <AlertModal />
          <BaseCard title={editId ? 'Editar Categoria de Pagina' : 'Nova Categoria de Pagina'}>
            <Stack spacing={2.2}>
              <TextField
                className="lg-search-field"
                label="Nome da Categoria"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                inputProps={{
                  style: { textTransform: 'uppercase' },
                  maxLength: 80,
                }}
                required
              />

              <FormControl fullWidth>
                <InputLabel>Icone</InputLabel>
                <Select
                  value={form.icone}
                  label="Icone"
                  onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))}
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

              <TextField
                className="lg-search-field"
                label="Ordem"
                type="number"
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))}
                inputProps={{ min: 1 }}
              />

              <FormControlLabel
                control={<Switch checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />}
                label="Categoria ativa"
              />
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
              <Button
                onClick={handleSave}
                variant="contained"
                sx={{
                  flex: 1,
                  py: 1.2,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--lg-accent), #6D28D9)',
                  boxShadow: 'var(--lg-shadow-btn)',
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': {
                    opacity: 0.92,
                    transform: 'translateY(-1px)',
                    boxShadow: 'var(--lg-shadow-btn-hover)',
                    background: 'linear-gradient(135deg, var(--lg-accent-hover), #7C3AED)',
                  },
                }}
              >
                Gravar
              </Button>

              <Button
                onClick={handleCloseModal}
                variant="outlined"
                sx={{
                  py: 1.2,
                  px: 2.2,
                  borderRadius: '10px',
                  background: 'var(--lg-glass-input)',
                  border: '0.5px solid var(--lg-border-input)',
                  color: 'var(--lg-text-secondary)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'var(--lg-glass-input-focus)',
                    color: 'var(--lg-text-primary)',
                    border: '0.5px solid var(--lg-border-input)',
                  },
                }}
              >
                Cancelar
              </Button>
            </Box>
          </BaseCard>
        </Box>
      </Modal>

      <ConfirmDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />
    </Box>
  );
}

