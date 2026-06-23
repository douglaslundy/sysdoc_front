import { Grid } from '@mui/material';
import CategoriasPage from '../../src/components/almoxarifado/CategoriasPage';

export default function AlmoxarifadoCategoriasPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <CategoriasPage />
      </Grid>
    </Grid>
  );
}
