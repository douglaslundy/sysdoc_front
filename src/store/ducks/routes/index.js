import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  routes: [],
  route: {}
};

export const addRoute = createAction('ADD_ROUTE');
export const editRoute = createAction('EDIT_ROUTE');
export const addRoutes = createAction('ADD_ROUTES');
export const showRoute = createAction('SHOW_ROUTE');
export const inactiveRoute = createAction('INACTIVE_ROUTE');

const routesReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(addRoute, (state, action) => {
      state.routes = [action.payload, ...state.routes];
    })
    .addCase(editRoute, (state, action) => {
      state.routes = [action.payload, ...state.routes.filter(spec => spec.id !== action.payload.id)];
    })
    .addCase(inactiveRoute, (state, action) => {
      state.routes = state.routes.filter(spec => spec.id !== action.payload.id);
    })
    .addCase(addRoutes, (state, action) => {
      state.routes = [...action.payload];
    })
    .addCase(showRoute, (state, action) => {
      state.route = action.payload;
    });
});

export default routesReducer;
