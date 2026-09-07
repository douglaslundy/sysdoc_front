import { Grid } from '@mui/material';
import ListaFiscalizacoes from '../src/components/fiscalizacoes';

export default function FiscalizacoesPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <ListaFiscalizacoes />
            </Grid>
        </Grid>
    );
}
