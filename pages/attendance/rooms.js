import { Grid } from "@mui/material";
import AttendanceRooms from "../../src/components/attendance/rooms";

export default function AttendanceRoomsPage() {
  return (
    <Grid container spacing={0} className="attendance-page attendance-rooms-page">
      <Grid item xs={12}>
        <AttendanceRooms />
      </Grid>
    </Grid>
  );
}
