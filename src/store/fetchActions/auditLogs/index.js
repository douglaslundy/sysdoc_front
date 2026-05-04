import { api } from '../../../services/api';
import { setAuditLogs } from '../../ducks/auditLogs';
import { turnLoading, addAlertMessage } from '../../ducks/Layout';

export const getAuditLogs = (filters = {}, page = 1) => (dispatch) => {
    dispatch(turnLoading());
    api.get('/audit-logs', { params: { ...filters, page, per_page: 50 } })
        .then(res => {
            dispatch(setAuditLogs(res.data));
            dispatch(turnLoading());
        })
        .catch(() => {
            dispatch(addAlertMessage('Erro ao carregar logs de auditoria'));
            dispatch(turnLoading());
        });
};
