import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    queues: [],
    queue: {}

}


export const addQueue = createAction('ADD_QUEUE');
export const editQueue = createAction('EDIT_QUEUE');
export const addQueues = createAction('ADD_QUEUES');
export const showQueue = createAction('SHOW_QUEUE');
export const inactiveQueue = createAction('INACTIVE_QUEUE');


export default createReducer(INITIAL_STATE, {

    [addQueue.type]: (state, action) => ({ queues: [action.payload, ...state.queues] }),

    [editQueue.type]: (state, action) => ({ queues: [action.payload, ...state.queues.filter((q) => q.id !== action.payload.id)] }),

    [inactiveQueue.type]: (state, action) => ({ queues: [...state.queues.filter((q) => q.id !== action.payload.id)] }),

    [addQueues.type]: (state, action) => ({ queues: [...action.payload] }),

    [showQueue.type]: (state, action) => ({ ...state, queue: action.payload }),
});

