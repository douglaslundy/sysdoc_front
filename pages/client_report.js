import { Grid } from "@mui/material";
import Report from "../src/components/client_report";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Report />
      </Grid>
    </Grid>
  );
};

export default Tables;