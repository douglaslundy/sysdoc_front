import { Grid } from '@mui/material';
import ConsultaMedicamentos from '../../src/components/pharmacy/consultaMedicamentos';

export default function ConsultaMedicamentosPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <ConsultaMedicamentos />
      </Grid>
    </Grid>
  );
}
