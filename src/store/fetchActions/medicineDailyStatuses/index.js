import { api } from '../../../services/api';
import {
    addDailyStatuses,
    setDailyStatusesPagination,
    upsertDailyStatus,
} from '../../ducks/medicineDailyStatuses';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';
import { extractApiErrorMessage } from '../helpers';

export const getDailyStatuses = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/pharmacy/medicines/daily-statuses', { params })
            .then((res) => {
                dispatch(addDailyStatuses(res.data.data));
                dispatch(setDailyStatusesPagination(res.data.meta));
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível carregar os status diários.')));
                dispatch(turnLoading());
            });
    };
};

export const upsertDailyStatusFetch = (data, onSuccess, onError) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/pharmacy/medicines/daily-statuses', data)
            .then((res) => {
                dispatch(upsertDailyStatus(res.data));
                dispatch(addMessage('Status diário salvo com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                const message = extractApiErrorMessage(error, 'Não foi possível salvar o status diário.');
                onError ? onError(message) : dispatch(addAlertMessage(message));
                dispatch(turnLoading());
            });
    };
};
