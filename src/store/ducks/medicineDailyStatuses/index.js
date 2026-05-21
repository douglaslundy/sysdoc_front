import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    dailyStatuses: [],
    pagination: null,
};

export const addDailyStatuses = createAction('ADD_DAILY_STATUSES');
export const upsertDailyStatus = createAction('UPSERT_DAILY_STATUS');
export const setDailyStatusesPagination = createAction('SET_DAILY_STATUSES_PAGINATION');
export const clearDailyStatusesState = createAction('CLEAR_DAILY_STATUSES_STATE');

const medicineDailyStatusesReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addDailyStatuses, (state, action) => {
            state.dailyStatuses = [...action.payload];
        })
        .addCase(upsertDailyStatus, (state, action) => {
            state.dailyStatuses = [
                action.payload,
                ...state.dailyStatuses.filter(s => s.id !== action.payload.id),
            ];
        })
        .addCase(setDailyStatusesPagination, (state, action) => {
            state.pagination = action.payload;
        })
        .addCase(clearDailyStatusesState, () => {
            return INITIAL_STATE;
        });
});

export default medicineDailyStatusesReducer;
