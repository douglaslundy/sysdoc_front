import { Grid } from '@mui/material';
import Backup from '../src/components/backup';
import AuthGuard from '../src/components/authGuard';

const BackupPage = () => {
    return (
        <AuthGuard>
            <Grid container spacing={0}>
                <Grid item xs={12} lg={8}>
                    <Backup />
                </Grid>
            </Grid>
        </AuthGuard>
    );
};

export default BackupPage;
