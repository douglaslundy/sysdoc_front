import { createSlice } from '@reduxjs/toolkit';

const messageLogsSlice = createSlice({
    name: 'messageLogs',
    initialState: { items: [], page: 1, lastPage: 1, total: 0, loading: false },
    reducers: {
        setMessageLogs(state, action) {
            state.items = action.payload.data || [];
            state.page = action.payload.current_page || 1;
            state.lastPage = action.payload.last_page || 1;
            state.total = action.payload.total || 0;
        },
        setLoading(state, action) { state.loading = action.payload; },
    },
});

export const { setMessageLogs, setLoading } = messageLogsSlice.actions;
export default messageLogsSlice.reducer;
