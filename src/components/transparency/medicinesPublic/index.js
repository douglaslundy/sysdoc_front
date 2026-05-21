import React, { useEffect, useState } from 'react';
import { Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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
    const theme = useTheme();
    const [data, setData] = useState({ items: [], reference_date: '', last_update_at: null });

    useEffect(() => {
        api.get('/public/pharmacy/medicines/daily')
            .then((res) => setData(res.data))
            .catch(() => {});
    }, []);

    return (
        <Box sx={{ p: 3, minHeight: '100vh', color: 'var(--lg-text-primary)' }}>
            <Typography variant="h3" sx={{ mb: 1, color: 'text.primary', fontWeight: 700 }}>Transparência da Farmácia - Medicamentos Diários</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <TableContainer sx={{ background: 'var(--lg-glass-panel)', border: '0.5px solid var(--lg-border)', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Medicamento</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Distribuição Gratuita</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>Observação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.items.length === 0 && (
                            <TableRow>
                                <TableCell sx={{ color: 'text.secondary' }} colSpan={4}>Nenhum registro disponível.</TableCell>
                            </TableRow>
                        )}
                        {data.items.map((item, idx) => (
                            <TableRow key={`${item.medicine_id}-${idx}`} sx={{ '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}>
                                <TableCell sx={{ color: 'text.primary' }}>{item.active_ingredient} {item.concentration}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.availability_status === 'available' ? 'Disponível' : 'Indisponível'}
                                        color={item.availability_status === 'available' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>{item.is_free_distribution ? 'Sim' : 'Não'}</TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>{item.public_note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
