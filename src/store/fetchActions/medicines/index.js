import { api } from '../../../services/api';
import {
    addMedicine,
    addMedicines,
    editMedicine,
    removeMedicine,
    setMedicinePagination,
} from '../../ducks/medicines';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';
import { extractApiErrorMessage } from '../helpers';

export const getAllMedicines = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/medicines', { params })
            .then((res) => {
                dispatch(addMedicines(res.data.data));
                dispatch(setMedicinePagination(res.data.meta));
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível carregar a lista de medicamentos.')));
                dispatch(turnLoading());
            });
    };
};

export const getMedicinesSelect = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/pharmacy/medicines/select', { params })
            .then((res) => {
                dispatch(addMedicines(res.data || []));
                dispatch(setMedicinePagination(null));
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível carregar os medicamentos para seleção.')));
                dispatch(turnLoading());
            });
    };
};

export const addMedicineFetch = (data, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/medicines', data)
            .then((res) => {
                dispatch(addMedicine(res.data));
                dispatch(addMessage('Medicamento cadastrado com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível cadastrar o medicamento.')));
                dispatch(turnLoading());
            });
    };
};

export const editMedicineFetch = (id, data, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.put(`/medicines/${id}`, data)
            .then((res) => {
                dispatch(editMedicine(res.data));
                dispatch(addMessage('Medicamento atualizado com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível atualizar o medicamento.')));
                dispatch(turnLoading());
            });
    };
};

export const removeMedicineFetch = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/medicines/${id}`)
            .then(() => {
                dispatch(removeMedicine({ id }));
                dispatch(addMessage('Medicamento removido com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível remover o medicamento.')));
                dispatch(turnLoading());
            });
    };
};


