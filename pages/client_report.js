import { Grid } from "@mui/material";
import ClientReport from "../src/components/client_report";

const ClientReportPage = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12} lg={12}>
        <ClientReport />
      </Grid>
    </Grid>
  );
};

export default ClientReportPage;
