import { api } from "../../../services/api";
import { inactiveQueue, addQueue, editQueue, addQueues } from "../../ducks/queues";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllQueues = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/queues')
            .then((res) => {
                dispatch(addQueues(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addQueueFetch = (queue, callbacks = {}) => {
    const { 'sysvendas.id': user } = parseCookies();
    const { 'sysvendas.username': username } = parseCookies();
    let {
        onSuccess,
        onError,
        closeOnSuccess = true,
        cleanForm,
        showGlobalAlert = true,
        showGlobalMessage = true
    } = callbacks;
    // When modal stays open, prefer local feedback only.
    if (!closeOnSuccess) {
        showGlobalAlert = false;
        showGlobalMessage = false;
    }

    return (dispatch) => {

        dispatch(turnLoading());

        queue = {
            'id_user': user,
            'id_client': queue.client,
            'id_specialities': queue.speciality,
            'urgency': queue.urgency,
            'obs': queue.obs,
            // done sera sempre false quando no momento do cadastro
            'done': 0,
        }

        api.post('/queues', queue)
            .then((res) =>
            (
                dispatch(addQueue(res.data)),
                showGlobalMessage && dispatch(addMessage(`A especialidade foi adicionada com sucesso!`)),
                showGlobalAlert && dispatch(turnAlert()),
                dispatch(turnLoading()),
                closeOnSuccess && cleanForm && cleanForm(),
                onSuccess && onSuccess(res.data)
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                onError && onError(error);
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};

export const editDoneQueue = (queue, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        queue = {
            ...queue,
            'date_of_realized': queue.date_of_realized ? (new Date(queue.date_of_realized).toISOString().slice(0, 19).replace('T', ' ')) : new Date().toISOString().slice(0, 19).replace('T', ' '),
            'done': true,
            'obs': queue.obs + "\n" + queue.obsConclusion?.toUpperCase(),
        }

        api.put(`/queues/${queue.id}`, queue)
            .then((res) =>
            (
                dispatch(editQueue(res.data)),
                dispatch(addMessage(`A Especialidade ${res.data.id} foi atualizada com sucesso!`)),
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

export const viewQueueFetch = (queueId, onSuccess) => {
    return (dispatch) => {
        api.get(`/queues/${queueId}`)
            .then((res) => { onSuccess && onSuccess(res.data); })
            .catch(() => {});
    };
};

export const getQueueById = (queueId) => {
    return api.get(`/queues/${queueId}`);
};

export const inactiveQueueFetch = (queue) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/queues/${queue.id}`)
            .then((res) =>
            (
                dispatch(inactiveQueue(queue)),
                dispatch(addMessage(`A Especialidade foi excluida com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}

export const editQueueFetch = (queue, cleanForm) => {
    if (typeof cleanForm === 'object' && cleanForm !== null) {
        const callbacks = cleanForm;
        const {
            onSuccess,
            onError,
            closeOnSuccess = true,
            cleanForm: cleanFormCallback,
            showGlobalAlert = true,
            showGlobalMessage = true
        } = callbacks;

        return (dispatch) => {
            dispatch(turnLoading());

            const payload = {
                ...queue,
                id_client: queue.client ?? queue.id_client,
                id_specialities: queue.speciality ?? queue.id_specialities,
            };

            api.put(`/queues/${queue.id}`, payload)
                .then((res) => (
                    dispatch(editQueue(res.data)),
                    showGlobalMessage && dispatch(addMessage(`A Especialidade ${res.data.id} foi atualizada com sucesso!`)),
                    showGlobalAlert && dispatch(turnAlert()),
                    dispatch(turnLoading()),
                    closeOnSuccess && cleanFormCallback && cleanFormCallback(),
                    onSuccess && onSuccess(res.data)
                ))
                .catch((error) => {
                    dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                    dispatch(turnLoading());
                    onError && onError(error);
                    return error.response ? error.response.data : 'erro desconhecido';
                });
        };
    }

    return (dispatch) => {
        dispatch(turnLoading());

        const payload = {
            ...queue,
            id_client: queue.client ?? queue.id_client,
            id_specialities: queue.speciality ?? queue.id_specialities,
        };

        api.put(`/queues/${queue.id}`, payload)
            .then((res) => (
                dispatch(editQueue(res.data)),
                dispatch(addMessage(`A Especialidade ${res.data.id} foi atualizada com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm && cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            });
    };
}

export const listQueueAttachments = (queueId) => {
    return api.get(`/queues/${queueId}/attachments`);
};

export const uploadQueueAttachment = (queueId, files) => {
    const formData = new FormData();
    const normalizedFiles = Array.isArray(files) ? files : [files];
    normalizedFiles.forEach((file) => formData.append('files[]', file));

    return api.post(`/queues/${queueId}/attachments`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteQueueAttachment = (queueId, attachmentId) => {
    return api.delete(`/queues/${queueId}/attachments/${attachmentId}`);
};

export const downloadQueueAttachment = async (queueId, attachment) => {
    const response = await api.get(
        `/queues/${queueId}/attachments/${attachment.id}/download`,
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
