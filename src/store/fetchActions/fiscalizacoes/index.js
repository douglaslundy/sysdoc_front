import { api } from '../../../services/api';
import {
    addFiscalizacao,
    addFiscalizacoes,
    editFiscalizacao,
    removeFiscalizacao,
    setFiscalizacaoPagination,
} from '../../ducks/fiscalizacoes';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';

export const getAllFiscalizacoes = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/fiscalizacoes', { params })
            .then((res) => {
                dispatch(addFiscalizacoes(res.data.data));
                dispatch(setFiscalizacaoPagination(res.data.meta));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const addFiscalizacaoFetch = (dados, onSuccess, onError) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/fiscalizacoes', dados)
            .then((res) => {
                dispatch(addFiscalizacao(res.data));
                dispatch(addMessage('Fiscalização cadastrada com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data);
            })
            .catch((error) => {
                const message = error?.response?.data?.message || 'Erro ao cadastrar fiscalização';
                dispatch(addAlertMessage(message));
                onError && onError(message);
                dispatch(turnLoading());
            });
    };
};

export const editFiscalizacaoFetch = (id, dados, onSuccess, onError) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.put(`/fiscalizacoes/${id}`, dados)
            .then((res) => {
                dispatch(editFiscalizacao(res.data));
                dispatch(addMessage('Fiscalização atualizada com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data);
            })
            .catch((error) => {
                const message = error?.response?.data?.message || 'Erro ao atualizar fiscalização';
                dispatch(addAlertMessage(message));
                onError && onError(message);
                dispatch(turnLoading());
            });
    };
};

export const removeFiscalizacaoFetch = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/fiscalizacoes/${id}`)
            .then(() => {
                dispatch(removeFiscalizacao({ id }));
                dispatch(addMessage('Fiscalização excluída com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao excluir fiscalização'));
                dispatch(turnLoading());
            });
    };
};
