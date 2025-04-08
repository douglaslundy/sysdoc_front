import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  queues: [],
  queue: {}
};

export const addQueue = createAction('ADD_QUEUE');
export const editQueue = createAction('EDIT_QUEUE');
export const addQueues = createAction('ADD_QUEUES');
export const showQueue = createAction('SHOW_QUEUE');
export const inactiveQueue = createAction('INACTIVE_QUEUE');

const queueReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addQueue, (state, action) => {
      state.queues = [action.payload, ...state.queues];
    })
    .addCase(editQueue, (state, action) => {
      state.queues = [action.payload, ...state.queues.filter(q => q.id !== action.payload.id)];
    })
    .addCase(inactiveQueue, (state, action) => {
      state.queues = state.queues.filter(q => q.id !== action.payload.id);
    })
    .addCase(addQueues, (state, action) => {
      state.queues = [...action.payload];
    })
    .addCase(showQueue, (state, action) => {
      state.queue = action.payload;
    });
});

export default queueReducer;
