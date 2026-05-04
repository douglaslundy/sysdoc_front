import { Grid } from '@mui/material';
import CategoriasExame from '../../src/components/laboratorio/categorias';

const LaboratorioCategorias = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <CategoriasExame />
            </Grid>
        </Grid>
    );
};

export default LaboratorioCategorias;
