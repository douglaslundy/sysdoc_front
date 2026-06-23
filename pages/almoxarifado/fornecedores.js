import { Grid } from '@mui/material';
import FornecedoresPage from '../../src/components/almoxarifado/FornecedoresPage';

export default function AlmoxarifadoFornecedoresPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <FornecedoresPage />
      </Grid>
    </Grid>
  );
}
