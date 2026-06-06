import { Grid } from "@mui/material";
import AttendanceTickets from "../../src/components/attendance/tickets";

export default function AttendanceTicketsPage() {
  return (
    <Grid container spacing={0} className="attendance-page attendance-tickets-page">
      <Grid item xs={12}>
        <AttendanceTickets />
      </Grid>
    </Grid>
  );
}
