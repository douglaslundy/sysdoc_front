import { parseCookies } from "nookies";
import { api } from "../../../services/api";
import { addCall, editCall, addCalls } from "../../ducks/calls";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";

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
                            call =>(
                                room_id != 'null' ?
                                    call.room_id == room_id
                                     :
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

// export const editCallFetch = (call, cleanForm) => {
//     return (dispatch) => {
//         dispatch(turnLoading());

//         api.put(`/calls/${call.id}`, call)
//             .then((res) =>
//             (
//                 dispatch(editCall(call)),
//                 dispatch(addMessage(`O atendimento ${call.name} foi atualizado com sucesso!`)),
//                 dispatch(turnAlert()),
//                 dispatch(turnLoading()),
//                 cleanForm()
//             ))
//             .catch((error) => {
//                 dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
//                 dispatch(turnLoading());
//                 return error.response ? error.response.data : 'erro desconhecido';
//             })
//     };
// }

// export const inactiveCallFetch = (call) => {
//     return (dispatch) => {
//         dispatch(turnLoading())

//         api.delete(`/calls/${call.id}`)
//             .then((res) =>
//             (
//                 dispatch(inactiveCall(call)),
//                 dispatch(addMessage(`O atendimento ${call.name} foi excluido com sucesso!`)),
//                 dispatch(turnAlert()),
//                 dispatch(turnLoading())
//             ))
//             .catch((error) => {
//                 dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
//                 dispatch(turnLoading());
//             })
//     }
// }