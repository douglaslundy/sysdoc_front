import { Grid } from '@mui/material';
import ListaAlvaras from '../src/components/alvaras';

export default function AlvarasPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <ListaAlvaras />
            </Grid>
        </Grid>
    );
}
