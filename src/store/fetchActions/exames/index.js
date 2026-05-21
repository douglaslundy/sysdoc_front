import { api } from '../../../services/api';
import { addExame, addExames, editExame, removeExame, setExamePagination, showExame } from '../../ducks/exames';
import { turnLoading } from '../../ducks/Layout';
import { addAlertMessage, addMessage, turnAlert } from '../../ducks/Layout';

export const getAllExames = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/laboratorio/exames', { params: { per_page: 1000, ...params } })
            .then((res) => {
                dispatch(addExames(res.data.data));
                dispatch(setExamePagination({
                    current_page: res.data.current_page,
                    last_page: res.data.last_page,
                    total: res.data.total,
                }));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const getExame = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get(`/laboratorio/exames/${id}`)
            .then((res) => {
                dispatch(showExame(res.data));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const addExameFetch = (exame, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/laboratorio/exames', exame)
            .then((res) => {
                dispatch(addExame(res.data.exame));
                dispatch(addMessage(`Exame ${res.data.exame.nome} criado com sucesso!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.exame);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao criar exame'));
                dispatch(turnLoading());
            });
    };
};

export const editExameFetch = (id, exame, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.put(`/laboratorio/exames/${id}`, exame)
            .then((res) => {
                dispatch(editExame(res.data.exame));
                dispatch(addMessage(`Exame ${res.data.exame.nome} atualizado com sucesso!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.exame);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao atualizar exame'));
                dispatch(turnLoading());
            });
    };
};

export const removeExameFetch = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/laboratorio/exames/${id}`)
            .then(() => {
                dispatch(removeExame({ id }));
                dispatch(addMessage('Exame removido com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao remover exame'));
                dispatch(turnLoading());
            });
    };
};
