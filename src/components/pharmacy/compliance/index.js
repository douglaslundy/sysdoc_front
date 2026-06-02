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

function Item({ title, value, subtitle, hint }) {
    return (
        <Grid item xs={12} md={6} lg={4}>
            <BaseCard title={title}>
                <Box sx={{ minHeight: 96, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography className="pharmacy-compliance__value" variant="h4" sx={{ fontSize: 34, lineHeight: 1.1 }}>
                        {value ?? '-'}
                    </Typography>
                    {subtitle ? (
                        <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>
                            {subtitle}
                        </Typography>
                    ) : (
                        <Box sx={{ mt: 1 }} />
                    )}
                    {hint ? (
                        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
                            {hint}
                        </Typography>
                    ) : (
                        <Box sx={{ mt: 0.5 }} />
                    )}
                </Box>
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
        <Box sx={modalFormRootSx} className="queue-page pharmacy-compliance-page">
            <BaseCard title="Compliance da Farmácia">
                <AlertModal />
                <Grid container spacing={2} sx={{ pb: '10px' }}>
                    <Item
                        title="Data de Referência de Hoje"
                        value={formatDate(data.today_reference_date)}
                        subtitle={`Mês de referência: ${formatMonth(data.month_reference)}`}
                        hint="Base para cálculo de conformidade diária."
                    />
                    <Item
                        title="Mês de Referência"
                        value={formatMonth(data.month_reference)}
                        subtitle={`Data de hoje: ${formatDate(data.today_reference_date)}`}
                        hint="Período considerado para consolidação."
                    />
                    <Item
                        title="Atualizações Diárias (Dias)"
                        value={data.daily_updates_days_count}
                        subtitle={`Dias esperados: ${data.daily_updates_expected_days_count ?? '-'}`}
                        hint="Quantidade de dias com lançamento de status."
                    />
                    <Item
                        title="Dias Esperados (Mês Atual)"
                        value={data.daily_updates_expected_days_count}
                        subtitle={`Atualizados: ${data.daily_updates_days_count ?? '-'}`}
                        hint="Dias úteis de monitoramento no mês."
                    />
                    <Item
                        title="Total de Aquisições Mensais"
                        value={data.monthly_acquisitions_count}
                        subtitle={`Mês: ${formatMonth(data.month_reference)}`}
                        hint="Registros de aquisições consolidados."
                    />
                    <Item
                        title="Possui Atualização Hoje"
                        value={data.has_today_update ? 'Sim' : 'Não'}
                        subtitle={`Data referência: ${formatDate(data.today_reference_date)}`}
                        hint={data.has_today_update ? 'Lançamento do dia encontrado.' : 'Sem lançamento do dia até o momento.'}
                    />
                </Grid>
            </BaseCard>
        </Box>
    );
}
