import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  messages: [],
  alertMessages: [],
  isOpenLoading: false,
  isOpenModal: false,
  isOpenUserModal: false,
  isOpenModelModal: false,
  isOpenLetterModal: false,
  isOpenModalGetSales: false,
  isOpenModalGetSale: false,
  typeAlertIsSuccess: true,
  isOpenAlert: false,
  titleAlert: "Cadastro realizado com sucesso!",
  subTitleAlert: "Clique em ok para fechar!"
};

export const addMessage = createAction('ADD_MESSAGE');
export const removeMessage = createAction('REMOVE_MESSAGE');

export const addAlertMessage = createAction('ADD_ALERT_MESSAGE');
export const removeAlertMessage = createAction('REMOVE_ALERT_MESSAGE');

export const turnLoading = createAction('IS_OPEN_LOADING');
export const turnModal = createAction('IS_OPEN_MODAL');
export const turnUserModal = createAction('IS_OPEN_USER_MODAL');
export const turnModalViewModel = createAction('IS_OPEN_MODEL_MODAL');
export const turnModalViewLetter = createAction('IS_OPEN_LETTER_MODAL');
export const turnModalGetSales = createAction('IS_OPEN_MODAL_GET_SALES');
export const turnModalGetSale = createAction('IS_OPEN_MODAL_GET_SALE');

export const turnAlert = createAction('IS_OPEN_ALERT');
export const alterTypeOfAlert = createAction('ALTER_TYPE_OF_ALERT');
export const changeTitleAlert = createAction('CHANGE_TITLE_ALERT');
export const changeSubTitleALert = createAction('CHANGE_SUB_TITLE_ALERT');

const uiReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addMessage, (state, action) => {
      state.messages.push(action.payload);
    })
    .addCase(removeMessage, (state, action) => {
      state.messages = state.messages.filter(msg => msg !== action.payload);
    })
    .addCase(addAlertMessage, (state, action) => {
      state.alertMessages.push(action.payload);
    })
    .addCase(removeAlertMessage, (state, action) => {
      state.alertMessages = state.alertMessages.filter(msg => msg !== action.payload);
    })
    .addCase(turnLoading, (state) => {
      state.isOpenLoading = !state.isOpenLoading;
    })
    .addCase(turnModal, (state) => {
      state.isOpenModal = !state.isOpenModal;
    })
    .addCase(turnUserModal, (state) => {
      state.isOpenUserModal = !state.isOpenUserModal;
    })
    .addCase(turnModalViewModel, (state) => {
      state.isOpenModelModal = !state.isOpenModelModal;
    })
    .addCase(turnModalViewLetter, (state) => {
      state.isOpenLetterModal = !state.isOpenLetterModal;
    })
    .addCase(turnModalGetSale, (state) => {
      state.isOpenModalGetSale = !state.isOpenModalGetSale;
    })
    .addCase(turnModalGetSales, (state) => {
      state.isOpenModalGetSales = !state.isOpenModalGetSales;
    })
    .addCase(turnAlert, (state) => {
      state.isOpenAlert = !state.isOpenAlert;
    })
    .addCase(alterTypeOfAlert, (state, action) => {
      state.typeAlertIsSuccess = action.payload;
    })
    .addCase(changeTitleAlert, (state, action) => {
      state.titleAlert = action.payload;
    })
    .addCase(changeSubTitleALert, (state, action) => {
      state.subTitleAlert = action.payload;
    });
});

export default uiReducer;
