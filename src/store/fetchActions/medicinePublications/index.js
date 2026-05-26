import { api } from '../../../services/api';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';

export const registerMedicinePublicationFetch = (data, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/pharmacy/medicines/publications', data)
            .then(() => {
                dispatch(addMessage('Evidência de publicação registrada com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess();
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao registrar publicação.'));
                dispatch(turnLoading());
            });
    };
};


