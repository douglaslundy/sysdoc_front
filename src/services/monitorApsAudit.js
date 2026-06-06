import { useEffect, useRef } from 'react';
import { api } from './api';

/**
 * Sends a filter audit event to the API.
 * The global page auditor in _app.js is responsible for VIEW.
 */
function send(path, label, filtros = null) {
    const body = { path, label };
    if (filtros && Object.keys(filtros).length > 0) body.filtros = filtros;
    api.post('/audit/page-view', body).catch(() => {});
}

/**
 * Hook that records READ only after the initial filter state changes.
 *
 * @param {string} path   - caminho da página (ex: '/monitor-aps/visitas')
 * @param {string} label  - nome legível (ex: 'Monitor APS - Visitas ACS')
 * @param {object} filtros - objeto com os filtros atuais (chaves/valores)
 */
export function useMonitorApsAudit(path, label, filtros = {}) {
    const hasInitialFilters = useRef(false);

    // Skip the first render to avoid duplicating the global page VIEW log.
    const filtrosKey = JSON.stringify(filtros);
    useEffect(() => {
        if (!hasInitialFilters.current) {
            hasInitialFilters.current = true;
            return;
        }
        if (Object.keys(filtros).length === 0) return;
        send(path, label, filtros);
    }, [filtrosKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
