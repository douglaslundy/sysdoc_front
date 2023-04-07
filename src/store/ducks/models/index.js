import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	models: [],
    model: {}
}


export const addModels = createAction('ADD_MODELS');
export const showModel = createAction('SHOW_MODEL');


export default createReducer(INITIAL_STATE, {

	// addModels cria a lista de letteres atraves de consulta no banco
	[addModels.type]: (state, action) => ({ models: [...action.payload] }),

	[showModel.type]: (state, action) => ({ ...state, model: action.payload }),
});

