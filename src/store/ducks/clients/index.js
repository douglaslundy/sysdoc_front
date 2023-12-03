import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	clients: [],
	client: {}
}


export const addClient = createAction('ADD_CLIENT');
export const editClient = createAction('EDIT_CLIENT');
export const addClients = createAction('ADD_CLIENTS');
export const showClient = createAction('SHOW_CLIENT');
export const inactiveClient = createAction('INACTIVE_CLIENT');


export default createReducer(INITIAL_STATE, {

	// addClient  persiste no banco insere um elemento na lista clients
	[addClient.type]: (state, action) => ({ clients: [action.payload, ...state.clients] }),

	// editClient  persiste no banco uma atualização e altera o elemento na lista clients
	[editClient.type]: (state, action) => ({ clients: [action.payload, ...state.clients.filter((cli) => cli.id !== action.payload.id)] }),	

	// editClient  persiste no banco uma atualização de inativação e remove o elemento na lista clients
	[inactiveClient.type]: (state, action) => ({ clients: [...state.clients.filter((cli) => cli.id !== action.payload.id)] }),

	// addClients cria a lista de clientes atraves de consulta no banco
	[addClients.type]: (state, action) => ({ clients: [...action.payload] }),


	// [addMessage.type]: (state, action) => ({...state, messages: [ ...state.messages, action.payload ]}),
	// [removeMessage.type]: (state, action) => ({...state, messages: state.messages.filter((msg) => msg !== action.payload )}),

	// [showClient.type]: (state, action) => ({client: [action.payload]}),
	// levei um tempo para entender a logica deste reduce, eu nao estava retornando nele o estado atual com ...state
	// eu retornava somente o clienteShow, assim eu zerava o estado e apagava array de clientes, pois eu retornava um state somente com cliente show 
	[showClient.type]: (state, action) => ({ ...state, client: action.payload }),
});

