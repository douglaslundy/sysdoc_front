import { useEffect, useRef } from 'react';
import { api } from './api';

/**
 * Envia um evento de auditoria para a API.
 * - Sem filtros  → action=VIEW  (acesso à página)
 * - Com filtros  → action=READ  (filtro aplicado pelo usuário)
 */
function send(path, label, filtros = null) {
    const body = { path, label };
    if (filtros && Object.keys(filtros).length > 0) body.filtros = filtros;
    api.post('/audit/page-view', body).catch(() => {});
}

/**
 * Hook que registra VIEW no mount e READ a cada mudança de filtros.
 *
 * @param {string} path   - caminho da página (ex: '/monitor-aps/visitas')
 * @param {string} label  - nome legível (ex: 'Monitor APS - Visitas ACS')
 * @param {object} filtros - objeto com os filtros atuais (chaves/valores)
 */
export function useMonitorApsAudit(path, label, filtros = {}) {
    const isMounted = useRef(false);

    // VIEW no primeiro mount
    useEffect(() => {
        send(path, label);
        isMounted.current = true;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // READ apenas quando filtros mudam após o mount
    const filtrosKey = JSON.stringify(filtros);
    useEffect(() => {
        if (!isMounted.current) return;
        if (Object.keys(filtros).length === 0) return;
        send(path, label, filtros);
    }, [filtrosKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
