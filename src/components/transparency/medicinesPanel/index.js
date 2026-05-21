import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
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

export default function MedicinesPanel() {
    const theme = useTheme();
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
        <Box sx={{ p: 3, minHeight: '100vh', color: 'var(--lg-text-primary)' }}>
            <Typography variant="h2" sx={{ mb: 1, color: 'text.primary', fontWeight: 700 }}>Painel de Disponibilidade de Medicamentos</Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
            </Typography>
            <Grid container spacing={2}>
                {data.items.length === 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, background: 'var(--lg-glass-panel)', color: 'var(--lg-text-secondary)', border: '0.5px solid var(--lg-border)' }}>
                            Nenhum registro disponível.
                        </Paper>
                    </Grid>
                )}
                {data.items.map((item, idx) => (
                    <Grid item xs={12} md={6} lg={4} key={`${item.medicine_id}-${idx}`}>
                        <Paper
                            sx={{
                                p: 2,
                                background: 'var(--lg-glass-panel)',
                                color: 'var(--lg-text-primary)',
                                border: '0.5px solid var(--lg-border)',
                                borderLeft: item.availability_status === 'available'
                                    ? `6px solid ${theme.palette.success.main}`
                                    : `6px solid ${theme.palette.error.main}`,
                            }}
                        >
                            <Typography variant="h5" sx={{ color: 'text.primary' }}>{item.active_ingredient} {item.concentration}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.pharmaceutical_form} - {item.presentation}</Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    mt: 1,
                                    fontWeight: 700,
                                    color: item.availability_status === 'available'
                                        ? alpha(theme.palette.success.main, 0.9)
                                        : alpha(theme.palette.error.main, 0.9),
                                }}
                            >
                                {item.availability_status === 'available' ? 'DISPONÍVEL' : 'INDISPONÍVEL'}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
