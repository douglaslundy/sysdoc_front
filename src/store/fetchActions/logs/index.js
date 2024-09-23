import { api } from "../../../services/api";
import { addLog, addLogs } from "../../ducks/logs";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllLogs = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/logs')
            .then((res) => {
                dispatch(addLogs(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

// export const addLetterFetch = (letter, cleanForm) => {
//     const { 'sysvendas.id': user } = parseCookies();
//     const { 'sysvendas.username': username } = parseCookies();

//     return (dispatch) => {
//         dispatch(turnLoading());
//         letter = {
//             ...letter,
//             'id_user': user
//         }
//         api.post('/logs', letter)
//             .then((res) =>
//             (
//                 res = {
//                     ...res.data.letter,
//                     user: {
//                         name: username
//                     }
//                 },

//                 dispatch(addLetter(res)),
//                 dispatch(addMessage(`O Ofício ${res.number} foi adicionado com sucesso!`)),
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
// };