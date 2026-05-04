import { api } from '../../../services/api';
import { addCampo, addCampos, editCampo, removeCampo, showCampo } from '../../ducks/exameCampos';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';

export const getCamposDoExame = (exameId) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get(`/laboratorio/exames/${exameId}/campos`)
            .then((res) => {
                dispatch(addCampos(res.data));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const addCampoFetch = (exameId, campo, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post(`/laboratorio/exames/${exameId}/campos`, campo)
            .then((res) => {
                dispatch(addCampo(res.data.campo));
                dispatch(addMessage('Campo criado com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.campo);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao criar campo'));
                dispatch(turnLoading());
            });
    };
};

export const editCampoFetch = (exameId, campoId, campo, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.put(`/laboratorio/exames/${exameId}/campos/${campoId}`, campo)
            .then((res) => {
                dispatch(editCampo(res.data.campo));
                dispatch(addMessage('Campo atualizado com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.campo);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao atualizar campo'));
                dispatch(turnLoading());
            });
    };
};

export const removeCampoFetch = (exameId, campoId) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/laboratorio/exames/${exameId}/campos/${campoId}`)
            .then(() => {
                dispatch(removeCampo({ id: campoId }));
                dispatch(addMessage('Campo removido com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao remover campo'));
                dispatch(turnLoading());
            });
    };
};

export const reordenarCamposFetch = (exameId, ordem) => {
    return (dispatch) => {
        api.patch(`/laboratorio/exames/${exameId}/campos/reordenar`, { ordem })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao reordenar campos'));
            });
    };
};
