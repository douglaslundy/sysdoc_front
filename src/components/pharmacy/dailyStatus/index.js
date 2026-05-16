import React, { useEffect, useState } from 'react';
import { Box, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
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

const statusLabel = (status) => status === 'available' ? 'Disponível' : 'Indisponível';

const formatDate = (value) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
};

export default function DailyStatusManager() {
    const dispatch = useDispatch();
    const { dailyStatuses } = useSelector(state => state.medicineDailyStatuses);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
        return () => {
            dispatch(clearMedicinesState());
            dispatch(clearDailyStatusesState());
            dispatch(clearAlertMessages());
            dispatch(clearMessages());
        };
    }, []);

    useEffect(() => {
        dispatch(getDailyStatuses({ reference_date: referenceDate, per_page: 200 }));
    }, [referenceDate]);

    const onSuccess = () => {
        setDialogOpen(false);
        dispatch(getDailyStatuses({ reference_date: referenceDate, per_page: 200 }));
    };

    return (
        <BaseCard title="Status Diário de Medicamentos">
            <AlertModal />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1, flexWrap: 'wrap' }}>
                <TextField
                    className="lg-search-field"
                    placeholder="Data de referência"
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <Fab color="primary" size="medium" onClick={() => setDialogOpen(true)}>
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
                            <TableRow key={s.id} hover>
                                <TableCell>{s.medicine_item?.active_ingredient} ({s.medicine_item?.internal_code})</TableCell>
                                <TableCell>{statusLabel(s.availability_status)}</TableCell>
                                <TableCell>{s.available_quantity ?? '-'}</TableCell>
                                <TableCell>{formatDate(s.restock_forecast_date)}</TableCell>
                                <TableCell>{s.public_note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <MedicineDailyStatusDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
        </BaseCard>
    );
}
