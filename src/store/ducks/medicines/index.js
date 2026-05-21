import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    medicines: [],
    medicine: {},
    pagination: null,
};

export const addMedicine = createAction('ADD_MEDICINE');
export const editMedicine = createAction('EDIT_MEDICINE');
export const removeMedicine = createAction('REMOVE_MEDICINE');
export const addMedicines = createAction('ADD_MEDICINES');
export const showMedicine = createAction('SHOW_MEDICINE');
export const setMedicinePagination = createAction('SET_MEDICINE_PAGINATION');
export const clearMedicinesState = createAction('CLEAR_MEDICINES_STATE');

const medicinesReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addMedicine, (state, action) => {
            state.medicines = [action.payload, ...state.medicines];
        })
        .addCase(editMedicine, (state, action) => {
            state.medicines = [action.payload, ...state.medicines.filter(m => m.id !== action.payload.id)];
        })
        .addCase(removeMedicine, (state, action) => {
            state.medicines = state.medicines.filter(m => m.id !== action.payload.id);
        })
        .addCase(addMedicines, (state, action) => {
            state.medicines = [...action.payload];
        })
        .addCase(showMedicine, (state, action) => {
            state.medicine = action.payload;
        })
        .addCase(setMedicinePagination, (state, action) => {
            state.pagination = action.payload;
        })
        .addCase(clearMedicinesState, () => {
            return INITIAL_STATE;
        });
});

export default medicinesReducer;
