import { Grid } from '@mui/material';
import EspeciesPage from '../../src/components/almoxarifado/EspeciesPage';

export default function AlmoxarifadoEspeciesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <EspeciesPage />
      </Grid>
    </Grid>
  );
}
