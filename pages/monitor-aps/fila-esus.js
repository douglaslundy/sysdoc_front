import { Grid } from '@mui/material';
import FilaEsus from '../../src/components/painel-esus/FilaEsus';

export default function FilaEsusPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <FilaEsus />
            </Grid>
        </Grid>
    );
}
