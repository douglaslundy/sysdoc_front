import { createSlice } from '@reduxjs/toolkit';

const labConfigSlice = createSlice({
    name: 'labConfig',
    initialState: { config: null, loading: false },
    reducers: {
        setConfig(state, action) { state.config = action.payload; },
        setLoading(state, action) { state.loading = action.payload; },
    },
});

export const { setConfig, setLoading } = labConfigSlice.actions;
export default labConfigSlice.reducer;
