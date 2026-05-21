import { Grid } from '@mui/material';
import MapaVisitasPage from '../../../src/components/monitor-aps/MapaVisitasPage';

export default function MonitorApsMapaVisitasPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <MapaVisitasPage />
            </Grid>
        </Grid>
    );
}
