import { Grid } from "@mui/material";
import Service from "../src/components/service_calls";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Service />
      </Grid>
    </Grid>
  );
};

export default Tables;
