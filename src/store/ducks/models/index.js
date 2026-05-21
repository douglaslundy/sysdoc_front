import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  models: [],
  model: {}
};

export const addModels = createAction('ADD_MODELS');
export const showModel = createAction('SHOW_MODEL');

const modelReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addModels cria a lista de models através de consulta no banco
    .addCase(addModels, (state, action) => {
      state.models = [...action.payload];
    })

    // showModel define o model selecionado
    .addCase(showModel, (state, action) => {
      state.model = action.payload;
    });
});

export default modelReducer;
