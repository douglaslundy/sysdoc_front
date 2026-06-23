import { Grid } from '@mui/material';
import SecretariasPage from '../../src/components/almoxarifado/SecretariasPage';

export default function AlmoxarifadoSecretariasPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <SecretariasPage />
      </Grid>
    </Grid>
  );
}
