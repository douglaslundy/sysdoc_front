import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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
    const theme = useTheme();
    const [data, setData] = useState({ items: [], reference_month: '', last_update_at: null });

    useEffect(() => {
        api.get('/public/pharmacy/medicines/monthly-acquisitions')
            .then((res) => setData(res.data))
            .catch(() => {});
    }, []);

    return (
        <Box sx={{ p: 3, minHeight: '100vh', color: 'var(--lg-text-primary)' }}>
            <Typography variant="h3" sx={{ mb: 1, color: 'text.primary', fontWeight: 700 }}>Transparência da Farmácia - Aquisições Mensais</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Mês de referência: {formatMonth(data.reference_month)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <TableContainer sx={{ background: 'var(--lg-glass-panel)', border: '0.5px solid var(--lg-border)', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Medicamento</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Quantidade</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Unidade</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Origem</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Observação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.items.length === 0 && (
                            <TableRow>
                                <TableCell sx={{ color: 'text.secondary' }} colSpan={5}>Nenhum registro disponível.</TableCell>
                            </TableRow>
                        )}
                        {data.items.map((item, idx) => (
                            <TableRow key={`${item.medicine_id}-${idx}`} sx={{ '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}>
                                <TableCell sx={{ color: 'text.primary' }}>{item.active_ingredient} ({item.internal_code})</TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>{item.acquired_quantity}</TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>{formatUnit(item.unit_measure)}</TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>{item.source_document || '-'}</TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>{item.note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
