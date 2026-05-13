import { api } from '../../../services/api';
import { setMedicineCompliance } from '../../ducks/medicineCompliance';
import { addAlertMessage, turnLoading } from '../../ducks/Layout';
import { extractApiErrorMessage } from '../helpers';

export const getMedicineCompliance = () => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/pharmacy/medicines/compliance')
            .then((res) => {
                dispatch(setMedicineCompliance(res.data));
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(extractApiErrorMessage(error, 'Não foi possível carregar os dados de conformidade.')));
                dispatch(turnLoading());
            });
    };
};
