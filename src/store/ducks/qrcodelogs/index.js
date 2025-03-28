import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    qrlogs: [],
    qrlog: {},

}


export const addQrCodeLog = createAction('ADD_QRCODELOG');
export const addQrCodeLogs = createAction('ADD_QRCODELOGS');
export const showQrCodeLog = createAction('SHOW_QRCODELOG');


export default createReducer(INITIAL_STATE, {

    // addQrCodeLog  persiste no banco insere um elemento na lista logs
    [addQrCodeLog.type]: (state, action) => ({ qrlogs: [action.payload, ...state.qrlogs] }),

    // addQrCodeLogs cria a lista de loges atraves de consulta no banco
    [addQrCodeLogs.type]: (state, action) => ({ qrlogs: [...action.payload] }),

    [showQrCodeLog.type]: (state, action) => ({ ...state, qrlog: action.payload }),
});

