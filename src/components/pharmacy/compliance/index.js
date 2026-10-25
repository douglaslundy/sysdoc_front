import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from '../../messagesModal';
import { getMedicineCompliance } from '../../../store/fetchActions/medicineCompliance';
import { clearMedicineComplianceState } from '../../../store/ducks/medicineCompliance';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { CabecalhoDePagina } from '../../ui/cabecalho-de-pagina';
import { StatCard } from '../../ui/stat-card';

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
        <StatCard
            titulo={title}
            valor={value ?? '-'}
            legenda={(
                <>
                    {subtitle}
                    {hint ? <span className="mt-1 block text-[11px]">{hint}</span> : null}
                </>
            )}
        />
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
        <div className="pharmacy-compliance-page">
            <CabecalhoDePagina titulo="Compliance da Farmácia" />
            <AlertModal />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            </div>
        </div>
    );
}
