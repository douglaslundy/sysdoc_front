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
        <Box sx={{ p: 2 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Transparência da Farmácia - Aquisições Mensais</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Mês de referência: {formatMonth(data.reference_month)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Medicamento</TableCell>
                            <TableCell>Quantidade</TableCell>
                            <TableCell>Unidade</TableCell>
                            <TableCell>Origem</TableCell>
                            <TableCell>Observação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.items.map((item, idx) => (
                            <TableRow key={`${item.medicine_id}-${idx}`}>
                                <TableCell>{item.active_ingredient} ({item.internal_code})</TableCell>
                                <TableCell>{item.acquired_quantity}</TableCell>
                                <TableCell>{formatUnit(item.unit_measure)}</TableCell>
                                <TableCell>{item.source_document || '-'}</TableCell>
                                <TableCell>{item.note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

