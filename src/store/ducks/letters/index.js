import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
	letters: [],
	letter: {},
	textOpenAi: ""

}


export const addLetter = createAction('ADD_LETTER');
export const editLetter = createAction('EDIT_LETTER');
export const addLetters = createAction('ADD_LETTERS');
export const showLetter = createAction('SHOW_LETTER');
export const getTextOpenAi = createAction('GET_TEXT_OPEN_AI');
export const inactiveLetter = createAction('INACTIVE_LETTER');


export default createReducer(INITIAL_STATE, {

	// addLetter  persiste no banco insere um elemento na lista letters
	[addLetter.type]: (state, action) => ({ letters: [action.payload, ...state.letters] }),

	// editLetter  persiste no banco uma atualização e altera o elemento na lista letters
	[editLetter.type]: (state, action) => ({ letters: [action.payload, ...state.letters.filter((lett) => lett.id !== action.payload.id)] }),

	[getTextOpenAi.type]: (state, action) => ({...state, textOpenAi: action.payload}),	

	// editLetter  persiste no banco uma atualização de inativação e remove o elemento na lista letters
	[inactiveLetter.type]: (state, action) => ({ letters: [...state.letters.filter((lett) => lett.id !== action.payload.id)] }),

	// addLetters cria a lista de letteres atraves de consulta no banco
	[addLetters.type]: (state, action) => ({ letters: [...action.payload] }),


	// [addMessage.type]: (state, action) => ({...state, messages: [ ...state.messages, action.payload ]}),
	// [removeMessage.type]: (state, action) => ({...state, messages: state.messages.filter((msg) => msg !== action.payload )}),

	// [showLetter.type]: (state, action) => ({letter: [action.payload]}),
	// levei um tempo para entender a logica deste reduce, eu nao estava retornando nele o estado atual com ...state
	// eu retornava somente o lettereShow, assim eu zerava o estado e apagava array de letteres, pois eu retornava um state somente com lettere show 
	[showLetter.type]: (state, action) => ({ ...state, letter: action.payload }),
});

