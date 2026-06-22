import { Grid } from '@mui/material';
import AdminSystemNotices from '../src/components/systemNotices/AdminSystemNotices';

export default function NoticesPage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <AdminSystemNotices />
      </Grid>
    </Grid>
  );
}
