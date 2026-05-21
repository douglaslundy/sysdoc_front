import { Grid } from "@mui/material";
import ExameCatalogo from "../../../src/components/laboratorio/exames";

const LaboratorioExames = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <ExameCatalogo />
            </Grid>
        </Grid>
    );
};

export default LaboratorioExames;
