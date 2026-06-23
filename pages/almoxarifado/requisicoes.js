import { Grid } from '@mui/material';
import RequisicoesPage from '../../src/components/almoxarifado/RequisicoesPage';

export default function AlmoxarifadoRequisicoesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <RequisicoesPage />
      </Grid>
    </Grid>
  );
}
