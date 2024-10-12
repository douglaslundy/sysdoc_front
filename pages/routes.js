import { Grid } from "@mui/material";
import Routes from "../src/components/routes";

const Tables = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <Routes />
            </Grid>
        </Grid>
    );
};

export default Tables;
