import { Grid } from '@mui/material';
import VisitasEvolucao from '../../../src/components/monitor-aps/VisitasEvolucao';

export default function VisitasEvolucaoPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <VisitasEvolucao />
            </Grid>
        </Grid>
    );
}
