import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    trips: [],
    trip: {}

}


export const addTrip = createAction('ADD_TRIP');
export const editTrip = createAction('EDIT_TRIP');
export const addTrips = createAction('ADD_TRIPS');
export const showTrip = createAction('SHOW_TRIP');
export const inactiveTrip = createAction('INACTIVE_TRIP');


export default createReducer(INITIAL_STATE, {

    [addTrip.type]: (state, action) => ({ trips: [action.payload, ...state.trips] }),

    [editTrip.type]: (state, action) => ({ trips: [action.payload, ...state.trips.filter((spec) => spec.id !== action.payload.id)] }),

    [inactiveTrip.type]: (state, action) => ({ trips: [...state.trips.filter((spec) => spec.id !== action.payload.id)] }),

    [addTrips.type]: (state, action) => ({ trips: [...action.payload] }),

    [showTrip.type]: (state, action) => ({ ...state, trip: action.payload }),
});

