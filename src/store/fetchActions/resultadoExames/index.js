import { api } from '../../../services/api';
import { clearResultado, showResultado } from '../../ducks/resultadoExames';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';

export const iniciarResultado = (pedidoId, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post(`/laboratorio/pedidos/${pedidoId}/resultado`)
            .then((res) => {
                dispatch(showResultado(res.data.resultado));
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.resultado);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao iniciar resultado'));
                dispatch(turnLoading());
            });
    };
};

export const getResultado = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get(`/laboratorio/resultados/${id}`)
            .then((res) => {
                dispatch(showResultado(res.data));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const salvarCamposFetch = (resultadoId, campos, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post(`/laboratorio/resultados/${resultadoId}/campos`, { campos })
            .then((res) => {
                dispatch(showResultado(res.data.resultado));
                dispatch(addMessage('Rascunho salvo com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.resultado);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.error || 'Erro ao salvar campos'));
                dispatch(turnLoading());
            });
    };
};

export const liberarResultadoFetch = (resultadoId, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post(`/laboratorio/resultados/${resultadoId}/liberar`)
            .then((res) => {
                dispatch(showResultado(res.data.resultado));
                dispatch(addMessage(`Resultado liberado! Protocolo: ${res.data.protocolo}`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.error || 'Erro ao liberar resultado'));
                dispatch(turnLoading());
            });
    };
};
