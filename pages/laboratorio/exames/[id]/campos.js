import { Grid } from "@mui/material";
import GerenciarCampos from "../../../../src/components/laboratorio/exames/GerenciarCampos";

const CamposExame = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <GerenciarCampos />
            </Grid>
        </Grid>
    );
};

export default CamposExame;
