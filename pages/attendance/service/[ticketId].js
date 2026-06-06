import { Grid } from "@mui/material";
import AttendanceService from "../../../src/components/attendance/service";

export default function AttendanceServicePage() {
  return (
    <Grid container spacing={0} className="attendance-page attendance-service-page">
      <Grid item xs={12}>
        <AttendanceService />
      </Grid>
    </Grid>
  );
}
