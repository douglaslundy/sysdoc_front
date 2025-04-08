import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  letters: [],
  letter: {},
  textOpenAi: ""
};

export const addLetter = createAction('ADD_LETTER');
export const editLetter = createAction('EDIT_LETTER');
export const addLetters = createAction('ADD_LETTERS');
export const showLetter = createAction('SHOW_LETTER');
export const getTextOpenAi = createAction('GET_TEXT_OPEN_AI');
export const inactiveLetter = createAction('INACTIVE_LETTER');

const letterReducer = createReducer(INITIAL_STATE, (builder) => {
  builder
    // addLetter persiste no banco e insere um elemento na lista letters
    .addCase(addLetter, (state, action) => {
      state.letters = [action.payload, ...state.letters];
    })

    // editLetter persiste no banco uma atualização e altera o elemento na lista letters
    .addCase(editLetter, (state, action) => {
      state.letters = [action.payload, ...state.letters.filter(lett => lett.id !== action.payload.id)];
    })

    // inactiveLetter remove o elemento da lista letters
    .addCase(inactiveLetter, (state, action) => {
      state.letters = state.letters.filter(lett => lett.id !== action.payload.id);
    })

    // addLetters carrega a lista completa de letters
    .addCase(addLetters, (state, action) => {
      state.letters = [...action.payload];
    })

    // showLetter define o letter em destaque
    .addCase(showLetter, (state, action) => {
      state.letter = action.payload;
    })

    // getTextOpenAi define o texto retornado pela IA
    .addCase(getTextOpenAi, (state, action) => {
      state.textOpenAi = action.payload;
    });
});

export default letterReducer;
