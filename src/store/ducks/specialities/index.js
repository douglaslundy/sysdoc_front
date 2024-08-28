import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    specialities: [],
    speciality: {}

}


export const addSpeciality = createAction('ADD_SPECIALITY');
export const editSpeciality = createAction('EDIT_SPECIALITY');
export const addSpecialities = createAction('ADD_SPECIALITIES');
export const showSpeciality = createAction('SHOW_SPECIALITY');
export const inactiveSpeciality = createAction('INACTIVE_SPECIALITY');


export default createReducer(INITIAL_STATE, {

    [addSpeciality.type]: (state, action) => ({ specialities: [action.payload, ...state.specialities] }),

    [editSpeciality.type]: (state, action) => ({ specialities: [action.payload, ...state.specialities.filter((spec) => spec.id !== action.payload.id)] }),

    [inactiveSpeciality.type]: (state, action) => ({ specialities: [...state.specialities.filter((spec) => spec.id !== action.payload.id)] }),

    [addSpecialities.type]: (state, action) => ({ specialities: [...action.payload] }),

    [showSpeciality.type]: (state, action) => ({ ...state, speciality: action.payload }),
});

