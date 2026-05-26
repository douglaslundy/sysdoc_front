import { Grid } from '@mui/material';
import PharmacyStockImportManager from '../../src/components/pharmacy/stockImport';

export default function PharmacyStockImportPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <PharmacyStockImportManager />
      </Grid>
    </Grid>
  );
}
