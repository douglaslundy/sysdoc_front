import { Grid } from "@mui/material";
import AttendanceService from "../../../src/components/attendance/service";

export default function AttendanceServicePage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <AttendanceService />
      </Grid>
    </Grid>
  );
}

