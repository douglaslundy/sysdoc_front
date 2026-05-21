import { Grid } from '@mui/material';
import AgendaColeta from '../../src/components/laboratorio/agenda';

const LaboratorioAgenda = () => {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <AgendaColeta />
            </Grid>
        </Grid>
    );
};

export default LaboratorioAgenda;
