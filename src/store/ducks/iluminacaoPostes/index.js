import { createAction, createReducer } from "@reduxjs/toolkit";
import { ultimos30Dias } from "../../../lib/periodo";

// Padrão sempre Pendentes + últimos 30 dias; a lista reaplica isso ao montar (resetFiltros).
const filtrosPadrao = () => ({ status: "pendentes", busca: "", ...ultimos30Dias() });

const INITIAL_STATE = {
  postes: [],
  pagination: null,
  filtros: filtrosPadrao(),
};

export const setPostes = createAction("SET_ILUMINACAO_POSTES");
export const setPostesPagination = createAction("SET_ILUMINACAO_POSTES_PAGINATION");
export const setFiltros = createAction("SET_ILUMINACAO_FILTROS");
export const resetFiltros = createAction("RESET_ILUMINACAO_FILTROS");

const iluminacaoPostesReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(setPostes, (state, action) => {
      state.postes = [...action.payload];
    })
    .addCase(setPostesPagination, (state, action) => {
      state.pagination = action.payload;
    })
    .addCase(setFiltros, (state, action) => {
      state.filtros = { ...state.filtros, ...action.payload };
    })
    .addCase(resetFiltros, (state) => {
      state.filtros = filtrosPadrao();
    });
});

export default iluminacaoPostesReducer;
