import { Grid } from "@mui/material";
import SalesOverview from "../src/components/dashboard/SalseOverview";
import Provisoria from "../src/components/dashboard/Provisoria";

export default function Index() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Provisoria />
      </Grid>      
    </Grid>
  );
}