import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import PublicThemeToggle from '../PublicThemeToggle';
import { DataTable } from '../../ui/data-table';

const formatMonth = (value) => {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return value || '-';
    const [year, month] = value.split('-');
    return `${month}/${year}`;
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatUnit = (value) => {
    if (!value) return '-';
    const unit = String(value).trim().toLowerCase();
    if (unit === 'un' || unit === 'unit') return 'Unidade';
    return value;
};

const colunas = [
    { chave: 'medicamento', titulo: 'Medicamento', render: (item) => `${item.active_ingredient ?? ''} ${item.concentration ?? ''}`.trim() },
    { chave: 'quantidade', titulo: 'Quantidade', render: (item) => item.acquired_quantity },
    { chave: 'unidade', titulo: 'Unidade', render: (item) => formatUnit(item.unit_measure) },
    { chave: 'origem', titulo: 'Origem', render: (item) => item.source_document || '-' },
    { chave: 'obs', titulo: 'Observação', render: (item) => item.note || '-' },
];

export default function MedicinesMonthlyPublicList() {
    const [data, setData] = useState({ items: [], reference_month: '', last_update_at: null });

    useEffect(() => {
        api.get('/public/pharmacy/medicines/monthly-acquisitions')
            .then((res) => setData(res.data))
            .catch(() => {});
    }, []);

    return (
        <main className="ui-reset min-h-screen p-4 sm:p-6">
            <PublicThemeToggle />
            <h1 className="mb-1 pr-12 font-display text-2xl leading-tight font-extrabold sm:text-3xl">Transparência da Farmácia - Aquisições Mensais</h1>
            <p className="mb-4 text-sm text-muted-foreground">
                Mês de referência: {formatMonth(data.reference_month)} | Última atualização: {formatDateTime(data.last_update_at)}
            </p>
            <DataTable
                rotulo="aquisições mensais"
                colunas={colunas}
                linhas={data.items}
                chaveDaLinha={(item) => `${item.medicine_id}-${item.active_ingredient}-${item.source_document}`}
                vazio="Nenhum registro disponível."
            />
        </main>
    );
}
