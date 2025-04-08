import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  specialities: [],
  speciality: {}
};

export const addSpeciality = createAction('ADD_SPECIALITY');
export const editSpeciality = createAction('EDIT_SPECIALITY');
export const addSpecialities = createAction('ADD_SPECIALITIES');
export const showSpeciality = createAction('SHOW_SPECIALITY');
export const inactiveSpeciality = createAction('INACTIVE_SPECIALITY');

const specialityReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addSpeciality, (state, action) => {
      state.specialities = [action.payload, ...state.specialities];
    })
    .addCase(editSpeciality, (state, action) => {
      state.specialities = [action.payload, ...state.specialities.filter(spec => spec.id !== action.payload.id)];
    })
    .addCase(inactiveSpeciality, (state, action) => {
      state.specialities = state.specialities.filter(spec => spec.id !== action.payload.id);
    })
    .addCase(addSpecialities, (state, action) => {
      state.specialities = [...action.payload];
    })
    .addCase(showSpeciality, (state, action) => {
      state.speciality = action.payload;
    });
});

export default specialityReducer;
