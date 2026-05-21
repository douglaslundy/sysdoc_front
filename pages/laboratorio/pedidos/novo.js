import { Grid } from "@mui/material";
import NovoPedido from "../../../src/components/laboratorio/pedidos/NovoPedido";

const NovoPedidoPage = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <NovoPedido />
            </Grid>
        </Grid>
    );
};

export default NovoPedidoPage;
