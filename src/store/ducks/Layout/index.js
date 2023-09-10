import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    messages: [],
    alertMessages:[],
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

export default createReducer(INITIAL_STATE, {
   [addMessage.type]: (state, action) => ({...state, messages: [ ...state.messages, action.payload ]}),
   [removeMessage.type]: (state, action) => ({...state, messages: state.messages.filter((msg) => msg !== action.payload )}),

   [addAlertMessage.type]: (state, action) => ({...state, alertMessages: [...state.alertMessages, action.payload ]}),
   [removeAlertMessage.type]: (state, action) => ({...state, alertMessages: state.alertMessages.filter((msg) => msg !== action.payload )}),
   
   [turnLoading.type] : (state, action) => ({...state, isOpenLoading: ( !state.isOpenLoading)}),

   [turnModal.type] : (state, action) => ({...state, isOpenModal: ( !state.isOpenModal)}),
   
   [turnUserModal.type] : (state, action) => ({...state, isOpenUserModal: ( !state.isOpenUserModal)}),

   [turnModalViewModel.type] : (state, action) => ({...state, isOpenModelModal: ( !state.isOpenModelModal)}),
   
   [turnModalViewLetter.type] : (state, action) => ({...state, isOpenLetterModal: ( !state.isOpenLetterModal)}),
   
   [turnModalGetSale.type] : (state, action) => ({...state, isOpenModalGetSale: ( !state.isOpenModalGetSale)}),
   
   [turnModalGetSales.type] : (state, action) => ({...state, isOpenModalGetSales: ( !state.isOpenModalGetSales)}),

   [turnAlert.type] : (state, action) => ({...state, isOpenAlert: ( !state.isOpenAlert)}),

   [alterTypeOfAlert.type] : (state, action) => ({...state, typeAlertIsSuccess: ( action.payload)}),

   [changeTitleAlert.type] : (state, action) => ({...state, titleAlert: action.payload}),

   [changeSubTitleALert.type] : (state, action) => ({...state, subTitleAlert: action.payload})
});
