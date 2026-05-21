import { api } from '../../../services/api';
import { addCategoria, addCategorias, editCategoria, removeCategoria, showCategoria } from '../../ducks/categoriasExame';
import { addAlertMessage, addMessage, changeTitleAlert, turnAlert, turnLoading } from '../../ducks/Layout';

export const getAllCategorias = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/laboratorio/categorias', { params })
            .then((res) => {
                const data = res.data.data ?? res.data;
                dispatch(addCategorias(data));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const addCategoriaFetch = (categoria, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/laboratorio/categorias', categoria)
            .then((res) => {
                dispatch(addCategoria(res.data.categoria));
                dispatch(changeTitleAlert(`Categoria ${res.data.categoria.nome} criada com sucesso!`));
                dispatch(addMessage(`Categoria ${res.data.categoria.nome} criada!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao criar categoria'));
                dispatch(turnLoading());
            });
    };
};

export const editCategoriaFetch = (id, categoria, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.put(`/laboratorio/categorias/${id}`, categoria)
            .then((res) => {
                dispatch(editCategoria(res.data.categoria));
                dispatch(changeTitleAlert(`Categoria ${res.data.categoria.nome} atualizada!`));
                dispatch(addMessage(`Categoria atualizada!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao atualizar categoria'));
                dispatch(turnLoading());
            });
    };
};

export const removeCategoriaFetch = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/laboratorio/categorias/${id}`)
            .then(() => {
                dispatch(removeCategoria({ id }));
                dispatch(addMessage('Categoria removida com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao remover categoria'));
                dispatch(turnLoading());
            });
    };
};
