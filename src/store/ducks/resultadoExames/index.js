import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    resultado: {},
};

export const showResultado = createAction('SHOW_RESULTADO_EXAME');
export const clearResultado = createAction('CLEAR_RESULTADO_EXAME');

const resultadoExamesReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(showResultado, (state, action) => {
            state.resultado = action.payload;
        })
        .addCase(clearResultado, (state) => {
            state.resultado = {};
        });
});

export default resultadoExamesReducer;
