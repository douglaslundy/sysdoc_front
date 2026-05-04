import { Grid } from "@mui/material";
import ExameForm from "../../../src/components/laboratorio/exames/ExameForm";

const NovoExame = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <ExameForm />
            </Grid>
        </Grid>
    );
};

export default NovoExame;
