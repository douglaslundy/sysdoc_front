import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import LabDashboard from '../src/components/dashboard/LabDashboard';
import FilaDashboard from '../src/components/dashboard/FilaDashboard';
import TfdDashboard from '../src/components/dashboard/TfdDashboard';
import LogsDashboard from '../src/components/dashboard/LogsDashboard';

const ABAS = [
    { label: 'Laboratório', component: <LabDashboard /> },
    { label: 'Fila',        component: <FilaDashboard /> },
    { label: 'TFD',         component: <TfdDashboard /> },
    { label: 'Logs/QR',     component: <LogsDashboard /> },
];

export default function DashboardsPage() {
    const [aba, setAba] = useState(0);

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={aba}
                    onChange={(_, novaAba) => setAba(novaAba)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {ABAS.map((item, idx) => (
                        <Tab key={idx} label={item.label} />
                    ))}
                </Tabs>
            </Box>

            {ABAS.map((item, idx) => (
                <Box key={idx} hidden={aba !== idx} role="tabpanel">
                    {aba === idx && item.component}
                </Box>
            ))}
        </Box>
    );
}
