import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Fab, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { useDispatch, useSelector } from 'react-redux';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import ConfirmDialog from '../../confirmDialog';
import MedicineDialog from '../../modal/medicine';
import { getAllMedicines, removeMedicineFetch } from '../../../store/fetchActions/medicines';
import { clearMedicinesState } from '../../../store/ducks/medicines';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];
const FILTER_SELECTS = [
  { name: 'is_free_distribution', label: 'Gratuito' },
  { name: 'is_controlled', label: 'Controlado' },
  { name: 'is_judicial_order', label: 'Ordem Judicial' },
  { name: 'is_high_cost', label: 'Alto Custo' },
  { name: 'active', label: 'Ativo' },
];

const truncate = (value, max = 30) => {
  if (!value) return '-';
  const text = String(value);
  return text.length > max ? `${text.substring(0, max)}...` : text;
};

const mapFilterValue = (value) => {
  if (value === '') return undefined;
  if (value === '1') return 1;
  if (value === '0') return 0;
  return value;
};

export default function MedicinesManager() {
  const StyledTableRow = styled(TableRow)(() => ({
    '&:nth-of-type(odd)': {
      backgroundColor: 'var(--lg-glass-row-hover)',
    },
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));

  const dispatch = useDispatch();
  const { medicines, pagination } = useSelector((state) => state.medicines);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    is_free_distribution: '',
    is_controlled: '',
    is_judicial_order: '',
    is_high_cost: '',
    active: '',
  });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const searchRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

  const buildParams = (currentFilters = filters, overrides = {}) => ({
    page: page + 1,
    per_page: perPage,
    search: search || undefined,
    is_free_distribution: mapFilterValue(currentFilters.is_free_distribution),
    is_controlled: mapFilterValue(currentFilters.is_controlled),
    is_judicial_order: mapFilterValue(currentFilters.is_judicial_order),
    is_high_cost: mapFilterValue(currentFilters.is_high_cost),
    active: mapFilterValue(currentFilters.active),
    ...overrides,
  });

  useEffect(() => {
    dispatch(getAllMedicines({ page: 1, per_page: perPage }));
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
      dispatch(clearMedicinesState());
      dispatch(clearAlertMessages());
      dispatch(clearMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  const handleSearch = ({ target }) => {
    const value = target.value;
    setSearch(value);
    setPage(0);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      dispatch(getAllMedicines(buildParams(filters, { search: value || undefined, page: 1 })));
    }, 400);
  };

  const handlePerPage = (event) => {
    const value = Number(event.target.value);
    setPerPage(value);
    setPage(0);
    dispatch(getAllMedicines(buildParams(filters, { per_page: value, page: 1 })));
  };

  const handlePage = (_, newPage) => {
    setPage(newPage);
    dispatch(getAllMedicines(buildParams(filters, { page: newPage + 1 })));
  };

  const onSuccess = () => {
    setDialogOpen(false);
    dispatch(getAllMedicines(buildParams(filters)));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const next = { ...filters, [name]: value };
    setFilters(next);
    setPage(0);
    dispatch(getAllMedicines(buildParams(next, { page: 1 })));
  };

  const renderTags = (medicine) => {
    const tags = [];
    if (medicine.is_free_distribution) tags.push('Distribuição Gratuita');
    if (medicine.is_controlled) tags.push('Controlado');
    if (medicine.is_judicial_order) tags.push('Ordem Judicial');
    if (medicine.is_high_cost) tags.push('Alto Custo');
    if (medicine.active) tags.push('Ativo');
    return tags.length ? tags.join(' | ') : '-';
  };

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title={`Medicamentos${pagination ? ` - ${pagination.total} registros` : ''}`}>
        <AlertModal />
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            mt: 1,
          }}
        >
          <TextField
            className="lg-search-field"
            placeholder="Buscar medicamento"
            value={search}
            onChange={handleSearch}
            sx={{ flex: '1 1 260px', minWidth: 220 }}
          />
          {FILTER_SELECTS.map((filter) => (
            <FormControl
              key={filter.name}
              size="small"
              sx={{
                flex: '1 1 140px',
                minWidth: 130,
              }}
            >
              <InputLabel>{filter.label}</InputLabel>
              <Select name={filter.name} value={filters[filter.name]} label={filter.label} onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="1">Sim</MenuItem>
                <MenuItem value="0">Não</MenuItem>
              </Select>
            </FormControl>
          ))}
          <Fab color="primary" size="medium" onClick={() => { setEditing(null); setDialogOpen(true); }} sx={{ ml: 'auto', flexShrink: 0 }}>
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer>
          <Table sx={{ whiteSpace: 'nowrap' }}>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="h6">Princípio Ativo</Typography></TableCell>
                <TableCell><Typography variant="h6">Concentração</Typography></TableCell>
                <TableCell><Typography variant="h6">Forma</Typography></TableCell>
                <TableCell><Typography variant="h6">Classificações</Typography></TableCell>
                <TableCell align="center"><Typography variant="h6">Ações</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicines.map((m) => (
                <StyledTableRow key={m.id} hover>
                  <TableCell>{m.active_ingredient}</TableCell>
                  <TableCell title={m.concentration}>{truncate(m.concentration, 30)}</TableCell>
                  <TableCell>{m.pharmaceutical_form}</TableCell>
                  <TableCell title={renderTags(m)}>{truncate(renderTags(m), 60)}</TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="contained" onClick={() => { setEditing(m); setDialogOpen(true); }} sx={{ mr: 1 }}>
                      <FeatherIcon icon="edit" width="16" height="16" />
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={() => setConfirmDialog({
                        isOpen: true,
                        title: `Remover ${m.active_ingredient}?`,
                        subTitle: 'Esta ação não pode ser desfeita.',
                        confirm: removeMedicineFetch(m.id),
                      })}
                    >
                      <FeatherIcon icon="trash" width="16" height="16" />
                    </Button>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={pagination?.total || 0}
            page={page}
            onPageChange={handlePage}
            rowsPerPage={perPage}
            onRowsPerPageChange={handlePerPage}
            rowsPerPageOptions={PER_PAGE_OPTIONS}
            labelRowsPerPage="Itens por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
          />
        </TableContainer>

        <MedicineDialog open={dialogOpen} onClose={() => setDialogOpen(false)} medicine={editing} onSuccess={onSuccess} />
        <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
      </BaseCard>
    </Box>
  );
}


