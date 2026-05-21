import { Grid } from "@mui/material";
import PreencherResultado from "../../../src/components/laboratorio/resultados";

const ResultadoPage = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <PreencherResultado />
            </Grid>
        </Grid>
    );
};

export default ResultadoPage;
