import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  calls: [],
  call: {}
};

export const addCall = createAction('ADD_CALL');
export const editCall = createAction('EDIT_CALL');
export const addCalls = createAction('ADD_CALLS');
export const showCall = createAction('SHOW_CALL');
export const inactiveCall = createAction('INACTIVE_CALL');

const callReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addCall, (state, action) => {
      state.calls = [action.payload, ...state.calls];
    })
    .addCase(editCall, (state, action) => {
      state.calls = [action.payload, ...state.calls.filter(call => call.id !== action.payload.id)];
    })
    .addCase(inactiveCall, (state, action) => {
      state.calls = state.calls.filter(call => call.id !== action.payload.id);
    })
    .addCase(addCalls, (state, action) => {
      state.calls = [...action.payload];
    })
    .addCase(showCall, (state, action) => {
      state.call = action.payload;
    });
});

export default callReducer;
