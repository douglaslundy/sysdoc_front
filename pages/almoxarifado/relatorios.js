import { Grid } from '@mui/material';
import RelatoriosPage from '../../src/components/almoxarifado/RelatoriosPage';

export default function AlmoxarifadoRelatoriosPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <RelatoriosPage />
      </Grid>
    </Grid>
  );
}
