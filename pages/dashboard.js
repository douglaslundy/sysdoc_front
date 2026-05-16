import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import InicioDashboard from '../src/components/dashboard/InicioDashboard';
import LabDashboard from '../src/components/dashboard/LabDashboard';
import FilaDashboard from '../src/components/dashboard/FilaDashboard';
import TfdDashboard from '../src/components/dashboard/TfdDashboard';
import FarmaciaDashboard from '../src/components/dashboard/FarmaciaDashboard';
import LogsDashboard from '../src/components/dashboard/LogsDashboard';
import VigilanciaDashboard from '../src/components/dashboard/VigilanciaDashboard';

const ABAS = [
    { label: 'Início',               component: <InicioDashboard /> },
    { label: 'Vigilância Sanitária', component: <VigilanciaDashboard /> },
    { label: 'Laboratório',          component: <LabDashboard /> },
    { label: 'Fila',                 component: <FilaDashboard /> },
    { label: 'TFD',                  component: <TfdDashboard /> },
    { label: 'Farmácia',             component: <FarmaciaDashboard /> },
    { label: 'Logs/QR',              component: <LogsDashboard /> },
];

export default function DashboardPage() {
    const [aba, setAba] = useState(0);

    return (
        <Box>
            <Box
                sx={{
                    mb: 3,
                    p: 0.8,
                    borderRadius: '14px',
                    background: 'var(--lg-glass-panel)',
                    backdropFilter: 'var(--lg-blur-panel)',
                    WebkitBackdropFilter: 'var(--lg-blur-panel)',
                    border: '0.5px solid var(--lg-border)',
                    borderTop: '1px solid var(--lg-border-strong)',
                    boxShadow: 'var(--lg-shadow-panel)',
                }}
            >
                <Tabs
                    value={aba}
                    onChange={(_, novaAba) => setAba(novaAba)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 44,
                        '& .MuiTabs-indicator': {
                            height: 2,
                            borderRadius: 2,
                            background: 'linear-gradient(90deg, var(--lg-accent), #7c3aed)',
                        },
                    }}
                >
                    {ABAS.map((item, idx) => (
                        <Tab
                            key={idx}
                            label={item.label}
                            sx={{
                                minHeight: 40,
                                px: 1.5,
                                borderRadius: '10px',
                                textTransform: 'none',
                                color: 'var(--lg-text-secondary)',
                                '&.Mui-selected': {
                                    color: 'var(--lg-text-primary)',
                                    background: 'rgba(var(--lg-accent-rgb), 0.12)',
                                },
                            }}
                        />
                    ))}
                </Tabs>
            </Box>

            <Box role="tabpanel">
                {ABAS[aba]?.component}
            </Box>
        </Box>
    );
}

