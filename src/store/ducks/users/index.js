import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  users: [],
  user: {}
};

export const addUser = createAction('ADD_USER');
export const editUser = createAction('EDIT_USER');
export const addUsers = createAction('ADD_USERS');
export const showUser = createAction('SHOW_USER');
export const inactiveUser = createAction('INACTIVE_USER');

const userReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addUser persiste no banco e insere um novo user na lista
    .addCase(addUser, (state, action) => {
      state.users = [action.payload, ...state.users];
    })

    // editUser atualiza um user existente na lista
    .addCase(editUser, (state, action) => {
      state.users = [action.payload, ...state.users.filter(u => u.id !== action.payload.id)];
    })

    // inactiveUser remove um user da lista
    .addCase(inactiveUser, (state, action) => {
      state.users = state.users.filter(u => u.id !== action.payload.id);
    })

    // addUsers substitui a lista inteira por uma nova vinda do banco
    .addCase(addUsers, (state, action) => {
      state.users = [...action.payload];
    })

    // showUser define o usuário selecionado
    .addCase(showUser, (state, action) => {
      state.user = action.payload;
    });
});

export default userReducer;
