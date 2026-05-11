import { createSlice } from '@reduxjs/toolkit';

const vigilanciaConfigSlice = createSlice({
    name: 'vigilanciaConfig',
    initialState: { config: null, loading: false },
    reducers: {
        setConfig(state, action) { state.config = action.payload; },
        setLoading(state, action) { state.loading = action.payload; },
    },
});

export const { setConfig, setLoading } = vigilanciaConfigSlice.actions;
export default vigilanciaConfigSlice.reducer;
