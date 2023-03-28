import { api } from "../../../services/api";
import { inactiveLetter, addLetter, editLetter, addLetters, getTextOpenAi } from "../../ducks/letters";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

// function getToken() {
//     const { 'sysvendas.token': token } = parseCookies();    
//     token ? api.defaults.headers['Authorization'] = `Bearer ${token}` : Router.push('/login');
// }

export const getAllLetters = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/letters')
            .then((res) => {
                dispatch(addLetters(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addLetterFetch = (letter, cleanForm) => {
    const {'sysvendas.id' : user} = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());
        letter = {
            ...letter,
            'id_user': user
        }
        api.post('/letters', letter)
            .then((res) =>
            (
                dispatch(addLetter(res.data.letter)),
                dispatch(addMessage(`O Ofício ${res.data.letter.number} foi adicionado com sucesso!`)),
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


export const getTextAI = (letter) => {
    const {'sysvendas.id' : user} = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());
        letter = {
            ...letter,
            "id_user" : user,
            "treatment_pronoun" : "Excelentissimo senhor",
            'wishes': "estima e consideração"
        }

        api.post('/letters/newLetter', letter)
            .then((res) =>
            (
                // dispatch(addLetter(res.data.letter)),
                // dispatch(addLetter(res))
                dispatch(getTextOpenAi(res.data)),
                dispatch(addMessage(`Modelo Gerado com Sucesso`)),
                // dispatch(turnAlert()),
                dispatch(turnLoading()),
                // cleanForm()
            ))
            .catch((error) => {                
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};

export const editLetterFetch = (letter, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/letters/${letter.id}`, letter)
            .then((res) =>
            (
                dispatch(editLetter(letter)),
                dispatch(addMessage(`O Ofício ${letter.number} foi atualizado com sucesso!`)),
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

export const inactiveLetterFetch = (letter) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/letters/${letter.id}`)
            .then((res) =>
            (
                dispatch(inactiveLetter(letter)),
                dispatch(addMessage(`O Ofício ${letter.number} foi excluido com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addMessage(`ERROR - ${error} `));
                dispatch(turnLoading());
            })
    }
}