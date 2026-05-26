import { Grid } from '@mui/material';
import CidadaosPage from '../../src/components/monitor-aps/CidadaosPage';

export default function MonitorApsCidadaosPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <CidadaosPage />
            </Grid>
        </Grid>
    );
}
