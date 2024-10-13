import { api } from "../../../services/api";
import { inactiveTrip, addTrip, addTrips, editTrip } from "../../ducks/trips";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllTrips = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/trips')
            .then((res) => {
                dispatch(addTrips(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addTripFetch = (trip, cleanForm) => {

    return (dispatch) => {
        const { 'sysvendas.id': user } = parseCookies();
        const { 'sysvendas.username': username } = parseCookies();

        dispatch(turnLoading());

        trip = {
            ...trip,
            'id_user': user
        }

        api.post('/trips', trip)
            .then((res) =>
            (
                res = {
                    ...res.data,
                    user: {
                        name: username
                    }
                },
                dispatch(addTrip(res.trip)),
                dispatch(addMessage(`O Veículo ${trip.brand.toUpperCase()}  ${trip.model.toUpperCase()} PLACA ${trip.license_plate.toUpperCase()} foi cadastrado com sucesso!`)),
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

export const editTripFetch = (trip, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/trips/${trip.id}`, trip)
            .then((res) =>
            (
                dispatch(editTrip(trip)),
                dispatch(addMessage(`O Veículo ${trip.brand.toUpperCase()}  ${trip.model.toUpperCase()} PLACA ${trip.license_plate.toUpperCase()} foi atualizado com sucesso!`)),
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

export const inactiveTripFetch = (trip) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/trips/${trip.id}`)
            .then((res) =>
            (
                dispatch(inactiveTrip(trip)),
                dispatch(addMessage(`O Veículo ${trip.brand.toUpperCase()}  ${trip.model.toUpperCase()} PLACA ${trip.license_plate.toUpperCase()} foi excluida com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}