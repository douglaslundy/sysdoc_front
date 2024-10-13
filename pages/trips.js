import { Grid } from "@mui/material";
import Trips from "../src/components/trips";

const Tables = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <Trips />
            </Grid>
        </Grid>
    );
};

export default Tables;
