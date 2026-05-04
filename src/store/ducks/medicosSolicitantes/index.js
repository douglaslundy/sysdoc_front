import { createSlice } from '@reduxjs/toolkit';

const medicosSolicitantesSlice = createSlice({
    name: 'medicosSolicitantes',
    initialState: {
        medicos: [],
        medico: {},
    },
    reducers: {
        addMedicos(state, action) {
            state.medicos = action.payload;
        },
        addMedico(state, action) {
            state.medicos = [action.payload, ...state.medicos];
        },
        editMedico(state, action) {
            state.medicos = state.medicos.map(m =>
                m.id === action.payload.id ? action.payload : m
            );
        },
        removeMedico(state, action) {
            state.medicos = state.medicos.filter(m => m.id !== action.payload);
        },
        showMedico(state, action) {
            state.medico = action.payload;
        },
    },
});

export const { addMedicos, addMedico, editMedico, removeMedico, showMedico } =
    medicosSolicitantesSlice.actions;

export default medicosSolicitantesSlice.reducer;
