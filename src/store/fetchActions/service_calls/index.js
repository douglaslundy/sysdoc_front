import { api } from "../../../services/api";
import { inactiveService, addService, editService, addServices } from "../../ducks/service_calls";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";

export const getAllServices = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/services')
            .then((res) => {
                dispatch(addServices(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addServiceFetch = (service, cleanForm) => {

    return (dispatch) => {
        dispatch(turnLoading());        
        api.post('/services', service)
            .then((res) =>
            (
                dispatch(addService(res.data.call_service)),
                dispatch(addMessage(`O Serviço ${res.name} foi adicionado com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};

export const editServiceFetch = (service, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/services/${service.id}`, service)
            .then((res) =>
            (
                dispatch(editService(service)),
                dispatch(addMessage(`O Serviço ${service.name} foi atualizado com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
}

export const inactiveServiceFetch = (service) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/services/${service.id}`)
            .then((res) =>
            (
                dispatch(inactiveService(service)),
                dispatch(addMessage(`O Serviço ${service.name} foi excluido com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}