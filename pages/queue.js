import { Grid } from "@mui/material";
import Queue from "../src/components/queue";

const Tables = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <Queue />
            </Grid>
        </Grid>
    );
};

export default Tables;
