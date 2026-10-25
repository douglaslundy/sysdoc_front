import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import PublicThemeToggle from '../PublicThemeToggle';
import { DataTable } from '../../ui/data-table';
import { Pilula } from '../../ui/pilula';

const formatDate = (value) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
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

const colunas = [
    { chave: 'medicamento', titulo: 'Medicamento', render: (item) => `${item.active_ingredient ?? ''} ${item.concentration ?? ''}`.trim() },
    {
        chave: 'status',
        titulo: 'Status',
        render: (item) => (
            <Pilula tom={item.availability_status === 'available' ? 'sucesso' : 'perigo'}>
                {item.availability_status === 'available' ? 'Disponível' : 'Indisponível'}
            </Pilula>
        ),
    },
    { chave: 'gratuita', titulo: 'Distribuição Gratuita', render: (item) => (item.is_free_distribution ? 'Sim' : 'Não') },
    { chave: 'obs', titulo: 'Observação', render: (item) => item.public_note || '-' },
];

export default function MedicinesPublicList() {
    const [data, setData] = useState({ items: [], reference_date: '', last_update_at: null });

    useEffect(() => {
        api.get('/public/pharmacy/medicines/daily')
            .then((res) => setData(res.data))
            .catch(() => {});
    }, []);

    return (
        <main className="min-h-screen p-4 sm:p-6">
            <PublicThemeToggle />
            <h1 className="mb-1 pr-12 font-display text-2xl leading-tight font-extrabold sm:text-3xl">Transparência da Farmácia - Medicamentos Diários</h1>
            <p className="mb-4 text-sm text-muted-foreground">
                Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
            </p>
            <DataTable
                rotulo="medicamentos diários"
                colunas={colunas}
                linhas={data.items}
                chaveDaLinha={(item) => `${item.medicine_id}-${item.active_ingredient}-${item.concentration}`}
                vazio="Nenhum registro disponível."
            />
        </main>
    );
}
