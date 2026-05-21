import { Grid } from "@mui/material";
import Speciality from "../src/components/specialities";

const Tables = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <Speciality />
            </Grid>
        </Grid>
    );
};

export default Tables;
