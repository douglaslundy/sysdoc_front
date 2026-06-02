import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Fab, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { useDispatch, useSelector } from 'react-redux';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import MedicineDailyStatusDialog from '../../modal/medicineDailyStatus';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';
import { getDailyStatuses } from '../../../store/fetchActions/medicineDailyStatuses';
import { clearMedicinesState } from '../../../store/ducks/medicines';
import { clearDailyStatusesState } from '../../../store/ducks/medicineDailyStatuses';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const statusLabel = (status) => {
  if (status === 'available') return 'Disponível';
  if (status === 'unavailable') return 'Indisponível';
  return 'Sem lançamento';
};

const formatDate = (value) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const truncate = (value, max = 40) => {
  const text = String(value || '');
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

const localDate = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export default function DailyStatusManager() {
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

  const dispatch = useDispatch();
  const { dailyStatuses, pagination } = useSelector((state) => state.medicineDailyStatuses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [referenceDate, setReferenceDate] = useState(localDate());
  const [search, setSearch] = useState('');
  const [includeAll, setIncludeAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const searchRef = useRef(null);
  const totalCount = Number(pagination?.total || 0);
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / perPage) - 1);

  const buildParams = (overrides = {}) => ({
    reference_date: referenceDate,
    search: search || undefined,
    include_all: includeAll ? 1 : undefined,
    availability_status: (includeAll && statusFilter) ? statusFilter : undefined,
    page: page + 1,
    per_page: perPage,
    ...overrides,
  });

  useEffect(() => {
    dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
      dispatch(clearMedicinesState());
      dispatch(clearDailyStatusesState());
      dispatch(clearAlertMessages());
      dispatch(clearMessages());
    };
  }, [dispatch]);

  const handleStatusFilter = ({ target }) => {
    const value = target.value;
    setStatusFilter(value);
    setPage(0);
    dispatch(getDailyStatuses(buildParams({ availability_status: value || undefined, page: 1 })));
  };

  useEffect(() => {
    dispatch(getDailyStatuses(buildParams({ page: 1 })));
  }, [referenceDate, includeAll, dispatch]);

  useEffect(() => {
    if (!includeAll) setStatusFilter('');
  }, [includeAll]);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  useEffect(() => {
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
      dispatch(getDailyStatuses(buildParams({ page: lastPageIndex + 1 })));
    }
  }, [page, lastPageIndex, dispatch]);

  const handleSearch = ({ target }) => {
    const value = target.value;
    setSearch(value);
    setPage(0);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      dispatch(getDailyStatuses(buildParams({ search: value || undefined, page: 1 })));
    }, 400);
  };

  const handleReferenceDate = ({ target }) => {
    setReferenceDate(target.value);
    setPage(0);
  };

  const handleToggleIncludeAll = () => {
    setIncludeAll((current) => !current);
    setPage(0);
  };

  const handlePerPage = (event) => {
    const value = Number(event.target.value);
    setPerPage(value);
    setPage(0);
    dispatch(getDailyStatuses(buildParams({ per_page: value, page: 1 })));
  };

  const handlePage = (_, newPage) => {
    setPage(newPage);
    dispatch(getDailyStatuses(buildParams({ page: newPage + 1 })));
  };

  const onSuccess = () => {
    setDialogOpen(false);
    dispatch(getDailyStatuses(buildParams()));
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page pharmacy-dailystatus-page">
      <BaseCard title={`Status Diário de Medicamentos${pagination ? ` - ${pagination.total} registros` : ''}`}>
        <AlertModal />
        <Box className="queue-page__toolbar"
          sx={{
            display: 'grid',
            gridTemplateColumns: includeAll
              ? { xs: '1fr', sm: '1fr 1fr', md: 'minmax(160px, 190px) minmax(220px, 1fr) minmax(150px, 170px) auto auto' }
              : { xs: '1fr', sm: '1fr 1fr', md: 'minmax(160px, 190px) minmax(240px, 1fr) auto auto' },
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            mt: 1,
          }}
        >
          <TextField
            className="lg-search-field"
            placeholder="Data de referência"
            type="date"
            value={referenceDate}
            onChange={handleReferenceDate}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 0, width: '100%' }}
          />
          <TextField
            className="lg-search-field"
            placeholder="Pesquisar medicamento"
            value={search}
            onChange={handleSearch}
            inputProps={{ autoComplete: 'off' }}
            sx={{ minWidth: 0, width: '100%' }}
          />
          {includeAll && (
            <FormControl className="lg-search-field" size="small" sx={{ minWidth: 0, width: '100%' }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={handleStatusFilter}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="available">Disponível</MenuItem>
                <MenuItem value="unavailable">Indisponível</MenuItem>
                <MenuItem value="no_record">Sem lançamento</MenuItem>
              </Select>
            </FormControl>
          )}
          <Button
            variant={includeAll ? 'contained' : 'outlined'}
            onClick={handleToggleIncludeAll}
            startIcon={<FeatherIcon icon="list" width="16" height="16" />}
            sx={{
              whiteSpace: 'nowrap',
              justifySelf: { xs: 'stretch', md: 'center' },
              height: 48,
              minHeight: 48,
            }}
          >
            Exibir todos
          </Button>
          <Fab className="queue-page__fab queue-page__fab--add"
            color="primary"
            size="small"
            onClick={() => setDialogOpen(true)}
            sx={{ justifySelf: { xs: 'flex-end', sm: 'center' }, width: 48, height: 48, minHeight: 48 }}
          >
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6">Medicamento</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Concentração</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Status</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Quantidade</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Reposição</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Observação</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyStatuses.map((s) => (
                <StyledTableRow key={s.id || `medicine-${s.medicine_item_id}`} hover>
                  <TableCell title={s.medicine_item?.active_ingredient || ''}>
                    {truncate(s.medicine_item?.active_ingredient, 40)}
                  </TableCell>
                  <TableCell title={s.medicine_item?.concentration || ''}>
                    {truncate(s.medicine_item?.concentration, 30) || '-'}
                  </TableCell>
                  <TableCell>{statusLabel(s.availability_status)}</TableCell>
                  <TableCell>{s.available_quantity ?? '-'}</TableCell>
                  <TableCell>{formatDate(s.restock_forecast_date)}</TableCell>
                  <TableCell>{s.public_note || '-'}</TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            className="queue-page__pagination"
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handlePage}
            rowsPerPage={perPage}
            onRowsPerPageChange={handlePerPage}
            rowsPerPageOptions={PER_PAGE_OPTIONS}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count.toLocaleString('pt-BR')}`}
          />
        </TableContainer>

        <MedicineDailyStatusDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
      </BaseCard>
    </Box>
  );
}
