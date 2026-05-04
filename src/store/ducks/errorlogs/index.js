import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  errorlogs: [],
  errorlog: {},
  total: 0,
  perPage: 50,
  currentPage: 1,
};

export const addErrorLog = createAction('ADD_ERRORLOG');
export const addErrorLogs = createAction('ADD_ERRORLOGS');
export const setErrorLogsMeta = createAction('SET_ERRORLOGS_META');
export const showErrorLog = createAction('SHOW_ERRORLOG');

const errorLogReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addErrorLog, (state, action) => {
      state.errorlogs = [action.payload, ...state.errorlogs];
    })
    .addCase(addErrorLogs, (state, action) => {
      state.errorlogs = [...action.payload];
    })
    .addCase(setErrorLogsMeta, (state, action) => {
      state.total = action.payload.total;
      state.perPage = action.payload.per_page;
      state.currentPage = action.payload.current_page;
    })
    .addCase(showErrorLog, (state, action) => {
      state.errorlog = action.payload;
    });
});

export default errorLogReducer;
