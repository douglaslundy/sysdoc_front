import { api } from '../../../services/api';
import { setConfig, setLoading } from '../../ducks/vigilanciaConfig';
import { addAlertMessage, addMessage, turnAlert } from '../../ducks/Layout';

export const getVigilanciaConfig = (params = {}) => (dispatch) => {
    dispatch(setLoading(true));
    api.get('/vigilancia/config', { params })
        .then(res => dispatch(setConfig(res.data)))
        .catch(() => {})
        .finally(() => dispatch(setLoading(false)));
};

export const updateVigilanciaConfig = (data, params = {}) => (dispatch) => {
    dispatch(setLoading(true));
    api.put('/vigilancia/config', { ...data, ...params }, { params })
        .then(res => {
            dispatch(setConfig(res.data));
            dispatch(addMessage('Configurações salvas com sucesso!'));
            dispatch(turnAlert());
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao salvar configurações'));
        })
        .finally(() => dispatch(setLoading(false)));
};
