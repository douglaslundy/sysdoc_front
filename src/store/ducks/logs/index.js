import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    logs: [],
    log: {},

}


export const addLog = createAction('ADD_LOG');
export const addLogs = createAction('ADD_LOGS');
export const showLog = createAction('SHOW_LOG');


export default createReducer(INITIAL_STATE, {

    // addLog  persiste no banco insere um elemento na lista logs
    [addLog.type]: (state, action) => ({ logs: [action.payload, ...state.logs] }),

    // addLogs cria a lista de loges atraves de consulta no banco
    [addLogs.type]: (state, action) => ({ logs: [...action.payload] }),

    [showLog.type]: (state, action) => ({ ...state, log: action.payload }),
});

