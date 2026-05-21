import { api } from '../../../services/api';
import { addMedicos, addMedico, editMedico, removeMedico } from '../../ducks/medicosSolicitantes';
import { addAlertMessage, changeTitleAlert, turnAlert, turnLoading } from '../../ducks/Layout';

export const getAllMedicos = (params = {}) => async dispatch => {
    try {
        const res = await api.get('/laboratorio/medicos', { params });
        const data = res.data;
        dispatch(addMedicos(Array.isArray(data) ? data : (data.data ?? [])));
    } catch {
        dispatch(addAlertMessage('Erro ao carregar médicos.'));
    }
};

export const addMedicoFetch = (form, callback) => dispatch => {
    dispatch(turnLoading());
    api.post('/laboratorio/medicos', form)
        .then(res => {
            dispatch(addMedico(res.data));
            dispatch(changeTitleAlert('Médico cadastrado com sucesso!'));
            dispatch(turnAlert());
            dispatch(turnLoading());
            if (callback) callback();
        })
        .catch(err => {
            dispatch(addAlertMessage(err.response?.data?.message || 'Erro ao cadastrar médico.'));
            dispatch(turnLoading());
        });
};

export const editMedicoFetch = (id, form, callback) => dispatch => {
    dispatch(turnLoading());
    api.put(`/laboratorio/medicos/${id}`, form)
        .then(res => {
            dispatch(editMedico(res.data));
            dispatch(changeTitleAlert('Médico atualizado com sucesso!'));
            dispatch(turnAlert());
            dispatch(turnLoading());
            if (callback) callback();
        })
        .catch(err => {
            dispatch(addAlertMessage(err.response?.data?.message || 'Erro ao atualizar médico.'));
            dispatch(turnLoading());
        });
};

export const removeMedicoFetch = (id) => dispatch => {
    dispatch(turnLoading());
    api.delete(`/laboratorio/medicos/${id}`)
        .then(() => {
            dispatch(removeMedico(id));
            dispatch(changeTitleAlert('Médico removido com sucesso!'));
            dispatch(turnAlert());
            dispatch(turnLoading());
        })
        .catch(err => {
            dispatch(addAlertMessage(err.response?.data?.message || 'Erro ao remover médico.'));
            dispatch(turnLoading());
        });
};
