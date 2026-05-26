import { api } from '../../../services/api';
import {
    addMonthlyAcquisitions,
    setMonthlyAcquisitionsPagination,
    upsertMonthlyAcquisition,
} from '../../ducks/medicineMonthlyAcquisitions';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';
import { extractApiErrorMessage } from '../helpers';

export const getMonthlyAcquisitions = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/pharmacy/medicines/monthly-acquisitions', { params })
            .then((res) => {
                dispatch(addMonthlyAcquisitions(res.data.data));
                dispatch(setMonthlyAcquisitionsPagination(res.data.meta));
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível carregar as aquisições mensais.')));
                dispatch(turnLoading());
            });
    };
};

export const upsertMonthlyAcquisitionFetch = (data, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/pharmacy/medicines/monthly-acquisitions', data)
            .then((res) => {
                dispatch(upsertMonthlyAcquisition(res.data));
                dispatch(addMessage('Aquisição mensal salva com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível salvar a aquisição mensal.')));
                dispatch(turnLoading());
            });
    };
};


