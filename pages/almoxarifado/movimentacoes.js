import { Grid } from '@mui/material';
import MovimentacoesPage from '../../src/components/almoxarifado/MovimentacoesPage';

export default function AlmoxarifadoMovimentacoesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <MovimentacoesPage />
      </Grid>
    </Grid>
  );
}
