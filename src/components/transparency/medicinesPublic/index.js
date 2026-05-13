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
        <Box sx={{ p: 2 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Transparência da Farmácia - Medicamentos Diários</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Medicamento</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Distribuição Gratuita</TableCell>
                            <TableCell>Observação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.items.map((item, idx) => (
                            <TableRow key={`${item.medicine_id}-${idx}`}>
                                <TableCell>{item.active_ingredient} ({item.internal_code})</TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.availability_status === 'available' ? 'Disponível' : 'Indisponível'}
                                        color={item.availability_status === 'available' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{item.is_free_distribution ? 'Sim' : 'Não'}</TableCell>
                                <TableCell>{item.public_note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
