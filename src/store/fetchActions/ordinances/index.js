import { api } from "../../../services/api";
import {
    inactiveOrdinance,
    addOrdinance,
    editOrdinance,
    addOrdinances,
    getTextOpenAi,
    showOrdinance
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
                dispatch(showOrdinance({
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

export const listOrdinanceAttachments = (ordinanceId) => {
    return api.get(`/ordinances/${ordinanceId}/attachments`);
};

export const uploadOrdinanceAttachment = (ordinanceId, files) => {
    const formData = new FormData();
    const normalizedFiles = Array.isArray(files) ? files : [files];
    normalizedFiles.forEach((file) => formData.append('files[]', file));

    return api.post(`/ordinances/${ordinanceId}/attachments`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteOrdinanceAttachment = (ordinanceId, attachmentId) => {
    return api.delete(`/ordinances/${ordinanceId}/attachments/${attachmentId}`);
};

export const downloadOrdinanceAttachment = async (ordinanceId, attachment) => {
    const response = await api.get(
        `/ordinances/${ordinanceId}/attachments/${attachment.id}/download`,
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
