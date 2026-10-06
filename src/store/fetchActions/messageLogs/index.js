import { api } from '../../../services/api';
import { setMessageLogs, setLoading } from '../../ducks/messageLogs';
import { addAlertMessage } from '../../ducks/Layout';

export const getMessageLogs = (params = {}) => (dispatch) => {
    dispatch(setLoading(true));
    api.get('/mensagens-enviadas', { params })
        .then(res => dispatch(setMessageLogs(res.data)))
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao carregar mensagens enviadas'));
        })
        .finally(() => dispatch(setLoading(false)));
};
