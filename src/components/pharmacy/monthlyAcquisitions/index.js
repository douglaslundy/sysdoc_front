import React, { useEffect, useState } from 'react';
import InputMask from 'react-input-mask';
import { Box, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { useDispatch, useSelector } from 'react-redux';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import MedicineMonthlyAcquisitionDialog from '../../modal/medicineMonthlyAcquisition';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';
import { getMonthlyAcquisitions } from '../../../store/fetchActions/medicineMonthlyAcquisitions';
import { clearMedicinesState } from '../../../store/ducks/medicines';
import { clearMonthlyAcquisitionsState } from '../../../store/ducks/medicineMonthlyAcquisitions';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const formatUnit = (value) => {
  if (!value) return '-';
  const unit = String(value).trim().toLowerCase();
  if (unit === 'un' || unit === 'unit') return 'Unidade';
  return value;
};

export default function MonthlyAcquisitionsManager() {
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
  const { monthlyAcquisitions, pagination } = useSelector((state) => state.medicineMonthlyAcquisitions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const now = new Date();
  const defaultMaskedMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [referenceMonth, setReferenceMonth] = useState(defaultMaskedMonth);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const totalCount = Number(pagination?.total || 0);
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / perPage) - 1);

  const toApiMonth = (maskedMonth) => {
    const cleaned = String(maskedMonth || '').replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6) return null;
    const month = cleaned.slice(0, 2);
    const year = cleaned.slice(2, 6);
    const monthNum = Number(month);
    if (monthNum < 1 || monthNum > 12) return null;
    return `${year}-${month}`;
  };

  const buildParams = (overrides = {}) => {
    const apiMonth = toApiMonth(referenceMonth);

    return {
      reference_month: apiMonth || undefined,
      page: page + 1,
      per_page: perPage,
      ...overrides,
    };
  };

  useEffect(() => {
    dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
    return () => {
      dispatch(clearMedicinesState());
      dispatch(clearMonthlyAcquisitionsState());
      dispatch(clearAlertMessages());
      dispatch(clearMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    const apiMonth = toApiMonth(referenceMonth);
    if (!apiMonth) return;
    dispatch(getMonthlyAcquisitions(buildParams({ reference_month: apiMonth, page: 1 })));
  }, [referenceMonth, dispatch]);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  useEffect(() => {
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
      dispatch(getMonthlyAcquisitions(buildParams({ page: lastPageIndex + 1 })));
    }
  }, [page, lastPageIndex, dispatch]);

  const handleReferenceMonth = (event) => {
    setReferenceMonth(event.target.value);
    setPage(0);
  };

  const handlePerPage = (event) => {
    const value = Number(event.target.value);
    setPerPage(value);
    setPage(0);
    dispatch(getMonthlyAcquisitions(buildParams({ per_page: value, page: 1 })));
  };

  const handlePage = (_, newPage) => {
    setPage(newPage);
    dispatch(getMonthlyAcquisitions(buildParams({ page: newPage + 1 })));
  };

  const onSuccess = () => {
    setDialogOpen(false);
    const apiMonth = toApiMonth(referenceMonth);
    if (!apiMonth) return;
    dispatch(getMonthlyAcquisitions(buildParams({ reference_month: apiMonth })));
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page pharmacy-monthly-page">
      <BaseCard title="Aquisições Mensais de Medicamentos">
        <AlertModal />
        <Box className="queue-page__toolbar"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto', md: 'minmax(240px, 1fr) auto' },
            alignItems: 'start',
            gap: 1.5,
            mb: 2,
            mt: 1,
          }}
        >
          <InputMask
            mask="99/9999"
            value={referenceMonth}
            onChange={handleReferenceMonth}
          >
            {(inputProps) => (
              <TextField
                {...inputProps}
                className="lg-search-field"
                placeholder="MM/AAAA"
                inputProps={{ ...inputProps.inputProps, inputMode: 'numeric' }}
                sx={{ minWidth: 0, width: '100%' }}
              />
            )}
          </InputMask>
          <Fab className="queue-page__fab queue-page__fab--add"
            color="primary"
            size="medium"
            onClick={() => setDialogOpen(true)}
            sx={{ justifySelf: { xs: 'flex-end', sm: 'center' }, mt: '2px' }}
          >
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6">Medicamento</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Qtd.</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Unidade</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Origem</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Observação</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyAcquisitions.map((s) => (
                <StyledTableRow key={s.id} hover>
                  <TableCell>{s.medicine_item?.active_ingredient} {s.medicine_item?.concentration}</TableCell>
                  <TableCell>{s.acquired_quantity}</TableCell>
                  <TableCell>{formatUnit(s.unit_measure)}</TableCell>
                  <TableCell>{s.source_document || '-'}</TableCell>
                  <TableCell>{s.note || '-'}</TableCell>
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
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                rowGap: 0.5,
                justifyContent: { xs: 'center', md: 'space-between' },
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                margin: 0,
              },
            }}
          />
        </TableContainer>

        <MedicineMonthlyAcquisitionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
      </BaseCard>
    </Box>
  );
}
