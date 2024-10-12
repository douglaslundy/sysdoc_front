import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    routes: [],
    route: {}

}


export const addRoute = createAction('ADD_ROUTE');
export const editRoute = createAction('EDIT_ROUTE');
export const addRoutes = createAction('ADD_ROUTES');
export const showRoute = createAction('SHOW_ROUTE');
export const inactiveRoute = createAction('INACTIVE_ROUTE');


export default createReducer(INITIAL_STATE, {

    [addRoute.type]: (state, action) => ({ routes: [action.payload, ...state.routes] }),

    [editRoute.type]: (state, action) => ({ routes: [action.payload, ...state.routes.filter((spec) => spec.id !== action.payload.id)] }),

    [inactiveRoute.type]: (state, action) => ({ routes: [...state.routes.filter((spec) => spec.id !== action.payload.id)] }),

    [addRoutes.type]: (state, action) => ({ routes: [...action.payload] }),

    [showRoute.type]: (state, action) => ({ ...state, route: action.payload }),
});

