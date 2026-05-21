import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    pedidos: [],
    pedido: {},
    pagination: null,
};

export const addPedido = createAction('ADD_PEDIDO_EXAME');
export const editPedido = createAction('EDIT_PEDIDO_EXAME');
export const removePedido = createAction('REMOVE_PEDIDO_EXAME');
export const addPedidos = createAction('ADD_PEDIDOS_EXAME');
export const showPedido = createAction('SHOW_PEDIDO_EXAME');
export const setPedidoPagination = createAction('SET_PEDIDO_PAGINATION');

const pedidosExameReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addPedido, (state, action) => {
            state.pedidos = [action.payload, ...state.pedidos];
        })
        .addCase(editPedido, (state, action) => {
            state.pedidos = [
                action.payload,
                ...state.pedidos.filter(p => p.id !== action.payload.id),
            ];
        })
        .addCase(removePedido, (state, action) => {
            state.pedidos = state.pedidos.filter(p => p.id !== action.payload.id);
        })
        .addCase(addPedidos, (state, action) => {
            state.pedidos = [...action.payload];
        })
        .addCase(showPedido, (state, action) => {
            state.pedido = action.payload;
        })
        .addCase(setPedidoPagination, (state, action) => {
            state.pagination = action.payload;
        });
});

export default pedidosExameReducer;
