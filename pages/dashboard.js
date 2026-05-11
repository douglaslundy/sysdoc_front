import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import InicioDashboard from '../src/components/dashboard/InicioDashboard';
import LabDashboard from '../src/components/dashboard/LabDashboard';
import FilaDashboard from '../src/components/dashboard/FilaDashboard';
import TfdDashboard from '../src/components/dashboard/TfdDashboard';
import LogsDashboard from '../src/components/dashboard/LogsDashboard';
import VigilanciaDashboard from '../src/components/dashboard/VigilanciaDashboard';

const ABAS = [
    { label: 'Início',               component: <InicioDashboard /> },
    { label: 'Laboratório',          component: <LabDashboard /> },
    { label: 'Fila',                 component: <FilaDashboard /> },
    { label: 'TFD',                  component: <TfdDashboard /> },
    { label: 'Logs/QR',              component: <LogsDashboard /> },
    { label: 'Vigilância Sanitária', component: <VigilanciaDashboard /> },
];

export default function DashboardPage() {
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
                    {item.component}
                </Box>
            ))}
        </Box>
    );
}
