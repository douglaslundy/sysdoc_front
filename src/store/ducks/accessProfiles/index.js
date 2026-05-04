import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    profiles: [],
    profile: {},
    pages: [],
    myPermissions: [],
};

export const addProfiles = createAction('ADD_PROFILES');
export const addProfile = createAction('ADD_PROFILE');
export const editProfile = createAction('EDIT_PROFILE');
export const removeProfile = createAction('REMOVE_PROFILE');
export const showProfile = createAction('SHOW_PROFILE');
export const addPages = createAction('ADD_PAGES');
export const addPage = createAction('ADD_PAGE');
export const editPage = createAction('EDIT_PAGE');
export const removePage = createAction('REMOVE_PAGE');
export const setMyPermissions = createAction('SET_MY_PERMISSIONS');

const accessProfilesReducer = createReducer(INITIAL_STATE, (builder) => {
    builder
        .addCase(addProfiles, (state, action) => { state.profiles = action.payload; })
        .addCase(addProfile, (state, action) => { state.profiles = [action.payload, ...state.profiles]; })
        .addCase(editProfile, (state, action) => {
            state.profiles = state.profiles.map(p => p.id === action.payload.id ? action.payload : p);
        })
        .addCase(removeProfile, (state, action) => {
            state.profiles = state.profiles.filter(p => p.id !== action.payload.id);
        })
        .addCase(showProfile, (state, action) => { state.profile = action.payload; })
        .addCase(addPages, (state, action) => { state.pages = action.payload; })
        .addCase(addPage, (state, action) => { state.pages = [action.payload, ...state.pages]; })
        .addCase(editPage, (state, action) => {
            state.pages = state.pages.map(p => p.id === action.payload.id ? action.payload : p);
        })
        .addCase(removePage, (state, action) => {
            state.pages = state.pages.filter(p => p.id !== action.payload.id);
        })
        .addCase(setMyPermissions, (state, action) => { state.myPermissions = action.payload; });
});

export default accessProfilesReducer;
