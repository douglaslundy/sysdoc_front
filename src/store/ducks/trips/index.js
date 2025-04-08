import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  trips: [],
  trip: {}
};

export const addTrip = createAction('ADD_TRIP');
export const editTrip = createAction('EDIT_TRIP');
export const addTrips = createAction('ADD_TRIPS');
export const showTrip = createAction('SHOW_TRIP');
export const inactiveTrip = createAction('INACTIVE_TRIP');

const tripReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addTrip, (state, action) => {
      state.trips = [action.payload, ...state.trips];
    })
    .addCase(editTrip, (state, action) => {
      state.trips = [action.payload, ...state.trips.filter(spec => spec.id !== action.payload.id)];
    })
    .addCase(inactiveTrip, (state, action) => {
      state.trips = state.trips.filter(spec => spec.id !== action.payload.id);
    })
    .addCase(addTrips, (state, action) => {
      state.trips = [...action.payload];
    })
    .addCase(showTrip, (state, action) => {
      state.trip = action.payload;
    });
});

export default tripReducer;
