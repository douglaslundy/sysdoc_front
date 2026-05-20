import { Grid } from '@mui/material';
import ConfiguracoesAPS from '../../src/components/monitor-aps/Configuracoes';

export default function MonitorApsConfiguracoesPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <ConfiguracoesAPS />
            </Grid>
        </Grid>
    );
}
