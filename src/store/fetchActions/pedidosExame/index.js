import { api } from '../../../services/api';
import { addPedido, addPedidos, editPedido, removePedido, setPedidoPagination, showPedido } from '../../ducks/pedidosExame';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../ducks/Layout';

export const getAllPedidos = (params = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get('/laboratorio/pedidos', { params })
            .then((res) => {
                dispatch(addPedidos(res.data.data));
                dispatch(setPedidoPagination({
                    current_page: res.data.current_page,
                    last_page: res.data.last_page,
                    total: res.data.total,
                }));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const getPedido = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.get(`/laboratorio/pedidos/${id}`)
            .then((res) => {
                dispatch(showPedido(res.data));
                dispatch(turnLoading());
            })
            .catch(() => dispatch(turnLoading()));
    };
};

export const addPedidoFetch = (pedido, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.post('/laboratorio/pedidos', pedido)
            .then((res) => {
                dispatch(addPedido(res.data.pedido));
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.pedido, res.data.protocolo, res.data.senha);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao criar pedido'));
                dispatch(turnLoading());
            });
    };
};

export const atualizarStatusFetch = (id, status) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.patch(`/laboratorio/pedidos/${id}/status`, { status })
            .then((res) => {
                dispatch(editPedido(res.data.pedido));
                dispatch(addMessage('Status atualizado!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.error || 'Erro ao atualizar status'));
                dispatch(turnLoading());
            });
    };
};

export const removePedidoFetch = (id) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.delete(`/laboratorio/pedidos/${id}`)
            .then(() => {
                dispatch(removePedido({ id }));
                dispatch(turnAlert());
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao remover pedido'));
                dispatch(turnLoading());
            });
    };
};

export const viewPedidoFetch = (pedidoId, onSuccess) => {
    return (dispatch) => {
        api.get(`/laboratorio/pedidos/${pedidoId}`)
            .then((res) => { onSuccess && onSuccess(res.data); })
            .catch(() => {});
    };
};

export const updatePedidoFetch = (id, dados, onSuccess) => {
    return (dispatch) => {
        dispatch(turnLoading());
        api.patch(`/laboratorio/pedidos/${id}`, dados)
            .then((res) => {
                dispatch(editPedido(res.data.pedido));
                dispatch(addMessage('Pedido atualizado com sucesso!'));
                dispatch(turnAlert());
                dispatch(turnLoading());
                onSuccess && onSuccess(res.data.pedido);
            })
            .catch((error) => {
                dispatch(addAlertMessage(error?.response?.data?.error || 'Erro ao atualizar pedido'));
                dispatch(turnLoading());
            });
    };
};
