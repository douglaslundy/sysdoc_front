import { api } from "../../../services/api";
import { inactiveQueue, addQueue, editQueue, addQueues, setQueuesPagination, setQueueSpecialityOptions } from "../../ducks/queues";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";
import { format } from 'date-fns';
import { buildConclusionObs, queueErrorMessage } from './queueErrors';

// date_of_realized é uma data pura (coluna `date` no banco). Usar new Date(...).toISOString()
// aqui desloca o dia em fusos diferentes de UTC — extrair os componentes locais em vez de converter para UTC.
const toRealizedDate = (value) => {
    if (!value) return format(new Date(), 'yyyy-MM-dd');
    if (value instanceof Date) return format(value, 'yyyy-MM-dd');
    return String(value).substring(0, 10);
};

export const getAllQueues = (params = {}) => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/queues', { params })
            .then((res) => {
                const data = res.data?.data || res.data;
                dispatch(addQueues(data));
                if (res.data?.meta) {
                    dispatch(setQueuesPagination({
                        current_page: res.data.meta.current_page,
                        per_page: res.data.meta.per_page,
                        total: res.data.meta.total,
                    }));
                } else {
                    dispatch(setQueuesPagination({
                        current_page: 1,
                        per_page: data.length,
                        total: data.length,
                    }));
                }
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const getQueueSpecialityOptions = () => {

    return (dispatch) => {
        api
            .get('/queues/specialities-options')
            .then((res) => {
                dispatch(setQueueSpecialityOptions(Array.isArray(res.data) ? res.data : []));
            })
            .catch(() => {})
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
                dispatch(addQueue(res.data?.data || res.data)),
                showGlobalMessage && dispatch(addMessage(`A especialidade foi adicionada com sucesso!`)),
                showGlobalAlert && dispatch(turnAlert()),
                dispatch(turnLoading()),
                closeOnSuccess && cleanForm && cleanForm(),
                onSuccess && onSuccess(res.data?.data || res.data)
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                onError && onError(error);
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};

/**
 * Dá baixa (done = true) em um item da fila.
 * options.onError(mensagem)  -> erro CLARO para a tela (se ausente, usa o alerta global antigo)
 * options.onSaved(registro)  -> chamado depois de gravar (ex.: recarregar a lista com o filtro atual)
 */
export const editDoneQueue = (queue, cleanForm, options = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());

        const payload = {
            ...queue,
            'date_of_realized': toRealizedDate(queue.date_of_realized),
            'done': true,
            'obs': buildConclusionObs(queue.obs, queue.obsConclusion),
        };

        return api.put(`/queues/${queue.id}`, payload)
            .then((res) => {
                const saved = res.data?.data || res.data;
                // Depois que o servidor gravou, uma falha só de tela NÃO pode virar "erro ao dar baixa".
                try {
                    dispatch(editQueue(saved));
                    dispatch(addMessage(`A Especialidade ${saved.id} foi atualizada com sucesso!`));
                    dispatch(turnAlert());
                } catch (uiError) {
                    console.error('[editDoneQueue] falha ao atualizar a tela após gravar', uiError);
                }
                dispatch(turnLoading());
                cleanForm && cleanForm();
                options.onSaved && options.onSaved(saved);
            })
            .catch((error) => {
                dispatch(turnLoading());
                const message = queueErrorMessage(error, 'dar baixa na especialidade');
                if (options.onError) {
                    options.onError(message);
                } else {
                    dispatch(addAlertMessage(message));
                }
                return error.response ? error.response.data : 'erro desconhecido';
            });
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

export const inactiveQueueFetch = (queue, options = {}) => {
    return (dispatch) => {
        dispatch(turnLoading())

        return api.delete(`/queues/${queue.id}`)
            .then(() => {
                try {
                    dispatch(inactiveQueue(queue));
                    dispatch(addMessage(`A Especialidade foi excluida com sucesso!`));
                    dispatch(turnAlert());
                } catch (uiError) {
                    console.error('[inactiveQueueFetch] falha ao atualizar a tela após excluir', uiError);
                }
                dispatch(turnLoading());
                options.onSaved && options.onSaved(queue);
            })
            .catch((error) => {
                dispatch(turnLoading());
                const message = queueErrorMessage(error, 'excluir da fila');
                if (options.onError) {
                    options.onError(message);
                } else {
                    dispatch(addAlertMessage(message));
                }
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
                    dispatch(editQueue(res.data?.data || res.data)),
                    showGlobalMessage && dispatch(addMessage(`A Especialidade ${(res.data?.data || res.data).id} foi atualizada com sucesso!`)),
                    showGlobalAlert && dispatch(turnAlert()),
                    dispatch(turnLoading()),
                    closeOnSuccess && cleanFormCallback && cleanFormCallback(),
                    onSuccess && onSuccess(res.data?.data || res.data)
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
                dispatch(editQueue(res.data?.data || res.data)),
                dispatch(addMessage(`A Especialidade ${(res.data?.data || res.data).id} foi atualizada com sucesso!`)),
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
