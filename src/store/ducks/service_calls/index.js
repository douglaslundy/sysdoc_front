import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  services: [],
  service: {}
};

export const addService = createAction('ADD_SERVICE');
export const editService = createAction('EDIT_SERVICE');
export const addServices = createAction('ADD_SERVICES');
export const showService = createAction('SHOW_SERVICE');
export const inactiveService = createAction('INACTIVE_SERVICE');

const serviceReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addService, (state, action) => {
      state.services = [action.payload, ...state.services];
    })
    .addCase(editService, (state, action) => {
      state.services = [action.payload, ...state.services.filter(serv => serv.id !== action.payload.id)];
    })
    .addCase(inactiveService, (state, action) => {
      state.services = state.services.filter(serv => serv.id !== action.payload.id);
    })
    .addCase(addServices, (state, action) => {
      state.services = [...action.payload];
    })
    .addCase(showService, (state, action) => {
      state.service = action.payload;
    });
});

export default serviceReducer;
