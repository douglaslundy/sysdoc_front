import React, { useContext, useMemo, useState } from 'react';
import { Abas } from '../src/components/ui/abas';
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

export default function DashboardPage() {
    const { myPermissions, authorizedPages, profile, canUseChat } = useContext(AuthContext);
    const [aba, setAba] = useState(0);

    const handleNavigateToSetor = (permissao) => {
        const indice = abasVisiveis.findIndex((item) => item.permission === permissao);
        if (indice < 0) return false;
        setAba(indice);
        return true;
    };

    const ABAS = [
        { label: 'Início',               permission: '/dashboard/inicio',      component: <InicioDashboard onNavigateToSetor={handleNavigateToSetor} /> },
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

    const abasVisiveis = useMemo(() => {
        const permitted = profile === 'admin'
            ? ABAS
            : ABAS.filter(a => myPermissions.includes(a.permission));
        const visible = permitted.filter(a => a.permission !== '/dashboard/chat' || canUseChat);
        const orderByPath = new Map(
            (authorizedPages || []).map((page) => [page.path, Number(page.ordem ?? 999)])
        );
        return [...visible].sort(
            (a, b) => (orderByPath.get(a.permission) ?? 999) - (orderByPath.get(b.permission) ?? 999)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authorizedPages, canUseChat, myPermissions, profile]);

    const abaSegura = Math.min(aba, Math.max(0, abasVisiveis.length - 1));

    if (abasVisiveis.length === 0) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-muted-foreground">
                    Nenhuma aba disponível para seu perfil. Entre em contato com o administrador.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <Abas
                    rotulo="Painéis do dashboard"
                    valor={abaSegura}
                    aoMudar={setAba}
                    itens={abasVisiveis.map((item, indice) => ({ chave: indice, rotulo: item.label }))}
                />
            </div>

            <div role="tabpanel">
                {abasVisiveis[abaSegura]?.component}
            </div>
        </div>
    );
}
