import { Grid } from '@mui/material';
import ListaEstabelecimentos from '../src/components/estabelecimentos';

export default function EstabelecimentosPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <ListaEstabelecimentos />
            </Grid>
        </Grid>
    );
}
