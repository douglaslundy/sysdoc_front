import { Grid } from '@mui/material';
import MedicineComplianceDashboard from '../../src/components/pharmacy/compliance';

export default function PharmacyCompliancePage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <MedicineComplianceDashboard />
            </Grid>
        </Grid>
    );
}

