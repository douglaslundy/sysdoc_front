import { createAction, createReducer } from '@reduxjs/toolkit';

const CHAVE = 'sysdoc.secretariaAtiva';

// localStorage pode lançar (modo privado) ou não existir (SSR): tudo em try/catch.
const gravar = (valor) => {
  try {
    if (valor === null || valor === undefined) window.localStorage.removeItem(CHAVE);
    else window.localStorage.setItem(CHAVE, String(valor));
  } catch (_) {}
};

/** Lê a ativa persistida; só devolve 'all' ou id inteiro positivo (string), senão null. */
export const lerAtiva = () => {
  try {
    const v = window.localStorage.getItem(CHAVE);
    return v === 'all' || /^[1-9]\d*$/.test(v || '') ? v : null;
  } catch (_) {
    return null;
  }
};

/** Ativa válida para a lista recebida; inválida cai no padrão (admin: 'all'; demais: primeira). */
export const resolverAtiva = (ativa, secretarias, podeTodas) => {
  if (ativa === 'all' && podeTodas) return 'all';
  const achada = (secretarias || []).find((s) => String(s.id) === String(ativa));
  if (achada && ativa !== 'all') return String(achada.id);
  return podeTodas ? 'all' : (secretarias?.[0] ? String(secretarias[0].id) : null);
};

export const setAtiva = createAction('secretaria/setAtiva', (id) => {
  const valor = id === null || id === undefined ? null : String(id);
  gravar(valor);
  return { payload: valor };
});
export const limparAtiva = createAction('secretaria/limparAtiva', () => {
  gravar(null);
  return { payload: undefined };
});
export const setLista = createAction('secretaria/setLista');

const INITIAL_STATE = { lista: [], podeTodas: false, ativa: null, carregada: false };

const secretariaReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    .addCase(setAtiva, (state, action) => { state.ativa = action.payload; })
    .addCase(setLista, (state, action) => {
      state.lista = action.payload.secretarias || [];
      state.podeTodas = Boolean(action.payload.pode_todas);
      state.carregada = true;
    })
    .addCase(limparAtiva, () => INITIAL_STATE);
});

export default secretariaReducer;
