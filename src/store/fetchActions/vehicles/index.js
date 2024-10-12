import { api } from "../../../services/api";
import { inactiveVehicle, addVehicle, addVehicles, editVehicle } from "../../ducks/vehicles";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllVehicles = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/vehicles')
            .then((res) => {
                dispatch(addVehicles(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addVehicleFetch = (vehicle, cleanForm) => {

    return (dispatch) => {
        const { 'sysvendas.id': user } = parseCookies();
        const { 'sysvendas.username': username } = parseCookies();

        dispatch(turnLoading());

        vehicle = {
            ...vehicle,
            'id_user': user
        }

        api.post('/vehicles', vehicle)
            .then((res) =>
            (
                res = {
                    ...res.data,
                    user: {
                        name: username
                    }
                },
                dispatch(addVehicle(res)),
                dispatch(addMessage(`O Veículo ${vehicle.brand.toUpperCase()}  ${vehicle.model.toUpperCase()} PLACA ${vehicle.license_plate.toUpperCase()} foi cadastrado com sucesso!`)),
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

export const editVehicleFetch = (vehicle, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/vehicles/${vehicle.id}`, vehicle)
            .then((res) =>
            (
                dispatch(editVehicle(vehicle)),
                dispatch(addMessage(`O Veículo ${vehicle.brand.toUpperCase()}  ${vehicle.model.toUpperCase()} PLACA ${vehicle.license_plate.toUpperCase()} foi atualizado com sucesso!`)),
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

export const inactiveVehicleFetch = (vehicle) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/vehicles/${vehicle.id}`)
            .then((res) =>
            (
                dispatch(inactiveVehicle(vehicle)),
                dispatch(addMessage(`O Veículo ${vehicle.brand.toUpperCase()}  ${vehicle.model.toUpperCase()} PLACA ${vehicle.license_plate.toUpperCase()} foi excluida com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}