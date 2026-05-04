import { Grid } from '@mui/material';
import MedicosSolicitantes from '../../src/components/laboratorio/medicos';

const LaboratorioMedicos = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <MedicosSolicitantes />
            </Grid>
        </Grid>
    );
};

export default LaboratorioMedicos;
