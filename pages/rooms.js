import { Grid } from "@mui/material";
import Room from "../src/components/rooms";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Room />
      </Grid>
    </Grid>
  );
};

export default Tables;
