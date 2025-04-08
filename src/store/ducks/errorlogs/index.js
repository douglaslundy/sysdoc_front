import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  errorlogs: [],
  errorlog: {},
};

export const addErrorLog = createAction('ADD_ERRORLOG');
export const addErrorLogs = createAction('ADD_ERRORLOGS');
export const showErrorLog = createAction('SHOW_ERRORLOG');

const errorLogReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addErrorLog persiste no banco e insere um elemento na lista errorlogs
    .addCase(addErrorLog, (state, action) => {
      state.errorlogs = [action.payload, ...state.errorlogs];
    })

    // addErrorLogs cria a lista de errorlogs através de consulta no banco
    .addCase(addErrorLogs, (state, action) => {
      state.errorlogs = [...action.payload];
    })

    // showErrorLog define o erro selecionado
    .addCase(showErrorLog, (state, action) => {
      state.errorlog = action.payload;
    });
});

export default errorLogReducer;
