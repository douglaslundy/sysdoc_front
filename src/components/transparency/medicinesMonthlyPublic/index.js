import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../../../services/api';

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

export default function MedicinesMonthlyPublicList() {
    const [data, setData] = useState({ items: [], reference_month: '', last_update_at: null });

    useEffect(() => {
        api.get('/public/pharmacy/medicines/monthly-acquisitions')
            .then((res) => setData(res.data))
            .catch(() => {});
    }, []);

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#0b1220', color: '#e2e8f0' }}>
            <Typography variant="h3" sx={{ mb: 1, color: '#f8fafc', fontWeight: 700 }}>Transparência da Farmácia - Aquisições Mensais</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#94a3b8' }}>
                Mês de referência: {formatMonth(data.reference_month)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <TableContainer sx={{ border: '1px solid #1e293b', borderRadius: 2, bgcolor: '#0f172a' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#111827' }}>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Medicamento</TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Quantidade</TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Unidade</TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Origem</TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Observação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.items.length === 0 && (
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8' }} colSpan={5}>Nenhum registro disponível.</TableCell>
                            </TableRow>
                        )}
                        {data.items.map((item, idx) => (
                            <TableRow key={`${item.medicine_id}-${idx}`} sx={{ '&:nth-of-type(odd)': { bgcolor: '#111827' } }}>
                                <TableCell sx={{ color: '#e2e8f0' }}>{item.active_ingredient} ({item.internal_code})</TableCell>
                                <TableCell sx={{ color: '#e2e8f0' }}>{item.acquired_quantity}</TableCell>
                                <TableCell sx={{ color: '#e2e8f0' }}>{formatUnit(item.unit_measure)}</TableCell>
                                <TableCell sx={{ color: '#e2e8f0' }}>{item.source_document || '-'}</TableCell>
                                <TableCell sx={{ color: '#e2e8f0' }}>{item.note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

