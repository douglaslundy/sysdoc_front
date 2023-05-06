import { Grid } from "@mui/material";
import Call from "../src/components/calls";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Call />
      </Grid>
    </Grid>
  );
};

export default Tables;
