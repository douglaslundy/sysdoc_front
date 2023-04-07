import { Grid } from "@mui/material";
import Models from "../src/components/models";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Models />
      </Grid>
    </Grid>
  );
};

export default Tables;
