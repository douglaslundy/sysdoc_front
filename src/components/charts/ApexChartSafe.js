import dynamic from 'next/dynamic';
import React from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => null,
});

export default function ApexChartSafe(props) {
    if (!ReactApexChart) {
        return <p className="p-4 text-center text-muted-foreground">Falha ao carregar biblioteca de graficos.</p>;
    }

    try {
        return <ReactApexChart {...props} />;
    } catch (_) {
        return <p className="p-4 text-center text-muted-foreground">Falha ao renderizar grafico.</p>;
    }
}
