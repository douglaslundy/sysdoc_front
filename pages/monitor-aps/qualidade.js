import { Grid } from '@mui/material';
import IndicadoresQualidade from '../../src/components/monitor-aps/IndicadoresQualidade';

export default function MonitorApsQualidadePage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <IndicadoresQualidade />
            </Grid>
        </Grid>
    );
}
