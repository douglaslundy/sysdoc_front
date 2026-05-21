import { Grid } from '@mui/material';
import VinculoTerritorial from '../../src/components/monitor-aps/VinculoTerritorial';

export default function MonitorApsVinculoPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <VinculoTerritorial />
            </Grid>
        </Grid>
    );
}
