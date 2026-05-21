import { Grid } from '@mui/material';
import VisitasAcs from '../../src/components/monitor-aps/VisitasAcs';

export default function MonitorApsVisitasPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <VisitasAcs />
            </Grid>
        </Grid>
    );
}
