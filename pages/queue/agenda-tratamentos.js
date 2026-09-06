import { Grid } from "@mui/material";
import TreatmentPlansAgenda from "../../src/components/queue/TreatmentPlansAgenda";

const AgendaTratamentosPage = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
                <TreatmentPlansAgenda />
            </Grid>
        </Grid>
    );
};

export default AgendaTratamentosPage;
