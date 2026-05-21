import { Grid } from "@mui/material";
import Ordinances from "../src/components/ordinances";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Ordinances />
      </Grid>
    </Grid>
  );
};

export default Tables;
