import React, { useEffect, useState } from 'react';
import { Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../../../services/api';

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

export default function MedicinesPublicList() {
    const [data, setData] = useState({ items: [], reference_date: '', last_update_at: null });

    useEffect(() => {
        api.get('/public/pharmacy/medicines/daily')
            .then((res) => setData(res.data))
            .catch(() => {});
    }, []);

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#0b1220', color: '#e2e8f0' }}>
            <Typography variant="h3" sx={{ mb: 1, color: '#f8fafc', fontWeight: 700 }}>Transparência da Farmácia - Medicamentos Diários</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#94a3b8' }}>
                Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <TableContainer sx={{ border: '1px solid #1e293b', borderRadius: 2, bgcolor: '#0f172a' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#111827' }}>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Medicamento</TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Distribuição Gratuita</TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>Observação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.items.length === 0 && (
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8' }} colSpan={4}>Nenhum registro disponível.</TableCell>
                            </TableRow>
                        )}
                        {data.items.map((item, idx) => (
                            <TableRow key={`${item.medicine_id}-${idx}`} sx={{ '&:nth-of-type(odd)': { bgcolor: '#111827' } }}>
                                <TableCell sx={{ color: '#e2e8f0' }}>{item.active_ingredient} ({item.internal_code})</TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.availability_status === 'available' ? 'Disponível' : 'Indisponível'}
                                        color={item.availability_status === 'available' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ color: '#e2e8f0' }}>{item.is_free_distribution ? 'Sim' : 'Não'}</TableCell>
                                <TableCell sx={{ color: '#e2e8f0' }}>{item.public_note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
