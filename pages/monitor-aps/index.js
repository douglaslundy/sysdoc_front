import { Grid } from '@mui/material';
import MonitorApsDashboard from '../../src/components/monitor-aps/Dashboard';

export default function MonitorApsDashboardPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <MonitorApsDashboard />
            </Grid>
        </Grid>
    );
}
