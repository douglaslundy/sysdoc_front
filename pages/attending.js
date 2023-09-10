import { Grid } from "@mui/material";
import Attending from "../src/components/attending";

export default function Index() {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Attending />
      </Grid>      
    </Grid>
  );
}