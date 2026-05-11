import { api } from '../../../services/api';
import { setConfig, setLoading } from '../../ducks/vigilanciaConfig';
import { addAlertMessage, addMessage, turnAlert } from '../../ducks/Layout';

export const getVigilanciaConfig = () => (dispatch) => {
    dispatch(setLoading(true));
    api.get('/vigilancia/config')
        .then(res => dispatch(setConfig(res.data)))
        .catch(() => {})
        .finally(() => dispatch(setLoading(false)));
};

export const updateVigilanciaConfig = (data) => (dispatch) => {
    dispatch(setLoading(true));
    api.put('/vigilancia/config', data)
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
