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
  isOpenResultadoModal: false,
  isOpenQueueModal: false,
  isOpenOutcomeQueueModal: false,
  isOpenSpecialitiesModal: false,
  isOpenLetterFormModal: false,
  isOpenPedidoModal: false,
  isOpenOrdinanceModal: false,
  isOpenVehiclesModal: false,
  isOpenRoutesModal: false,
  isOpenCategoriaExameModal: false,
  isOpenClientModal: false,
  isOpenExameModal: false,
  isOpenMedicoSolicitanteModal: false,
  isOpenTripModal: false,
  isOpenTripClientsModal: false,
  typeAlertIsSuccess: true,
  isOpenAlert: false,
  titleAlert: "Cadastro realizado com sucesso!",
  subTitleAlert: "Clique em ok para fechar!"
};

export const addMessage = createAction('ADD_MESSAGE');
export const removeMessage = createAction('REMOVE_MESSAGE');
export const clearMessages = createAction('CLEAR_MESSAGES');

export const addAlertMessage = createAction('ADD_ALERT_MESSAGE');
export const removeAlertMessage = createAction('REMOVE_ALERT_MESSAGE');
export const clearAlertMessages = createAction('CLEAR_ALERT_MESSAGES');

export const turnLoading = createAction('IS_OPEN_LOADING');
export const openLoading = createAction('OPEN_LOADING');
export const closeLoading = createAction('CLOSE_LOADING');
export const turnModal = createAction('IS_OPEN_MODAL');
export const openModal = createAction('OPEN_MODAL');
export const closeModal = createAction('CLOSE_MODAL');
export const turnUserModal = createAction('IS_OPEN_USER_MODAL');
export const turnModalViewModel = createAction('IS_OPEN_MODEL_MODAL');
export const turnModalViewLetter = createAction('IS_OPEN_LETTER_MODAL');
export const turnModalGetSales = createAction('IS_OPEN_MODAL_GET_SALES');
export const turnModalGetSale = createAction('IS_OPEN_MODAL_GET_SALE');

export const turnResultadoModal = createAction('IS_OPEN_RESULTADO_MODAL');
export const turnAlert = createAction('IS_OPEN_ALERT');
export const alterTypeOfAlert = createAction('ALTER_TYPE_OF_ALERT');
export const changeTitleAlert = createAction('CHANGE_TITLE_ALERT');
export const changeSubTitleALert = createAction('CHANGE_SUB_TITLE_ALERT');

export const openQueueModal = createAction('OPEN_QUEUE_MODAL');
export const closeQueueModal = createAction('CLOSE_QUEUE_MODAL');
export const openOutcomeQueueModal = createAction('OPEN_OUTCOME_QUEUE_MODAL');
export const closeOutcomeQueueModal = createAction('CLOSE_OUTCOME_QUEUE_MODAL');
export const openSpecialitiesModal = createAction('OPEN_SPECIALITIES_MODAL');
export const closeSpecialitiesModal = createAction('CLOSE_SPECIALITIES_MODAL');
export const openLetterFormModal = createAction('OPEN_LETTER_FORM_MODAL');
export const closeLetterFormModal = createAction('CLOSE_LETTER_FORM_MODAL');
export const openPedidoModal = createAction('OPEN_PEDIDO_MODAL');
export const closePedidoModal = createAction('CLOSE_PEDIDO_MODAL');
export const openOrdinanceModal = createAction('OPEN_ORDINANCE_MODAL');
export const closeOrdinanceModal = createAction('CLOSE_ORDINANCE_MODAL');
export const openVehiclesModal = createAction('OPEN_VEHICLES_MODAL');
export const closeVehiclesModal = createAction('CLOSE_VEHICLES_MODAL');
export const openRoutesModal = createAction('OPEN_ROUTES_MODAL');
export const closeRoutesModal = createAction('CLOSE_ROUTES_MODAL');
export const openCategoriaExameModal = createAction('OPEN_CATEGORIA_EXAME_MODAL');
export const closeCategoriaExameModal = createAction('CLOSE_CATEGORIA_EXAME_MODAL');
export const openClientModal = createAction('OPEN_CLIENT_MODAL');
export const closeClientModal = createAction('CLOSE_CLIENT_MODAL');
export const openExameModal = createAction('OPEN_EXAME_MODAL');
export const closeExameModal = createAction('CLOSE_EXAME_MODAL');
export const openMedicoSolicitanteModal = createAction('OPEN_MEDICO_SOLICITANTE_MODAL');
export const closeMedicoSolicitanteModal = createAction('CLOSE_MEDICO_SOLICITANTE_MODAL');
export const openTripModal = createAction('OPEN_TRIP_MODAL');
export const closeTripModal = createAction('CLOSE_TRIP_MODAL');
export const openTripClientsModal = createAction('OPEN_TRIP_CLIENTS_MODAL');
export const closeTripClientsModal = createAction('CLOSE_TRIP_CLIENTS_MODAL');

const uiReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addMessage, (state, action) => {
      state.messages.push(action.payload);
    })
    .addCase(removeMessage, (state, action) => {
      state.messages = state.messages.filter(msg => msg !== action.payload);
    })
    .addCase(clearMessages, (state) => {
      state.messages = [];
    })
    .addCase(addAlertMessage, (state, action) => {
      state.alertMessages.push(action.payload);
    })
    .addCase(removeAlertMessage, (state, action) => {
      state.alertMessages = state.alertMessages.filter(msg => msg !== action.payload);
    })
    .addCase(clearAlertMessages, (state) => {
      state.alertMessages = [];
    })
    .addCase(turnLoading, (state) => {
      state.isOpenLoading = !state.isOpenLoading;
    })
    .addCase(openLoading, (state) => {
      state.isOpenLoading = true;
    })
    .addCase(closeLoading, (state) => {
      state.isOpenLoading = false;
    })
    .addCase(turnModal, (state) => {
      state.isOpenModal = !state.isOpenModal;
    })
    .addCase(openModal, (state) => {
      state.isOpenModal = true;
    })
    .addCase(closeModal, (state) => {
      state.isOpenModal = false;
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
    .addCase(turnResultadoModal, (state) => {
      state.isOpenResultadoModal = !state.isOpenResultadoModal;
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
    })
    .addCase(openQueueModal, (state) => { state.isOpenQueueModal = true; })
    .addCase(closeQueueModal, (state) => { state.isOpenQueueModal = false; })
    .addCase(openOutcomeQueueModal, (state) => { state.isOpenOutcomeQueueModal = true; })
    .addCase(closeOutcomeQueueModal, (state) => { state.isOpenOutcomeQueueModal = false; })
    .addCase(openSpecialitiesModal, (state) => { state.isOpenSpecialitiesModal = true; })
    .addCase(closeSpecialitiesModal, (state) => { state.isOpenSpecialitiesModal = false; })
    .addCase(openLetterFormModal, (state) => { state.isOpenLetterFormModal = true; })
    .addCase(closeLetterFormModal, (state) => { state.isOpenLetterFormModal = false; })
    .addCase(openPedidoModal, (state) => { state.isOpenPedidoModal = true; })
    .addCase(closePedidoModal, (state) => { state.isOpenPedidoModal = false; })
    .addCase(openOrdinanceModal, (state) => { state.isOpenOrdinanceModal = true; })
    .addCase(closeOrdinanceModal, (state) => { state.isOpenOrdinanceModal = false; })
    .addCase(openVehiclesModal, (state) => { state.isOpenVehiclesModal = true; })
    .addCase(closeVehiclesModal, (state) => { state.isOpenVehiclesModal = false; })
    .addCase(openRoutesModal, (state) => { state.isOpenRoutesModal = true; })
    .addCase(closeRoutesModal, (state) => { state.isOpenRoutesModal = false; })
    .addCase(openCategoriaExameModal, (state) => { state.isOpenCategoriaExameModal = true; })
    .addCase(closeCategoriaExameModal, (state) => { state.isOpenCategoriaExameModal = false; })
    .addCase(openClientModal, (state) => { state.isOpenClientModal = true; })
    .addCase(closeClientModal, (state) => { state.isOpenClientModal = false; })
    .addCase(openExameModal, (state) => { state.isOpenExameModal = true; })
    .addCase(closeExameModal, (state) => { state.isOpenExameModal = false; })
    .addCase(openMedicoSolicitanteModal, (state) => { state.isOpenMedicoSolicitanteModal = true; })
    .addCase(closeMedicoSolicitanteModal, (state) => { state.isOpenMedicoSolicitanteModal = false; })
    .addCase(openTripModal, (state) => { state.isOpenTripModal = true; })
    .addCase(closeTripModal, (state) => { state.isOpenTripModal = false; })
    .addCase(openTripClientsModal, (state) => { state.isOpenTripClientsModal = true; })
    .addCase(closeTripClientsModal, (state) => { state.isOpenTripClientsModal = false; });
});

export default uiReducer;
