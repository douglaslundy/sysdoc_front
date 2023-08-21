import { Grid } from "@mui/material";
import Calls from "../src/components/listing_calls";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Calls />
      </Grid>
    </Grid>
  );
};

export default Tables;
