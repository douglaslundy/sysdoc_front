import { Grid } from '@mui/material';
import DailyStatusManager from '../../src/components/pharmacy/dailyStatus';

export default function DailyStatusPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <DailyStatusManager />
            </Grid>
        </Grid>
    );
}

