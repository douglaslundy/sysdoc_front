import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    campos: [],
    campo: {},
};

export const addCampo = createAction('ADD_EXAME_CAMPO');
export const editCampo = createAction('EDIT_EXAME_CAMPO');
export const removeCampo = createAction('REMOVE_EXAME_CAMPO');
export const addCampos = createAction('ADD_EXAME_CAMPOS');
export const showCampo = createAction('SHOW_EXAME_CAMPO');

const exameCamposReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addCampo, (state, action) => {
            state.campos = [action.payload, ...state.campos];
        })
        .addCase(editCampo, (state, action) => {
            state.campos = [
                action.payload,
                ...state.campos.filter(c => c.id !== action.payload.id),
            ];
        })
        .addCase(removeCampo, (state, action) => {
            state.campos = state.campos.filter(c => c.id !== action.payload.id);
        })
        .addCase(addCampos, (state, action) => {
            state.campos = [...action.payload];
        })
        .addCase(showCampo, (state, action) => {
            state.campo = action.payload;
        });
});

export default exameCamposReducer;
