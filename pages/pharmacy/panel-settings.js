import { Grid } from '@mui/material';
import MedicinesPanelSettings from '../../src/components/pharmacy/panelSettings';

export default function PanelSettingsPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <MedicinesPanelSettings />
      </Grid>
    </Grid>
  );
}
