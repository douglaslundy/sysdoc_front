import { api } from '../../../services/api';
import { setConfig, setLoading } from '../../ducks/labConfig';
import { addAlertMessage, addMessage, turnAlert } from '../../ducks/Layout';

export const getLabConfig = () => (dispatch) => {
    dispatch(setLoading(true));
    api.get('/laboratorio/config')
        .then(res => dispatch(setConfig(res.data)))
        .catch(() => {})
        .finally(() => dispatch(setLoading(false)));
};

export const updateLabConfig = (data, onSuccess) => (dispatch) => {
    dispatch(setLoading(true));
    api.put('/laboratorio/config', data)
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
