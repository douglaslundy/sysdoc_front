import { Grid } from "@mui/material";
import ListaPedidos from "../../../src/components/laboratorio/pedidos";

const LaboratorioPedidos = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <ListaPedidos />
            </Grid>
        </Grid>
    );
};

export default LaboratorioPedidos;
