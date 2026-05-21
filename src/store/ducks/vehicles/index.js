import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  vehicles: [],
  vehicle: {}
};

export const addVehicle = createAction('ADD_VEHICLE');
export const editVehicle = createAction('EDIT_VEHICLE');
export const addVehicles = createAction('ADD_VEHICLES');
export const showVehicle = createAction('SHOW_VEHICLE');
export const inactiveVehicle = createAction('INACTIVE_VEHICLE');

const vehicleReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addVehicle persiste no banco e insere um novo veículo na lista
    .addCase(addVehicle, (state, action) => {
      state.vehicles = [action.payload, ...state.vehicles];
    })

    // editVehicle atualiza um veículo existente na lista
    .addCase(editVehicle, (state, action) => {
      state.vehicles = [action.payload, ...state.vehicles.filter(spec => spec.id !== action.payload.id)];
    })

    // inactiveVehicle remove um veículo da lista
    .addCase(inactiveVehicle, (state, action) => {
      state.vehicles = state.vehicles.filter(spec => spec.id !== action.payload.id);
    })

    // addVehicles substitui a lista inteira de veículos por uma nova
    .addCase(addVehicles, (state, action) => {
      state.vehicles = [...action.payload];
    })

    // showVehicle define o veículo selecionado
    .addCase(showVehicle, (state, action) => {
      state.vehicle = action.payload;
    });
});

export default vehicleReducer;
