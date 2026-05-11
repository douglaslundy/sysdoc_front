import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    alvaras: [],
    alvara: {},
    pagination: null,
};

export const addAlvara = createAction('ADD_ALVARA');
export const editAlvara = createAction('EDIT_ALVARA');
export const removeAlvara = createAction('REMOVE_ALVARA');
export const addAlvaras = createAction('ADD_ALVARAS');
export const showAlvara = createAction('SHOW_ALVARA');
export const setAlvaraPagination = createAction('SET_ALVARA_PAGINATION');

const alvaraReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addAlvara, (state, action) => {
            state.alvaras = [action.payload, ...state.alvaras];
        })
        .addCase(editAlvara, (state, action) => {
            state.alvaras = [
                action.payload,
                ...state.alvaras.filter(a => a.id !== action.payload.id),
            ];
        })
        .addCase(removeAlvara, (state, action) => {
            state.alvaras = state.alvaras.filter(a => a.id !== action.payload.id);
        })
        .addCase(addAlvaras, (state, action) => {
            state.alvaras = [...action.payload];
        })
        .addCase(showAlvara, (state, action) => {
            state.alvara = action.payload;
        })
        .addCase(setAlvaraPagination, (state, action) => {
            state.pagination = action.payload;
        });
});

export default alvaraReducer;
