import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    exames: [],
    exame: {},
    pagination: null,
};

export const addExame = createAction('ADD_EXAME');
export const editExame = createAction('EDIT_EXAME');
export const removeExame = createAction('REMOVE_EXAME');
export const addExames = createAction('ADD_EXAMES');
export const showExame = createAction('SHOW_EXAME');
export const setExamePagination = createAction('SET_EXAME_PAGINATION');

const examesReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addExame, (state, action) => {
            state.exames = [action.payload, ...state.exames];
        })
        .addCase(editExame, (state, action) => {
            state.exames = [
                action.payload,
                ...state.exames.filter(e => e.id !== action.payload.id),
            ];
        })
        .addCase(removeExame, (state, action) => {
            state.exames = state.exames.filter(e => e.id !== action.payload.id);
        })
        .addCase(addExames, (state, action) => {
            state.exames = [...action.payload];
        })
        .addCase(showExame, (state, action) => {
            state.exame = action.payload;
        })
        .addCase(setExamePagination, (state, action) => {
            state.pagination = action.payload;
        });
});

export default examesReducer;
