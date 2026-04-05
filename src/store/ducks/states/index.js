import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  states: [],
  state: {},
};

export const addState = createAction('ADD_STATE');
export const addStates = createAction('ADD_STATES');
export const showState = createAction('SHOW_STATE');

const stateReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addState persiste no banco e insere um elemento na lista states
    .addCase(addState, (state, action) => {
      state.states = [action.payload, ...state.states];
    })

    // addStates cria a lista de states através de consulta no banco
    .addCase(addStates, (state, action) => {
      state.states = [...action.payload];
    })

    // showState define o state selecionado
    .addCase(showState, (state, action) => {
      state.state = action.payload;
    });
});

export default stateReducer;
