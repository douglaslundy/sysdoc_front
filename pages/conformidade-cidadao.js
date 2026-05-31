import { Grid } from '@mui/material';
import ConformidadeCidadao from '../src/components/conformidadeCidadao';
import AuthGuard from '../src/components/authGuard';

export default function ConformidadeCidadaoPage() {
    return (
        <AuthGuard>
            <Grid container spacing={2} sx={{ p: 2 }}>
                <Grid item xs={12}>
                    <ConformidadeCidadao />
                </Grid>
            </Grid>
        </AuthGuard>
    );
}
