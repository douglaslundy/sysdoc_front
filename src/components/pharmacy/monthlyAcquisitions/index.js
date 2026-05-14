import React, { useEffect, useState } from 'react';
import { Box, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
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

const formatUnit = (value) => {
    if (!value) return '-';
    const unit = String(value).trim().toLowerCase();
    if (unit === 'un' || unit === 'unit') return 'Unidade';
    return value;
};

export default function MonthlyAcquisitionsManager() {
    const dispatch = useDispatch();
    const { monthlyAcquisitions } = useSelector(state => state.medicineMonthlyAcquisitions);
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

    const formatMonthMask = (value) => {
        const cleaned = String(value || '').replace(/\D/g, '').slice(0, 6);
        if (cleaned.length <= 2) return cleaned;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    };

    useEffect(() => {
        dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
        return () => {
            dispatch(clearMedicinesState());
            dispatch(clearMonthlyAcquisitionsState());
            dispatch(clearAlertMessages());
            dispatch(clearMessages());
        };
    }, []);

    useEffect(() => {
        const apiMonth = toApiMonth(referenceMonth);
        if (!apiMonth) return;
        dispatch(getMonthlyAcquisitions({ reference_month: apiMonth, per_page: 200 }));
    }, [referenceMonth]);

    const onSuccess = () => {
        setDialogOpen(false);
        const apiMonth = toApiMonth(referenceMonth);
        if (!apiMonth) return;
        dispatch(getMonthlyAcquisitions({ reference_month: apiMonth, per_page: 200 }));
    };

    return (
        <BaseCard title="Aquisições Mensais de Medicamentos">
            <AlertModal />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1, flexWrap: 'wrap' }}>
                <TextField
                    label="Mês de referência"
                    value={referenceMonth}
                    onChange={(e) => setReferenceMonth(formatMonthMask(e.target.value))}
                    helperText="MM/AAAA"
                    inputProps={{ maxLength: 7, inputMode: 'numeric', placeholder: 'MM/AAAA' }}
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
                            <TableCell><Typography variant="h6">Qtd.</Typography></TableCell>
                            <TableCell><Typography variant="h6">Unidade</Typography></TableCell>
                            <TableCell><Typography variant="h6">Origem</Typography></TableCell>
                            <TableCell><Typography variant="h6">Observação</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {monthlyAcquisitions.map((s) => (
                            <TableRow key={s.id} hover>
                                <TableCell>{s.medicine_item?.active_ingredient} ({s.medicine_item?.internal_code})</TableCell>
                                <TableCell>{s.acquired_quantity}</TableCell>
                                <TableCell>{formatUnit(s.unit_measure)}</TableCell>
                                <TableCell>{s.source_document || '-'}</TableCell>
                                <TableCell>{s.note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <MedicineMonthlyAcquisitionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
        </BaseCard>
    );
}


