import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
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

export default function MedicinesPanel() {
    const [data, setData] = useState({ items: [], reference_date: '', last_update_at: null });

    const loadData = () => {
        api.get('/public/pharmacy/medicines/panel')
            .then((res) => setData(res.data))
            .catch(() => {});
    };

    useEffect(() => {
        loadData();
        const timer = setInterval(loadData, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Box sx={{ p: 3, background: '#0b1220', minHeight: '100vh', color: '#e2e8f0' }}>
            <Typography variant="h2" sx={{ mb: 1, color: '#f8fafc', fontWeight: 700 }}>Painel de Disponibilidade de Medicamentos</Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <Grid container spacing={2}>
                {data.items.length === 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#0f172a', color: '#94a3b8', border: '1px solid #1e293b' }}>
                            Nenhum registro disponível.
                        </Paper>
                    </Grid>
                )}
                {data.items.map((item, idx) => (
                    <Grid item xs={12} md={6} lg={4} key={`${item.medicine_id}-${idx}`}>
                        <Paper sx={{ p: 2, bgcolor: '#0f172a', color: '#e2e8f0', border: '1px solid #1e293b', borderLeft: item.availability_status === 'available' ? '6px solid #22c55e' : '6px solid #ef4444' }}>
                            <Typography variant="h5" sx={{ color: '#f8fafc' }}>{item.active_ingredient}</Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>{item.pharmaceutical_form} - {item.presentation}</Typography>
                            <Typography variant="body1" sx={{ mt: 1, fontWeight: 700, color: item.availability_status === 'available' ? '#86efac' : '#fca5a5' }}>
                                {item.availability_status === 'available' ? 'DISPONÍVEL' : 'INDISPONÍVEL'}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
