import React, { useContext, useMemo, useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import InicioDashboard from '../src/components/dashboard/InicioDashboard';
import ConformidadesDashboard from '../src/components/dashboard/ConformidadesDashboard';
import LabDashboard from '../src/components/dashboard/LabDashboard';
import FilaDashboard from '../src/components/dashboard/FilaDashboard';
import TfdDashboard from '../src/components/dashboard/TfdDashboard';
import FarmaciaDashboard from '../src/components/dashboard/FarmaciaDashboard';
import LogsDashboard from '../src/components/dashboard/LogsDashboard';
import VigilanciaDashboard from '../src/components/dashboard/VigilanciaDashboard';
import ChatDashboard from '../src/components/dashboard/ChatDashboard';
import AlmoxarifadoDashboard from '../src/components/dashboard/AlmoxarifadoDashboard';
import ArquivoDashboard from '../src/components/dashboard/ArquivoDashboard';
import { AuthContext } from '../src/contexts/AuthContext';

const ABAS = [
    { label: 'Início',               permission: '/dashboard/inicio',      component: <InicioDashboard /> },
    { label: 'Conformidades',        permission: '/dashboard/conformidades', component: <ConformidadesDashboard /> },
    { label: 'Vigilância Sanitária', permission: '/dashboard/vigilancia',  component: <VigilanciaDashboard /> },
    { label: 'Laboratório',          permission: '/dashboard/laboratorio', component: <LabDashboard /> },
    { label: 'Fila',                 permission: '/dashboard/fila',        component: <FilaDashboard /> },
    { label: 'TFD',                  permission: '/dashboard/tfd',         component: <TfdDashboard /> },
    { label: 'Farmácia',             permission: '/dashboard/farmacia',    component: <FarmaciaDashboard /> },
    { label: 'Logs/QR',             permission: '/dashboard/logs',        component: <LogsDashboard /> },
    { label: 'Chat',                permission: '/dashboard/chat',        component: <ChatDashboard /> },
    { label: 'Almoxarifado',        permission: '/dashboard/almoxarifado', component: <AlmoxarifadoDashboard /> },
    { label: 'Arquivo',             permission: '/dashboard/arquivo',      component: <ArquivoDashboard /> },
];

export default function DashboardPage() {
    const { myPermissions, authorizedPages, profile } = useContext(AuthContext);
    const [aba, setAba] = useState(0);

    const abasVisiveis = useMemo(() => {
        const visible = profile === 'admin'
            ? ABAS
            : ABAS.filter(a => myPermissions.includes(a.permission));
        const orderByPath = new Map(
            (authorizedPages || []).map((page) => [page.path, Number(page.ordem ?? 999)])
        );
        return [...visible].sort(
            (a, b) => (orderByPath.get(a.permission) ?? 999) - (orderByPath.get(b.permission) ?? 999)
        );
    }, [authorizedPages, myPermissions, profile]);

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
        <Box className="dashboard-neon-page">
            <Box className="dashboard-neon-tabs-wrap" sx={{ borderBottom: '1px solid var(--lg-border-row)', mb: 3 }}>
                <Tabs
                    value={abaSegura}
                    onChange={(_, novaAba) => setAba(novaAba)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#2e89ff',
                            height: 2,
                            borderRadius: 2,
                        },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontSize: '15px',
                            color: 'var(--lg-text-muted)',
                            minHeight: 46,
                        },
                        '& .MuiTab-root.Mui-selected': {
                            color: '#48a7ff',
                        },
                    }}
                >
                    {abasVisiveis.map((item) => (
                        <Tab key={item.permission} label={item.label} />
                    ))}
                </Tabs>
            </Box>

            <Box role="tabpanel" className="dashboard-neon-content">
                {abasVisiveis[abaSegura]?.component}
            </Box>
        </Box>
    );
}
