import { Grid } from "@mui/material";
import Vehicles from "../src/components/vehicles";

const Tables = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <Vehicles />
            </Grid>
        </Grid>
    );
};

export default Tables;
