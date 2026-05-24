import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { api } from '../../../services/api';

const HEADER_HEIGHT = 124;
const COLUMN_HEADER_HEIGHT = 56;

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

    const sortedItems = [...data.items].sort((a, b) => {
        const first = `${a.active_ingredient || ''} ${a.concentration || ''}`;
        const second = `${b.active_ingredient || ''} ${b.concentration || ''}`;
        return first.localeCompare(second, 'pt-BR', { sensitivity: 'base' });
    });
    const availableItems = sortedItems.filter((item) => item.availability_status === 'available');
    const unavailableItems = sortedItems.filter((item) => item.availability_status !== 'available');
    const columns = [
        { title: 'Medicamentos disponíveis', items: availableItems, color: theme.palette.success.main },
        { title: 'Medicamentos indisponíveis', items: unavailableItems, color: theme.palette.error.main },
    ];

    const renderMedicineCard = (item, color) => (
        <Paper
            key={item.medicine_id}
            sx={{
                px: 1.25,
                py: 0.75,
                background: 'var(--lg-glass-panel)',
                color: 'var(--lg-text-primary)',
                border: '0.5px solid var(--lg-border)',
                borderLeft: `4px solid ${color}`,
            }}
        >
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700, lineHeight: 1.15 }}>
                {item.active_ingredient} {item.concentration}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>
                {item.pharmaceutical_form} - {item.presentation}
            </Typography>
        </Paper>
    );

    return (
        <Box
            sx={{
                height: '100vh',
                overflow: 'hidden',
                color: 'var(--lg-text-primary)',
                '@keyframes medicinesPanelScroll': {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: `translateY(calc(-100% + 100vh - ${HEADER_HEIGHT + COLUMN_HEADER_HEIGHT + 40}px))` },
                },
            }}
        >
            <Box
                component="header"
                sx={{
                    height: `${HEADER_HEIGHT}px`,
                    px: 3,
                    pt: 3,
                    pb: '10px',
                    position: 'relative',
                    zIndex: 2,
                    background: 'var(--lg-glass-modal)',
                    backdropFilter: 'var(--lg-blur-modal)',
                    WebkitBackdropFilter: 'var(--lg-blur-modal)',
                    borderBottom: '0.5px solid var(--lg-border)',
                }}
            >
                <Typography variant="h2" sx={{ mb: 1, color: 'text.primary', fontWeight: 700 }}>
                    Painel de Disponibilidade de Medicamentos
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
                </Typography>
            </Box>

            <Box
                sx={{
                    height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                    overflow: 'hidden',
                    px: 3,
                    pt: 2,
                    pb: 3,
                }}
            >
                <Grid
                    container
                    spacing={2}
                    sx={{
                        height: `${COLUMN_HEADER_HEIGHT}px`,
                        position: 'relative',
                        zIndex: 2,
                        background: 'var(--lg-glass-bg)',
                    }}
                >
                    {columns.map((column) => (
                        <Grid item xs={12} md={6} key={column.title}>
                            <Typography variant="h4" sx={{ color: column.color, fontWeight: 700 }}>
                                {column.title} ({column.items.length})
                            </Typography>
                        </Grid>
                    ))}
                </Grid>

                <Box
                    sx={{
                        height: `calc(100vh - ${HEADER_HEIGHT + COLUMN_HEADER_HEIGHT + 40}px)`,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                        minHeight: `calc(100vh - ${HEADER_HEIGHT + COLUMN_HEADER_HEIGHT + 40}px)`,
                        animation: data.items.length > 8
                            ? 'medicinesPanelScroll 124s linear infinite alternate'
                            : 'none',
                        willChange: 'transform',
                        }}
                    >
                        <Grid container spacing={2}>
                            {columns.map((column) => (
                                <Grid item xs={12} md={6} key={column.title}>
                                    <Box sx={{ display: 'grid', gap: 1 }}>
                                        {column.items.length === 0 ? (
                                            <Paper sx={{ p: 1.25, background: 'var(--lg-glass-panel)', color: 'var(--lg-text-secondary)', border: '0.5px solid var(--lg-border)' }}>
                                                Nenhum registro.
                                            </Paper>
                                        ) : (
                                            column.items.map((item) => renderMedicineCard(item, column.color))
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
