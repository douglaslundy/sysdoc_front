import React, { useContext, useMemo, useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import InicioDashboard from '../src/components/dashboard/InicioDashboard';
import LabDashboard from '../src/components/dashboard/LabDashboard';
import FilaDashboard from '../src/components/dashboard/FilaDashboard';
import TfdDashboard from '../src/components/dashboard/TfdDashboard';
import FarmaciaDashboard from '../src/components/dashboard/FarmaciaDashboard';
import LogsDashboard from '../src/components/dashboard/LogsDashboard';
import VigilanciaDashboard from '../src/components/dashboard/VigilanciaDashboard';
import { AuthContext } from '../src/contexts/AuthContext';

const ABAS = [
    { label: 'Início',               permission: '/dashboard/inicio',      component: <InicioDashboard /> },
    { label: 'Vigilância Sanitária', permission: '/dashboard/vigilancia',  component: <VigilanciaDashboard /> },
    { label: 'Laboratório',          permission: '/dashboard/laboratorio', component: <LabDashboard /> },
    { label: 'Fila',                 permission: '/dashboard/fila',        component: <FilaDashboard /> },
    { label: 'TFD',                  permission: '/dashboard/tfd',         component: <TfdDashboard /> },
    { label: 'Farmácia',             permission: '/dashboard/farmacia',    component: <FarmaciaDashboard /> },
    { label: 'Logs/QR',             permission: '/dashboard/logs',        component: <LogsDashboard /> },
];

export default function DashboardPage() {
    const { myPermissions, profile } = useContext(AuthContext);
    const [aba, setAba] = useState(0);

    const abasVisiveis = useMemo(() => {
        if (profile === 'admin') return ABAS;
        return ABAS.filter(a => myPermissions.includes(a.permission));
    }, [myPermissions, profile]);

    // Garante que o índice selecionado não fique fora dos limites após mudança de perfil
    const abaSegura = Math.min(aba, Math.max(0, abasVisiveis.length - 1));

    if (abasVisiveis.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <Typography color="text.secondary">
                    Nenhuma aba disponível para seu perfil. Entre em contato com o administrador.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={abaSegura}
                    onChange={(_, novaAba) => setAba(novaAba)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {abasVisiveis.map((item, idx) => (
                        <Tab key={item.permission} label={item.label} />
                    ))}
                </Tabs>
            </Box>

            <Box role="tabpanel">
                {abasVisiveis[abaSegura]?.component}
            </Box>
        </Box>
    );
}
