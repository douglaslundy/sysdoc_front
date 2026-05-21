import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    logs: [],
    total: 0,
    perPage: 50,
    currentPage: 1,
};

export const setAuditLogs = createAction('SET_AUDIT_LOGS');

const auditLogsReducer = createReducer(INITIAL_STATE, (builder) => {
    builder.addCase(setAuditLogs, (state, action) => {
        state.logs        = action.payload.data;
        state.total       = action.payload.total;
        state.perPage     = action.payload.per_page;
        state.currentPage = action.payload.current_page;
    });
});

export default auditLogsReducer;
