import { api } from "../../../services/api";
import { inactiveTrip, addTrip, addTrips, editTrip, showTrip } from "../../ducks/trips";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";
import { format } from 'date-fns';
import { cleanPhone } from "../../../components/helpers/formatt/phone";

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
            'departure_date': trip.departure_date ? (new Date(trip.departure_date).toISOString().slice(0, 19).replace('T', ' ')) : null,
            'user_id': user
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
                dispatch(addMessage(`Viagem cadastrado com sucesso!`)),
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

        trip = {
            ...trip,
            'departure_date': trip.departure_date ? (new Date(trip.departure_date).toISOString().slice(0, 19).replace('T', ' ')) : null
        },

            api.patch(`/trips/${trip.id}`, trip)
                .then((res) =>
                (
                    dispatch(editTrip(res.data.trip)),
                    dispatch(addMessage(`Viagem foi atualizado com sucesso!`)),
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



export const excludeTripFetch = (trip) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/trips/${trip.id}`)
            .then((res) =>
            (
                dispatch(inactiveTrip(trip)),
                dispatch(addMessage(`A Viagem foi excluido com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response?.data.message} `));
                dispatch(turnLoading());
            })
    }
}


export const excludeClientTripFetch = (cli) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/trip-clients/${cli}`)
            .then((res) =>
            (
                dispatch(editTrip(res.data.trip)),
                dispatch(showTrip(res.data.trip)),
                dispatch(addMessage(`Cliente foi excluido com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response?.data.message} `));
                dispatch(turnLoading());
            })
    }
}

export const insertClientTrip = (client) => {
    return (dispatch) => {
        dispatch(turnLoading());
        client = {
            'trip_id': client.id,
            'client_id': client.client_id,
            'person_type': client.person_type,
            'phone': cleanPhone(client.phone),
            'departure_location': client.departure_location,
            'destination_location': client.destination_location,
            'time': client.time,
        }
        // console.log(client)

        api.post(`/trip-clients`, client)
            .then((res) =>
            (

                dispatch(editTrip(res.data.trip)),
                dispatch(showTrip(res.data.trip)),
                dispatch(addMessage(`Viagem foi atualizado com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                // dispatch(addAlertMessage(error ? `ERROR - ${error} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
}



export const getAllTripsPerDate = (dateBegin, dateEnd) => {

    const form = {};

    if (dateBegin) {
        form.date_begin = format(dateBegin, 'yyyy/MM/dd');
    }

    if (dateEnd) {
        form.date_end = format(dateEnd, 'yyyy/MM/dd');
    }

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get(`/trips`, { params: form }) // Pass the 'form' object as a request parameter
            .then((res) => {
                dispatch(addTrips(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}