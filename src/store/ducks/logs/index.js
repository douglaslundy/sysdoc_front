import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  logs: [],
  log: {},
  total: 0,
  perPage: 50,
  currentPage: 1,
};

export const addLog = createAction('ADD_LOG');
export const addLogs = createAction('ADD_LOGS');
export const setLogsMeta = createAction('SET_LOGS_META');
export const showLog = createAction('SHOW_LOG');

const logReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addLog, (state, action) => {
      state.logs = [action.payload, ...state.logs];
    })
    .addCase(addLogs, (state, action) => {
      state.logs = [...action.payload];
    })
    .addCase(setLogsMeta, (state, action) => {
      state.total = action.payload.total;
      state.perPage = action.payload.per_page;
      state.currentPage = action.payload.current_page;
    })
    .addCase(showLog, (state, action) => {
      state.log = action.payload;
    });
});

export default logReducer;
