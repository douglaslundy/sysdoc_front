import { api } from '../../../services/api';
import { setConfig, setLoading } from '../../ducks/labConfig';
import { addAlertMessage, addMessage, turnAlert } from '../../ducks/Layout';

export const getLabConfig = (params = {}) => (dispatch) => {
    dispatch(setLoading(true));
    api.get('/laboratorio/config', { params })
        .then(res => dispatch(setConfig(res.data)))
        .catch(() => {})
        .finally(() => dispatch(setLoading(false)));
};

export const updateLabConfig = (data, onSuccess, params = {}) => (dispatch) => {
    dispatch(setLoading(true));
    api.put('/laboratorio/config', { ...data, ...params }, { params })
        .then(res => {
            dispatch(setConfig(res.data));
            dispatch(addMessage('Configurações salvas!'));
            dispatch(turnAlert());
            onSuccess && onSuccess();
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao salvar configurações'));
        })
        .finally(() => dispatch(setLoading(false)));
};
