import dynamic from 'next/dynamic';
import React from 'react';
import { Box, Typography } from '@mui/material';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => null,
});

export default function ApexChartSafe(props) {
    if (!ReactApexChart) {
        return (
            <Box p={2} textAlign="center">
                <Typography color="textSecondary">Falha ao carregar biblioteca de graficos.</Typography>
            </Box>
        );
    }

    try {
        return <ReactApexChart {...props} />;
    } catch (_) {
        return (
            <Box p={2} textAlign="center">
                <Typography color="textSecondary">Falha ao renderizar grafico.</Typography>
            </Box>
        );
    }
}
