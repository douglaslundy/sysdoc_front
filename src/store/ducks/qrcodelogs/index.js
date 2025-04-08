import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  qrlogs: [],
  qrlog: {},
};

export const addQrCodeLog = createAction('ADD_QRCODELOG');
export const addQrCodeLogs = createAction('ADD_QRCODELOGS');
export const showQrCodeLog = createAction('SHOW_QRCODELOG');

const qrlogReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addQrCodeLog persiste no banco e insere um elemento na lista qrlogs
    .addCase(addQrCodeLog, (state, action) => {
      state.qrlogs = [action.payload, ...state.qrlogs];
    })

    // addQrCodeLogs cria a lista de qrlogs através de consulta no banco
    .addCase(addQrCodeLogs, (state, action) => {
      state.qrlogs = [...action.payload];
    })

    // showQrCodeLog define o qrlog selecionado
    .addCase(showQrCodeLog, (state, action) => {
      state.qrlog = action.payload;
    });
});

export default qrlogReducer;
