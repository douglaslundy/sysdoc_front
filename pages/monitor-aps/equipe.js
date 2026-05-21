import { Grid } from '@mui/material';
import PorEquipe from '../../src/components/monitor-aps/PorEquipe';

export default function MonitorApsEquipePage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <PorEquipe />
            </Grid>
        </Grid>
    );
}
