import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    fiscalizacoes: [],
    pagination: null,
};

export const addFiscalizacao = createAction('ADD_FISCALIZACAO');
export const editFiscalizacao = createAction('EDIT_FISCALIZACAO');
export const removeFiscalizacao = createAction('REMOVE_FISCALIZACAO');
export const addFiscalizacoes = createAction('ADD_FISCALIZACOES');
export const setFiscalizacaoPagination = createAction('SET_FISCALIZACAO_PAGINATION');

const fiscalizacaoReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addFiscalizacao, (state, action) => {
            state.fiscalizacoes = [action.payload, ...state.fiscalizacoes];
        })
        .addCase(editFiscalizacao, (state, action) => {
            state.fiscalizacoes = [
                action.payload,
                ...state.fiscalizacoes.filter(f => f.id !== action.payload.id),
            ];
        })
        .addCase(removeFiscalizacao, (state, action) => {
            state.fiscalizacoes = state.fiscalizacoes.filter(f => f.id !== action.payload.id);
        })
        .addCase(addFiscalizacoes, (state, action) => {
            state.fiscalizacoes = [...action.payload];
        })
        .addCase(setFiscalizacaoPagination, (state, action) => {
            state.pagination = action.payload;
        });
});

export default fiscalizacaoReducer;
