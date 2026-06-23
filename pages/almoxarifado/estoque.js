import { Grid } from '@mui/material';
import EstoquePage from '../../src/components/almoxarifado/EstoquePage';

export default function AlmoxarifadoEstoquePage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <EstoquePage />
      </Grid>
    </Grid>
  );
}
