import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    vehicles: [],
    vehicle: {}

}


export const addVehicle = createAction('ADD_VEHICLE');
export const editVehicle = createAction('EDIT_VEHICLE');
export const addVehicles = createAction('ADD_VEHICLES');
export const showVehicle = createAction('SHOW_VEHICLE');
export const inactiveVehicle = createAction('INACTIVE_VEHICLE');


export default createReducer(INITIAL_STATE, {

    [addVehicle.type]: (state, action) => ({ vehicles: [action.payload, ...state.vehicles] }),

    [editVehicle.type]: (state, action) => ({ vehicles: [action.payload, ...state.vehicles.filter((spec) => spec.id !== action.payload.id)] }),

    [inactiveVehicle.type]: (state, action) => ({ vehicles: [...state.vehicles.filter((spec) => spec.id !== action.payload.id)] }),

    [addVehicles.type]: (state, action) => ({ vehicles: [...action.payload] }),

    [showVehicle.type]: (state, action) => ({ ...state, vehicle: action.payload }),
});

