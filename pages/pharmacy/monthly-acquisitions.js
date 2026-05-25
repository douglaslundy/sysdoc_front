import { Grid } from '@mui/material';
import MonthlyAcquisitionsManager from '../../src/components/pharmacy/monthlyAcquisitions';

export default function MonthlyAcquisitionsPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <MonthlyAcquisitionsManager />
            </Grid>
        </Grid>
    );
}

