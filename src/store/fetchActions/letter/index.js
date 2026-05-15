import { api } from "../../../services/api";
import { inactiveLetter, addLetter, editLetter, addLetters, getTextOpenAi, showLetter } from "../../ducks/letters";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

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
    const {'sysvendas.username' : username} = parseCookies();

    return (dispatch) => {
        dispatch(turnLoading());
        letter = {
            ...letter,
            'id_user': user
        }
        api.post('/letters', letter)
            .then((res) =>
            (
                res = {
                    ...res.data.letter,
                    user : {
                        name : username
                    }
                },

                dispatch(addLetter(res)),
                dispatch(showLetter(res)),
                dispatch(addMessage(`O Ofício ${res.number} foi adicionado com sucesso!`)),
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
                dispatch(getTextOpenAi(res.data.content)),
                dispatch(addMessage(`Modelo Gerado com Sucesso`)),
                dispatch(turnLoading()),
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
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}

export const listLetterAttachments = (letterId) => {
    return api.get(`/letters/${letterId}/attachments`);
};

export const uploadLetterAttachment = (letterId, files) => {
    const formData = new FormData();
    const normalizedFiles = Array.isArray(files) ? files : [files];
    normalizedFiles.forEach((file) => formData.append('files[]', file));

    return api.post(`/letters/${letterId}/attachments`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteLetterAttachment = (letterId, attachmentId) => {
    return api.delete(`/letters/${letterId}/attachments/${attachmentId}`);
};

export const downloadLetterAttachment = async (letterId, attachment) => {
    const response = await api.get(
        `/letters/${letterId}/attachments/${attachment.id}/download`,
        { responseType: 'blob' }
    );

    const blob = new Blob([response.data], { type: attachment.mime_type || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = attachment.original_name || `anexo-${attachment.id}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
};
