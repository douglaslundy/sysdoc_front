import { Grid } from '@mui/material';
import UnidadesPage from '../../src/components/almoxarifado/UnidadesPage';

export default function AlmoxarifadoUnidadesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <UnidadesPage />
      </Grid>
    </Grid>
  );
}
