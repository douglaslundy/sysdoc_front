import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    errorlogs: [],
    errorlog: {},

}


export const addErrorLog = createAction('ADD_ERRORLOG');
export const addErrorLogs = createAction('ADD_ERRORLOGS');
export const showErrorLog = createAction('SHOW_ERRORLOG');


export default createReducer(INITIAL_STATE, {

    // addErrorLog  persiste no banco insere um elemento na lista errorlogs
    [addErrorLog.type]: (state, action) => ({ errorlogs: [action.payload, ...state.errorlogs] }),

    // addErrorLogs cria a lista de errorloges atraves de consulta no banco
    [addErrorLogs.type]: (state, action) => ({ errorlogs: [...action.payload] }),

    [showErrorLog.type]: (state, action) => ({ ...state, errorlog: action.payload }),
});

