import { Grid } from '@mui/material';
import LocalizacoesPage from '../../src/components/almoxarifado/LocalizacoesPage';

export default function AlmoxarifadoLocalizacoesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <LocalizacoesPage />
      </Grid>
    </Grid>
  );
}
