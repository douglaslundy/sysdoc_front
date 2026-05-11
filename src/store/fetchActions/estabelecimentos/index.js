import { api } from '../../../services/api';
import {
    addEstabelecimento,
    addEstabelecimentos,
    editEstabelecimento,
    removeEstabelecimento,
    setEstabelecimentoPagination,
    setEstabelecimentoSelectList,
} from '../../ducks/estabelecimentos';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';

export const getAllEstabelecimentos = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/estabelecimentos', { params })
            .then((res) => {
                dispatch(addEstabelecimentos(res.data.data));
                dispatch(setEstabelecimentoPagination(res.data.meta));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const getEstabelecimentosSelect = () => {
    return (dispatch) => {
        api.get('/estabelecimentos/select')
            .then((res) => {
                dispatch(setEstabelecimentoSelectList(res.data));
            })
            .catch(() => {});
    };
};

export const addEstabelecimentoFetch = (dados, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/estabelecimentos', dados)
            .then((res) => {
                dispatch(addEstabelecimento(res.data));
                dispatch(addMessage(`Estabelecimento ${res.data.nome_estabelecimento} cadastrado com sucesso!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao cadastrar estabelecimento'));
                dispatch(turnLoading());
            });
    };
};

export const editEstabelecimentoFetch = (id, dados, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.put(`/estabelecimentos/${id}`, dados)
            .then((res) => {
                dispatch(editEstabelecimento(res.data));
                dispatch(addMessage(`Estabelecimento ${res.data.nome_estabelecimento} atualizado com sucesso!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao atualizar estabelecimento'));
                dispatch(turnLoading());
            });
    };
};

export const removeEstabelecimentoFetch = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/estabelecimentos/${id}`)
            .then(() => {
                dispatch(removeEstabelecimento({ id }));
                dispatch(addMessage('Estabelecimento excluído com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao excluir estabelecimento'));
                dispatch(turnLoading());
            });
    };
};
