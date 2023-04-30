import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	services: [],
	service: {}

}


export const addService = createAction('ADD_SERVICE');
export const editService = createAction('EDIT_SERVICE');
export const addServices = createAction('ADD_SERVICES');
export const showService = createAction('SHOW_SERVICE');
export const inactiveService = createAction('INACTIVE_SERVICE');


export default createReducer(INITIAL_STATE, {
    
	[addService.type]: (state, action) => ({ services: [action.payload, ...state.services] }),
    
	[editService.type]: (state, action) => ({ services: [action.payload, ...state.services.filter((serv) => serv.id !== action.payload.id)] }),
    
	[inactiveService.type]: (state, action) => ({ services: [...state.services.filter((serv) => serv.id !== action.payload.id)] }),
    
	[addServices.type]: (state, action) => ({ services: [...action.payload] }),

	[showService.type]: (state, action) => ({ ...state, service: action.payload }),
});

