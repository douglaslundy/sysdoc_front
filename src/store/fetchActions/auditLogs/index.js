import { api } from '../../../services/api';
import { setAuditLogs } from '../../ducks/auditLogs';
import { addAlertMessage } from '../../ducks/Layout';
import { apiAction } from '../helpers';

export const getAuditLogs = (filters = {}, page = 1) =>
    apiAction(
        () => api.get('/audit-logs', { params: { ...filters, page, per_page: 50 } }),
        {
            onSuccess: (res, dispatch) => dispatch(setAuditLogs(res.data)),
            onError: (_err, dispatch) => dispatch(addAlertMessage('Erro ao carregar logs de auditoria')),
        }
    );
