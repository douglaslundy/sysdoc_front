import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  ordinances: [],
  ordinance: {},
  textOpenAi: ""
};

export const addOrdinance = createAction('ADD_ORDINANCE');
export const editOrdinance = createAction('EDIT_ORDINANCE');
export const addOrdinances = createAction('ADD_ORDINANCES');
export const showOrdinance = createAction('SHOW_ORDINANCE');
export const getTextOpenAi = createAction('GET_TEXT_OPEN_AI_ORDINANCE');
export const inactiveOrdinance = createAction('INACTIVE_ORDINANCE');

const ordinanceReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addOrdinance, (state, action) => {
      state.ordinances = [action.payload, ...state.ordinances];
    })
    .addCase(editOrdinance, (state, action) => {
      state.ordinances = [
        action.payload,
        ...state.ordinances.filter(item => item.id !== action.payload.id)
      ];
    })
    .addCase(inactiveOrdinance, (state, action) => {
      state.ordinances = state.ordinances.filter(item => item.id !== action.payload.id);
    })
    .addCase(addOrdinances, (state, action) => {
      state.ordinances = [...action.payload];
    })
    .addCase(showOrdinance, (state, action) => {
      state.ordinance = action.payload;
    })
    .addCase(getTextOpenAi, (state, action) => {
      state.textOpenAi = action.payload;
    });
});

export default ordinanceReducer;