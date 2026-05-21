import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  user: {},
  token: '',
  isAuthenticate: false
};

export const addUser = createAction('ADD_USER');
export const addToken = createAction('ADD_TOKEN');
export const remToken = createAction('REM_TOKEN');
export const isAuth = createAction('IS_AUTH');

const userReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addUser, (state, action) => {
      state.user = action.payload;
    })
    .addCase(addToken, (state, action) => {
      state.token = action.payload;
    })
    .addCase(remToken, (state) => {
      state.token = '';
    })
    .addCase(isAuth, (state, action) => {
      state.isAuthenticate = action.payload;
    });
});

export default userReducer;
