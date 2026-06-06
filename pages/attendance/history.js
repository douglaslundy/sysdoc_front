import { Grid } from "@mui/material";
import AttendanceHistory from "../../src/components/attendance/history";

export default function AttendanceHistoryPage() {
  return (
    <Grid container spacing={0} className="attendance-page attendance-history-page">
      <Grid item xs={12}>
        <AttendanceHistory />
      </Grid>
    </Grid>
  );
}
