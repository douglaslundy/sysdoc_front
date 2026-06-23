import { Grid } from '@mui/material';
import ConfiguracoesPage from '../../src/components/almoxarifado/ConfiguracoesPage';

export default function AlmoxarifadoConfiguracoesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <ConfiguracoesPage />
      </Grid>
    </Grid>
  );
}
