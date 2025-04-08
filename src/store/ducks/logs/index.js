import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  logs: [],
  log: {},
};

export const addLog = createAction('ADD_LOG');
export const addLogs = createAction('ADD_LOGS');
export const showLog = createAction('SHOW_LOG');

const logReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addLog persiste no banco e insere um elemento na lista logs
    .addCase(addLog, (state, action) => {
      state.logs = [action.payload, ...state.logs];
    })

    // addLogs cria a lista de logs através de consulta no banco
    .addCase(addLogs, (state, action) => {
      state.logs = [...action.payload];
    })

    // showLog define o log selecionado
    .addCase(showLog, (state, action) => {
      state.log = action.payload;
    });
});

export default logReducer;
