import { Grid } from '@mui/material';
import MedicinesManager from '../../src/components/pharmacy/medicines';

export default function MedicinesPage() {
    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <MedicinesManager />
            </Grid>
        </Grid>
    );
}

