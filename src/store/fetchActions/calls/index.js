import { destroyCookie, parseCookies, setCookie } from "nookies";
import { api } from "../../../services/api";
import { addCall, editCall, addCalls, inactiveCall } from "../../ducks/calls";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import Router from "next/router";

export const getAllCalls = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/calls')
            .then((res) => {
                dispatch(addCalls(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}


export const getFilteredCalls = ({ status, call_service_id, room_id } = data) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/calls')
            .then((res) => {
                dispatch(
                    addCalls(
                        res.data.filter(
                            call => (
                                call.status == status &&
                                call.call_service_id == call_service_id
                            )
                        )
                    )
                );
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addCallFetch = (call, cleanForm) => {
    const { 'sysvendas.id': user } = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());

        call = {
            user_id: user,
            ...call
        }

        api.post('/calls', call)
            .then((res) =>
            (
                dispatch(addCall(res.data)),
                dispatch(addMessage(`O atendimento ${res.data.call.id} foi adicionado com sucesso!`)),
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

export const editCallFetch = (call, cleanForm) => {
    const { 'sysvendas.id': user } = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());

        call = {
            user_id: user,
            ...call
        }

        api.put(`/calls/${call.id}`, call)
            .then((res) =>
            (
                dispatch(editCall(res.data.call)),
                dispatch(addMessage(`A Senha ${res.data.call.id} foi chamada com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm && cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error ? `ERROR - ${error.response.data.error} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
}

export const startCallFetch = (call, cleanForm) => {
    const { 'sysvendas.id': user, 'sysvendas.room_id': room_id } = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());

        call = {
            ...call,
            'user_id': user,
            'room_id': room_id,
            // 'status': 'IN_PROGRESS',
        }


        if (!call.room_id) {
            dispatch(addAlertMessage(`Para realizar esta operação você precisa entrar em uma sala`));
            dispatch(turnLoading());
            return;
        }

        api.put(`/calls/${call.id}/start`, call)
            .then((res) =>
            (
                dispatch(inactiveCall(res.data.call)),
                dispatch(addMessage(`O atendimento da senha ${res.data.call.id} foi iniciado!`)),

                setCookie(undefined, 'sysvendas.call_id', res.data.call.id, {
                    maxAge: 60 * 60 * 72,
                }),

                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm && cleanForm(),
                Router.push('/attending'),
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error ? `ERROR - ${error.response.data.error} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
}

export const finishCallFetch = (call, cleanForm) => {
    const { 'sysvendas.id': user, 'sysvendas.room_id': room_id } = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());

        call = {
            ...call,
            'user_id': user,
            'room_id': room_id,
        }


        if (!call.room_id) {
            dispatch(addAlertMessage(`Para realizar esta operação você precisa entrar em uma sala`));
            dispatch(turnLoading());
            return;
        }

        api.put(`/calls/${call.call_id}/end`, call)
            .then((res) =>
            (
                dispatch(inactiveCall(res.data.call)),
                dispatch(addMessage(`O atendimento da senha ${res.data.call.id} foi finalizado com sucesso!`)),

                destroyCookie(null, 'sysvendas.call_id'),

                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm && cleanForm(),
                Router.push('/listing_calls')
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error ? `ERROR - ${error.response.data.error} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
}