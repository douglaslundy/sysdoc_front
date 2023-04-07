import { Grid } from "@mui/material";
import Users from "../src/components/users";

const Tables = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <Users />
      </Grid>
    </Grid>
  );
};

export default Tables;