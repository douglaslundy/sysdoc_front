import React, { useEffect, useState } from 'react';
import InputMask from 'react-input-mask';
import { Box, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, styled } from '@mui/material';
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

const formatUnit = (value) => {
  if (!value) return '-';
  const unit = String(value).trim().toLowerCase();
  if (unit === 'un' || unit === 'unit') return 'Unidade';
  return value;
};

export default function MonthlyAcquisitionsManager() {
  const StyledTableRow = styled(TableRow)(() => ({
    '&:nth-of-type(odd)': {
      backgroundColor: 'var(--lg-glass-row-hover)',
    },
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));

  const dispatch = useDispatch();
  const { monthlyAcquisitions } = useSelector((state) => state.medicineMonthlyAcquisitions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const now = new Date();
  const defaultMaskedMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [referenceMonth, setReferenceMonth] = useState(defaultMaskedMonth);

  const toApiMonth = (maskedMonth) => {
    const cleaned = String(maskedMonth || '').replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6) return null;
    const month = cleaned.slice(0, 2);
    const year = cleaned.slice(2, 6);
    const monthNum = Number(month);
    if (monthNum < 1 || monthNum > 12) return null;
    return `${year}-${month}`;
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
    dispatch(getMonthlyAcquisitions({ reference_month: apiMonth, per_page: 200 }));
  }, [referenceMonth, dispatch]);

  const onSuccess = () => {
    setDialogOpen(false);
    const apiMonth = toApiMonth(referenceMonth);
    if (!apiMonth) return;
    dispatch(getMonthlyAcquisitions({ reference_month: apiMonth, per_page: 200 }));
  };

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title="Aquisições Mensais de Medicamentos">
        <AlertModal />
        <Box
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
            onChange={(e) => setReferenceMonth(e.target.value)}
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
          <Fab
            color="primary"
            size="medium"
            onClick={() => setDialogOpen(true)}
            sx={{ justifySelf: { xs: 'flex-end', sm: 'center' }, mt: '2px' }}
          >
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer>
          <Table sx={{ whiteSpace: 'nowrap' }}>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="h6">Medicamento</Typography></TableCell>
                <TableCell><Typography variant="h6">Qtd.</Typography></TableCell>
                <TableCell><Typography variant="h6">Unidade</Typography></TableCell>
                <TableCell><Typography variant="h6">Origem</Typography></TableCell>
                <TableCell><Typography variant="h6">Observação</Typography></TableCell>
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
        </TableContainer>

        <MedicineMonthlyAcquisitionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
      </BaseCard>
    </Box>
  );
}