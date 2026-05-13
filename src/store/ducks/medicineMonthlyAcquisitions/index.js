import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    monthlyAcquisitions: [],
    pagination: null,
};

export const addMonthlyAcquisitions = createAction('ADD_MONTHLY_ACQUISITIONS');
export const upsertMonthlyAcquisition = createAction('UPSERT_MONTHLY_ACQUISITION');
export const setMonthlyAcquisitionsPagination = createAction('SET_MONTHLY_ACQUISITIONS_PAGINATION');
export const clearMonthlyAcquisitionsState = createAction('CLEAR_MONTHLY_ACQUISITIONS_STATE');

const medicineMonthlyAcquisitionsReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addMonthlyAcquisitions, (state, action) => {
            state.monthlyAcquisitions = [...action.payload];
        })
        .addCase(upsertMonthlyAcquisition, (state, action) => {
            state.monthlyAcquisitions = [
                action.payload,
                ...state.monthlyAcquisitions.filter(s => s.id !== action.payload.id),
            ];
        })
        .addCase(setMonthlyAcquisitionsPagination, (state, action) => {
            state.pagination = action.payload;
        })
        .addCase(clearMonthlyAcquisitionsState, () => {
            return INITIAL_STATE;
        });
});

export default medicineMonthlyAcquisitionsReducer;
