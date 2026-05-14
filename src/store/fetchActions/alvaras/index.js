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

const parseBlobJsonMessage = async (blob) => {
    if (!blob || typeof blob.text !== 'function') return null;
    try {
        const text = await blob.text();
        const json = JSON.parse(text);
        return json?.message || json?.error || null;
    } catch {
        return null;
    }
};

export const downloadAlvaraPdf = (id, numeroAlvara) => async (dispatch) => {
    try {
        const res = await api.get(`/alvaras/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        const safeNumber = String(numeroAlvara ?? 'sem-numero').replace(/[\\/]+/g, '-');
        a.href = url;
        a.download = `alvara-${safeNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        const status = error?.response?.status;
        const backendMsg = await parseBlobJsonMessage(error?.response?.data);

        if (status === 401) {
            dispatch(addAlertMessage('Sessão expirada. Faça login novamente.'));
            return;
        }
        if (status === 404) {
            dispatch(addAlertMessage(backendMsg || 'Alvará não encontrado para geração do PDF.'));
            return;
        }
        if (status === 422) {
            dispatch(addAlertMessage(backendMsg || 'Dados inválidos para gerar o PDF do alvará.'));
            return;
        }

        dispatch(addAlertMessage(backendMsg || 'Erro ao gerar PDF do alvará.'));
    }
};
