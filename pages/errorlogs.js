import { Grid } from "@mui/material";
import ErrorLogs from "../src/components/errorlogs";

const Tables = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <ErrorLogs />
            </Grid>
        </Grid>
    );
};

export default Tables;
