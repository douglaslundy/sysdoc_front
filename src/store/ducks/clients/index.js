import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  clients: [],
  client: {}
};

export const addClient = createAction('ADD_CLIENT');
export const editClient = createAction('EDIT_CLIENT');
export const addClients = createAction('ADD_CLIENTS');
export const showClient = createAction('SHOW_CLIENT');
export const inactiveClient = createAction('INACTIVE_CLIENT');

const clientReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addClient persiste no banco e insere um elemento na lista clients
    .addCase(addClient, (state, action) => {
      state.clients = [action.payload, ...state.clients];
    })

    // editClient persiste no banco uma atualização e altera o elemento na lista clients
    .addCase(editClient, (state, action) => {
      state.clients = [action.payload, ...state.clients.filter(cli => cli.id !== action.payload.id)];
    })

    // inactiveClient persiste no banco uma inativação e remove o elemento na lista clients
    .addCase(inactiveClient, (state, action) => {
      state.clients = state.clients.filter(cli => cli.id !== action.payload.id);
    })

    // addClients cria a lista de clientes através de consulta no banco
    .addCase(addClients, (state, action) => {
      state.clients = [...action.payload];
    })

    // showClient altera o cliente selecionado, mantendo o restante do estado
    .addCase(showClient, (state, action) => {
      state.client = action.payload;
    });
});

export default clientReducer;
