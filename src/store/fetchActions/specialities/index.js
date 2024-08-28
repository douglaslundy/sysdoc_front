import { api } from "../../../services/api";
import { inactiveSpeciality, addSpeciality, addSpecialities, editSpeciality } from "../../ducks/specialities";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllSpecialities = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/specialities')
            .then((res) => {
                console.log(res.data)
                dispatch(addSpecialities(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addSpecialityFetch = (speciality, cleanForm) => {

    return (dispatch) => {
        const { 'sysvendas.id': user } = parseCookies();
        const { 'sysvendas.username': username } = parseCookies();

        dispatch(turnLoading());

        speciality = {
            ...speciality,
            'id_user': user
        }

        api.post('/specialities', speciality)
            .then((res) =>
            (
                res = {
                    ...res.data,
                    user: {
                        name: username
                    }
                },
                dispatch(addSpeciality(res)),
                dispatch(addMessage(`A especialidade ${res.name} foi adicionadacom sucesso!`)),
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

export const editSpecialityFetch = (speciality, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/specialities/${speciality.id}`, speciality)
            .then((res) =>
            (
                dispatch(editSpeciality(speciality)),
                dispatch(addMessage(`O especialidade ${speciality.name} foi atualizada com sucesso!`)),
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

export const inactiveSpecialityFetch = (speciality) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/specialities/${speciality.id}`)
            .then((res) =>
            (
                dispatch(inactiveSpeciality(speciality)),
                dispatch(addMessage(`O especialidade ${speciality.name} foi excluida com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}