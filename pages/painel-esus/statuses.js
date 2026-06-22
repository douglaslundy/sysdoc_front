import { Grid } from '@mui/material';
import PainelEsusStatuses from '../../src/components/painel-esus/statuses';

export default function PainelEsusStatusesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <PainelEsusStatuses />
      </Grid>
    </Grid>
  );
}
