import { Grid } from "@mui/material";
import Logs from "../src/components/qrcodelogs";

const Tables = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <Logs />
            </Grid>
        </Grid>
    );
};

export default Tables;
