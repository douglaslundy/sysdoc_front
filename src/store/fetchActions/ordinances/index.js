import { api } from "../../../services/api";
import {
    inactiveOrdinance,
    addOrdinance,
    editOrdinance,
    addOrdinances,
    getTextOpenAi
} from "../../ducks/ordinances";
import {
    turnAlert,
    addMessage,
    addAlertMessage,
    turnLoading
} from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllOrdinances = () => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.get('/ordinances')
            .then((res) => {
                dispatch(addOrdinances(res.data));
                dispatch(turnLoading());
            })
            .catch(() => {
                dispatch(turnLoading());
            });
    };
};

export const addOrdinanceFetch = (ordinance, cleanForm) => {
    const { 'sysvendas.id': user } = parseCookies();
    const { 'sysvendas.username': username } = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());

        ordinance = {
            ...ordinance,
            user_id: user
        };

        api.post('/ordinances', ordinance)
            .then((res) => (
                dispatch(addOrdinance({
                    ...res.data.ordinance,
                    user: { name: username }
                })),
                dispatch(addMessage(`A Portaria ${res.data.ordinance.number} foi adicionada com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(
                    error.response ? `ERROR - ${error.response.data.message}` : 'Erro desconhecido'
                ));
                dispatch(turnLoading());
            });
    };
};

export const getTextAIOrdinance = (ordinance) => {
    const { 'sysvendas.id': user } = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());

        ordinance = {
            ...ordinance,
            user_id: user
        };

        api.post('/ordinances/newOrdinance', ordinance)
            .then((res) => (
                dispatch(getTextOpenAi(res.data.content)),
                dispatch(addMessage(`Modelo Gerado com Sucesso`)),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(
                    error.response ? `ERROR - ${error.response.data.message}` : 'Erro desconhecido'
                ));
                dispatch(turnLoading());
            });
    };
};

export const editOrdinanceFetch = (ordinance, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/ordinances/${ordinance.id}`, ordinance)
            .then((res) => (
                dispatch(editOrdinance(res.data.ordinance)),
                dispatch(addMessage(`A Portaria ${res.data.ordinance.number} foi atualizada com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(
                    error.response ? `ERROR - ${error.response.data.message}` : 'Erro desconhecido'
                ));
                dispatch(turnLoading());
            });
    };
};

export const inactiveOrdinanceFetch = (ordinance) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.delete(`/ordinances/${ordinance.id}`)
            .then(() => (
                dispatch(inactiveOrdinance(ordinance)),
                dispatch(addMessage(`A Portaria ${ordinance.number} foi excluída com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response?.data?.message || 'Erro desconhecido'}`));
                dispatch(turnLoading());
            });
    };
};