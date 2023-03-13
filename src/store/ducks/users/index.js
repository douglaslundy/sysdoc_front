import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	users: [],
	user: {}
}


export const addUser = createAction('ADD_USER');
export const editUser = createAction('EDIT_USER');
export const addUsers = createAction('ADD_USERS');
export const showUser = createAction('SHOW_USER');
export const inactiveUser = createAction('INACTIVE_USER');


export default createReducer(INITIAL_STATE, {

	// addUser  persiste no banco insere um elemento na lista users
	[addUser.type]: (state, action) => ({ users: [action.payload, ...state.users] }),

	// editUser  persiste no banco uma atualização e altera o elemento na lista users
	[editUser.type]: (state, action) => ({ users: [action.payload, ...state.users.filter((u) => u.id !== action.payload.id)] }),	

	// editUser  persiste no banco uma atualização de inativação e remove o elemento na lista users
	[inactiveUser.type]: (state, action) => ({ users: [...state.users.filter((u) => u.id !== action.payload.id)] }),

	// addUsers cria a lista de unites atraves de consulta no banco
	[addUsers.type]: (state, action) => ({ users: [...action.payload] }),

	[showUser.type]: (state, action) => ({ ...state, user: action.payload }),
});
