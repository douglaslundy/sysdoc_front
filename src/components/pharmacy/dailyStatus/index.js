import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
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

export default function DailyStatusManager() {
  const StyledTableRow = styled(TableRow)(() => ({
    '&:nth-of-type(odd)': {
      backgroundColor: 'var(--lg-glass-row-hover)',
    },
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));

  const dispatch = useDispatch();
  const { dailyStatuses, pagination } = useSelector((state) => state.medicineDailyStatuses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [includeAll, setIncludeAll] = useState(false);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const searchRef = useRef(null);

  const buildParams = (overrides = {}) => ({
    reference_date: referenceDate,
    search: search || undefined,
    include_all: includeAll ? 1 : undefined,
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

  useEffect(() => {
    dispatch(getDailyStatuses(buildParams({ page: 1 })));
  }, [referenceDate, includeAll, dispatch]);

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
    <Box sx={modalFormRootSx}>
      <BaseCard title="Status Diário de Medicamentos">
        <AlertModal />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '180px minmax(260px, 1fr) auto auto' },
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
          <Button
            variant={includeAll ? 'contained' : 'outlined'}
            onClick={handleToggleIncludeAll}
            startIcon={<FeatherIcon icon="list" width="16" height="16" />}
            sx={{ whiteSpace: 'nowrap', justifySelf: { xs: 'stretch', md: 'center' } }}
          >
            Exibir todos
          </Button>
          <Fab
            color="primary"
            size="medium"
            onClick={() => setDialogOpen(true)}
            sx={{ justifySelf: { xs: 'flex-end', sm: 'center' } }}
          >
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer>
          <Table sx={{ whiteSpace: 'nowrap' }}>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="h6">Medicamento</Typography></TableCell>
                <TableCell><Typography variant="h6">Status</Typography></TableCell>
                <TableCell><Typography variant="h6">Quantidade</Typography></TableCell>
                <TableCell><Typography variant="h6">Reposição</Typography></TableCell>
                <TableCell><Typography variant="h6">Observação</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyStatuses.map((s) => (
                <StyledTableRow key={s.id || `medicine-${s.medicine_item_id}`} hover>
                  <TableCell>{s.medicine_item?.active_ingredient} {s.medicine_item?.concentration}</TableCell>
                  <TableCell>{statusLabel(s.availability_status)}</TableCell>
                  <TableCell>{s.available_quantity ?? '-'}</TableCell>
                  <TableCell>{formatDate(s.restock_forecast_date)}</TableCell>
                  <TableCell>{s.public_note || '-'}</TableCell>
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
          />
        </TableContainer>

        <MedicineDailyStatusDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
      </BaseCard>
    </Box>
  );
}
