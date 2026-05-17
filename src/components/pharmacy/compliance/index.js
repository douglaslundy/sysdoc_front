import React, { useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import { getMedicineCompliance } from '../../../store/fetchActions/medicineCompliance';
import { clearMedicineComplianceState } from '../../../store/ducks/medicineCompliance';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const formatDate = (value) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
};

const formatMonth = (value) => {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return value || '-';
    const [year, month] = value.split('-');
    return `${month}/${year}`;
};

function Item({ title, value }) {
    return (
        <Grid item xs={12} md={6} lg={4}>
            <BaseCard title={title}>
                <Typography variant="h3">{value ?? '-'}</Typography>
            </BaseCard>
        </Grid>
    );
}

export default function MedicineComplianceDashboard() {
    const dispatch = useDispatch();
    const { data } = useSelector((state) => state.medicineCompliance);

    useEffect(() => {
        dispatch(getMedicineCompliance());
        return () => {
            dispatch(clearMedicineComplianceState());
            dispatch(clearAlertMessages());
            dispatch(clearMessages());
        };
    }, [dispatch]);

    return (
        <Box sx={modalFormRootSx}>
            <BaseCard title="Compliance da Farmácia">
                <AlertModal />
                <Grid container spacing={2}>
                    <Item title="Data de Referência de Hoje" value={formatDate(data.today_reference_date)} />
                    <Item title="Mês de Referência" value={formatMonth(data.month_reference)} />
                    <Item title="Atualizações Diárias (Dias)" value={data.daily_updates_days_count} />
                    <Item title="Dias Esperados (Mês Atual)" value={data.daily_updates_expected_days_count} />
                    <Item title="Total de Aquisições Mensais" value={data.monthly_acquisitions_count} />
                    <Item title="Possui Atualização Hoje" value={data.has_today_update ? 'Sim' : 'Não'} />
                </Grid>
            </BaseCard>
        </Box>
    );
}