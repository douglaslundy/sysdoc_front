import { Grid } from "@mui/material";
import Letters from "../src/components/letters";
import { parseCookies } from 'nookies';

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Letters />
      </Grid>
    </Grid>
  );
};

export default Tables;
