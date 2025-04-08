import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  rooms: [],
  room: {}
};

export const addRoom = createAction('ADD_ROOM');
export const editRoom = createAction('EDIT_ROOM');
export const addRooms = createAction('ADD_ROOMS');
export const showRoom = createAction('SHOW_ROOM');
export const inactiveRoom = createAction('INACTIVE_ROOM');

const roomReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addRoom, (state, action) => {
      state.rooms = [action.payload, ...state.rooms];
    })
    .addCase(editRoom, (state, action) => {
      state.rooms = [action.payload, ...state.rooms.filter(serv => serv.id !== action.payload.id)];
    })
    .addCase(inactiveRoom, (state, action) => {
      state.rooms = state.rooms.filter(serv => serv.id !== action.payload.id);
    })
    .addCase(addRooms, (state, action) => {
      state.rooms = [...action.payload];
    })
    .addCase(showRoom, (state, action) => {
      state.room = action.payload;
    });
});

export default roomReducer;
