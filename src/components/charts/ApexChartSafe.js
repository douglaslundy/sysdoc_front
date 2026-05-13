import React from 'react';

let ReactApexChart = null;

if (typeof window !== 'undefined') {
    try {
        // Resolve at runtime to avoid hard build-time failure when dependency is missing.
        ReactApexChart = (0, eval)('require')('react-apexcharts').default;
    } catch (_) {
        ReactApexChart = null;
    }
}

export default function ApexChartSafe(props) {
    if (!ReactApexChart) {
        return null;
    }

    return <ReactApexChart {...props} />;
}

