import { api } from '../../../services/api';
import {
    addAlvara,
    addAlvaras,
    editAlvara,
    removeAlvara,
    setAlvaraPagination,
} from '../../ducks/alvaras';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';

export const getAllAlvaras = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/alvaras', { params })
            .then((res) => {
                dispatch(addAlvaras(res.data.data));
                dispatch(setAlvaraPagination(res.data.meta));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const addAlvaraFetch = (dados, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/alvaras', dados)
            .then((res) => {
                dispatch(addAlvara(res.data));
                dispatch(addMessage(`Alvará ${res.data.numero_alvara} cadastrado com sucesso!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao cadastrar alvará'));
                dispatch(turnLoading());
            });
    };
};

export const editAlvaraFetch = (id, dados, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.put(`/alvaras/${id}`, dados)
            .then((res) => {
                dispatch(editAlvara(res.data));
                dispatch(addMessage(`Alvará ${res.data.numero_alvara} atualizado com sucesso!`));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao atualizar alvará'));
                dispatch(turnLoading());
            });
    };
};

export const removeAlvaraFetch = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/alvaras/${id}`)
            .then(() => {
                dispatch(removeAlvara({ id }));
                dispatch(addMessage('Alvará excluído com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao excluir alvará'));
                dispatch(turnLoading());
            });
    };
};

export const downloadAlvaraPdf = (id, numeroAlvara) => async (dispatch) => {
    try {
        const res = await api.get(`/alvaras/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `alvara-${numeroAlvara}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch {
        dispatch(addAlertMessage('Erro ao gerar PDF do alvará'));
    }
};
