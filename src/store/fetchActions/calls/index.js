import { destroyCookie, parseCookies, setCookie } from "nookies";
import { api } from "../../../services/api";
import { addCall, editCall, addCalls, inactiveCall, showCall } from "../../ducks/calls";
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

export const getShowCall = (id) => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get(`/calls/${id}`)
            .then((res) => {
                dispatch(showCall(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const getTodayCalls = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/calls/today')
            .then((res) => {
                dispatch(addCalls(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const getCalledCalls = () => {

    return (dispatch) => {
        // dispatch(turnLoading());
        api
            .get('/calls/called')
            .then((res) => {
                dispatch(showCall(res.data));
            })
            .catch(() => {
                dispatch(turnLoading());
            })
    }
}

export const getLastsCalls = () => {

    return (dispatch) => {
        // dispatch(turnLoading());
        api
            .get('/calls/lasts')
            .then((res) => {
                dispatch(addCalls(res.data));
            })
            .catch(() => {
                dispatch(turnLoading());
            })
    }
}


export const getFilteredCalls = ({ status, call_service_id, room_id, verb = 'calls' } = data) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get(`/${verb}`)
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
                dispatch(addCall(res.data.call)),
                dispatch(addMessage(`O atendimento ${res.data.call.call_prefix} ${res.data.call.call_number} foi adicionado com sucesso!`)),
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
                dispatch(addMessage(`Atendimento ${res.data.call.call_prefix} ${res.data.call.call_number} foi editado com sucesso!`)),
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
                dispatch(addMessage(`Atendimento ${res.data.call.call_prefix} ${res.data.call.call_number} foi iniciado com sucesso!`)),

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

        if (call.service_status == 'forwarded' && !call.call_service_forwarded_id) {
            dispatch(addAlertMessage(`Você não selecionou um serviço ao encaminhar este atendimento`));
            dispatch(turnLoading());
            return;
        }

        api.put(`/calls/${call.call_id}/end`, call)
            .then((res) =>
            (
                dispatch(inactiveCall(res.data.call)),
                dispatch(addMessage(`Atendimento ${res.data.call.call_prefix} ${res.data.call.call_number} foi finalizado com sucesso!`)),

                destroyCookie(null, 'sysvendas.call_id'),

                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm && cleanForm(),
                Router.push('/listing_calls')
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error ? `ERROR - ${error.response ? error.response.data.error : error} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
}
