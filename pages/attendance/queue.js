import { Grid } from "@mui/material";
import AttendanceQueue from "../../src/components/attendance/queue";

export default function AttendanceQueuePage() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <AttendanceQueue />
      </Grid>
    </Grid>
  );
}

