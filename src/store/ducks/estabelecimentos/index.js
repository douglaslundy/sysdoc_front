import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    estabelecimentos: [],
    estabelecimento: {},
    pagination: null,
    selectList: [],
};

export const addEstabelecimento = createAction('ADD_ESTABELECIMENTO');
export const editEstabelecimento = createAction('EDIT_ESTABELECIMENTO');
export const removeEstabelecimento = createAction('REMOVE_ESTABELECIMENTO');
export const addEstabelecimentos = createAction('ADD_ESTABELECIMENTOS');
export const showEstabelecimento = createAction('SHOW_ESTABELECIMENTO');
export const setEstabelecimentoPagination = createAction('SET_ESTABELECIMENTO_PAGINATION');
export const setEstabelecimentoSelectList = createAction('SET_ESTABELECIMENTO_SELECT_LIST');

const estabelecimentoReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addEstabelecimento, (state, action) => {
            state.estabelecimentos = [action.payload, ...state.estabelecimentos];
        })
        .addCase(editEstabelecimento, (state, action) => {
            state.estabelecimentos = [
                action.payload,
                ...state.estabelecimentos.filter(e => e.id !== action.payload.id),
            ];
        })
        .addCase(removeEstabelecimento, (state, action) => {
            state.estabelecimentos = state.estabelecimentos.filter(e => e.id !== action.payload.id);
        })
        .addCase(addEstabelecimentos, (state, action) => {
            state.estabelecimentos = [...action.payload];
        })
        .addCase(showEstabelecimento, (state, action) => {
            state.estabelecimento = action.payload;
        })
        .addCase(setEstabelecimentoPagination, (state, action) => {
            state.pagination = action.payload;
        })
        .addCase(setEstabelecimentoSelectList, (state, action) => {
            state.selectList = [...action.payload];
        });
});

export default estabelecimentoReducer;
