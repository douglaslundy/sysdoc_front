import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	user: {},
    token: '',
    isAuthenticate: false
}


export const addUser = createAction('ADD_USER');
export const addToken = createAction('ADD_TOKEN');
export const remToken = createAction('REM_TOKEN');
export const isAuth = createAction('IS_AUTH');


export default createReducer(INITIAL_STATE, {

    // action.payload são os dados recebidos no dispatch
    // state.user são os dados atuais do state

	// [addUser.type]: (state, action) => ({ user: [action.payload, ...state.user] }),

	[addUser.type]: (state, action) => ({ ...state, user: action.payload }),
    
	[addToken.type]: (state, action) => ({ ...state, token: action.payload }),

	[remToken.type]: (state, action) => ({ ...state, token: '' }),

	[isAuth.type]: (state, action) => ({ ...state, isAuthenticate: action.payload }),
});
