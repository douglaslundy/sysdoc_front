import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, styled } from '@mui/material';
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
  const searchRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

  useEffect(() => {
    dispatch(getAllMedicines());
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
      dispatch(clearMedicinesState());
      dispatch(clearAlertMessages());
      dispatch(clearMessages());
    };
  }, [dispatch]);

  const handleSearch = ({ target }) => {
    const value = target.value;
    setSearch(value);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      dispatch(getAllMedicines({ search: value || undefined }));
    }, 400);
  };

  const onSuccess = () => {
    setDialogOpen(false);
    dispatch(getAllMedicines({ search: search || undefined }));
  };

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title={`Medicamentos${pagination ? ` - ${pagination.total} registros` : ''}`}>
        <AlertModal />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto', md: 'minmax(280px, 1fr) auto' },
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
            sx={{ minWidth: 0, width: '100%' }}
          />
          <Fab color="primary" size="medium" onClick={() => { setEditing(null); setDialogOpen(true); }} sx={{ justifySelf: { xs: 'flex-end', sm: 'center' } }}>
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
                <TableCell><Typography variant="h6">Gratuito</Typography></TableCell>
                <TableCell><Typography variant="h6">Ativo</Typography></TableCell>
                <TableCell align="center"><Typography variant="h6">Ações</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicines.map((m) => (
                <StyledTableRow key={m.id} hover>
                  <TableCell>{m.active_ingredient}</TableCell>
                  <TableCell>{m.concentration}</TableCell>
                  <TableCell>{m.pharmaceutical_form}</TableCell>
                  <TableCell>{m.is_free_distribution ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>{m.active ? 'Sim' : 'Não'}</TableCell>
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
        </TableContainer>

        <MedicineDialog open={dialogOpen} onClose={() => setDialogOpen(false)} medicine={editing} onSuccess={onSuccess} />
        <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
      </BaseCard>
    </Box>
  );
}