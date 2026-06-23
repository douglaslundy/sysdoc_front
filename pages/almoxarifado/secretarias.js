import { Grid } from '@mui/material';
import AlmoxarifadoHome from '../../src/components/almoxarifado';

export default function AlmoxarifadoSecretariasPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <AlmoxarifadoHome />
      </Grid>
    </Grid>
  );
}
