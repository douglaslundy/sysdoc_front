import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	rooms: [],
	room: {}

}


export const addRoom = createAction('ADD_ROOM');
export const editRoom = createAction('EDIT_ROOM');
export const addRooms = createAction('ADD_ROOMS');
export const showRoom = createAction('SHOW_ROOM');
export const inactiveRoom = createAction('INACTIVE_ROOM');


export default createReducer(INITIAL_STATE, {
    
	[addRoom.type]: (state, action) => ({ rooms: [action.payload, ...state.rooms] }),
    
	[editRoom.type]: (state, action) => ({ rooms: [action.payload, ...state.rooms.filter((serv) => serv.id !== action.payload.id)] }),
    
	[inactiveRoom.type]: (state, action) => ({ rooms: [...state.rooms.filter((serv) => serv.id !== action.payload.id)] }),
    
	[addRooms.type]: (state, action) => ({ rooms: [...action.payload] }),

	[showRoom.type]: (state, action) => ({ ...state, room: action.payload }),
});

