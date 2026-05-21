import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    categorias: [],
    categoria: {},
};

export const addCategoria = createAction('ADD_CATEGORIA_EXAME');
export const editCategoria = createAction('EDIT_CATEGORIA_EXAME');
export const removeCategoria = createAction('REMOVE_CATEGORIA_EXAME');
export const addCategorias = createAction('ADD_CATEGORIAS_EXAME');
export const showCategoria = createAction('SHOW_CATEGORIA_EXAME');

const categoriasExameReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addCategoria, (state, action) => {
            state.categorias = [action.payload, ...state.categorias];
        })
        .addCase(editCategoria, (state, action) => {
            state.categorias = [
                action.payload,
                ...state.categorias.filter(c => c.id !== action.payload.id),
            ];
        })
        .addCase(removeCategoria, (state, action) => {
            state.categorias = state.categorias.filter(c => c.id !== action.payload.id);
        })
        .addCase(addCategorias, (state, action) => {
            state.categorias = [...action.payload];
        })
        .addCase(showCategoria, (state, action) => {
            state.categoria = action.payload;
        });
});

export default categoriasExameReducer;
