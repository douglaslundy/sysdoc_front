import { createAction, createReducer } from '@reduxjs/toolkit';

const INITIAL_STATE = {
    data: {},
};

export const setMedicineCompliance = createAction('SET_MEDICINE_COMPLIANCE');
export const clearMedicineComplianceState = createAction('CLEAR_MEDICINE_COMPLIANCE_STATE');

const medicineComplianceReducer = createReducer(INITIAL_STATE, (builder) => {
    builder.addCase(setMedicineCompliance, (state, action) => {
        state.data = action.payload || {};
    }).addCase(clearMedicineComplianceState, () => {
        return INITIAL_STATE;
    });
});

export default medicineComplianceReducer;
