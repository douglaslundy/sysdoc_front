import { Grid } from '@mui/material';
import ProdutosPage from '../../src/components/almoxarifado/ProdutosPage';

export default function AlmoxarifadoProdutosPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <ProdutosPage />
      </Grid>
    </Grid>
  );
}
