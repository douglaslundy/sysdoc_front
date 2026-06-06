import { Grid } from "@mui/material";
import AttendanceQueue from "../../src/components/attendance/queue";

export default function AttendanceQueuePage() {
  return (
    <Grid container spacing={0} className="attendance-page attendance-queue-page">
      <Grid item xs={12}>
        <AttendanceQueue />
      </Grid>
    </Grid>
  );
}
