import { api } from "../../../services/api";
import { inactiveRoute, addRoute, addRoutes, editRoute } from "../../ducks/routes";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllRoutes = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/routes')
            .then((res) => {
                dispatch(addRoutes(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addRouteFetch = (route, cleanForm) => {

    return (dispatch) => {
        const { 'sysvendas.id': user } = parseCookies();
        const { 'sysvendas.username': username } = parseCookies();

        dispatch(turnLoading());

        route = {
            ...route,
            'id_user': user
        }

        api.post('/routes', route)
            .then((res) =>
            (
                res = {
                    ...res.data,
                    user: {
                        name: username
                    }
                },
                dispatch(addRoute(res.route)),
                dispatch(addMessage(`A  rota ${route.origin.toUpperCase()} - ${route.destination.toUpperCase()} foi cadastrado com sucesso!`)),
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

export const editRouteFetch = (route, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/routes/${route.id}`, route)
            .then((res) =>
            (
                dispatch(editRoute(route)),
                dispatch(addMessage(`A  rota ${route.origin.toUpperCase()} - ${route.destination.toUpperCase()} foi atualizado com sucesso!`)),
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

export const inactiveRouteFetch = (route) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/routes/${route.id}`)
            .then((res) =>
            (
                dispatch(inactiveRoute(route)),
                dispatch(addMessage(`A  rota ${route.origin.toUpperCase()} - ${route.destination.toUpperCase()} foi excluida com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}