import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	calls: [],
	call: {}

}


export const addCall = createAction('ADD_CALL');
export const editCall = createAction('EDIT_CALL');
export const addCalls = createAction('ADD_CALLS');
export const showCall = createAction('SHOW_CALL');
export const inactiveCall = createAction('INACTIVE_CALL');


export default createReducer(INITIAL_STATE, {
    
	[addCall.type]: (state, action) => ({ calls: [action.payload, ...state.calls] }),
    
	[editCall.type]: (state, action) => ({ calls: [action.payload, ...state.calls.filter((call) => call.id !== action.payload.id)] }),
    
	[inactiveCall.type]: (state, action) => ({ calls: [...state.calls.filter((call) => call.id !== action.payload.id)] }),
    
	[addCalls.type]: (state, action) => ({ calls: [...action.payload] }),

	[showCall.type]: (state, action) => ({ ...state, call: action.payload }),
});

