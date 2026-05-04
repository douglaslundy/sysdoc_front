import api from '../../../services/api';
import { addMedicos, addMedico, editMedico, removeMedico } from '../../ducks/medicosSolicitantes';
import { showAlert } from '../../ducks/Alerts';

export const getAllMedicos = (params = {}) => async dispatch => {
    try {
        const res = await api.get('/laboratorio/medicos', { params });
        const data = res.data;
        dispatch(addMedicos(Array.isArray(data) ? data : (data.data ?? [])));
    } catch {
        dispatch(showAlert({ open: true, severity: 'error', message: 'Erro ao carregar médicos.' }));
    }
};

export const addMedicoFetch = (form, callback) => async dispatch => {
    try {
        const res = await api.post('/laboratorio/medicos', form);
        dispatch(addMedico(res.data));
        dispatch(showAlert({ open: true, severity: 'success', message: 'Médico cadastrado com sucesso!' }));
        if (callback) callback();
    } catch (err) {
        const msg = err.response?.data?.message || 'Erro ao cadastrar médico.';
        dispatch(showAlert({ open: true, severity: 'error', message: msg }));
    }
};

export const editMedicoFetch = (id, form, callback) => async dispatch => {
    try {
        const res = await api.put(`/laboratorio/medicos/${id}`, form);
        dispatch(editMedico(res.data));
        dispatch(showAlert({ open: true, severity: 'success', message: 'Médico atualizado com sucesso!' }));
        if (callback) callback();
    } catch (err) {
        const msg = err.response?.data?.message || 'Erro ao atualizar médico.';
        dispatch(showAlert({ open: true, severity: 'error', message: msg }));
    }
};

export const removeMedicoFetch = (id, callback) => async dispatch => {
    try {
        await api.delete(`/laboratorio/medicos/${id}`);
        dispatch(removeMedico(id));
        dispatch(showAlert({ open: true, severity: 'success', message: 'Médico removido com sucesso!' }));
        if (callback) callback();
    } catch (err) {
        const msg = err.response?.data?.message || 'Erro ao remover médico.';
        dispatch(showAlert({ open: true, severity: 'error', message: msg }));
    }
};
