import { Box, CircularProgress, Typography } from '@mui/material';

export function DashboardLoading() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
        </Box>
    );
}

export function DashboardErro() {
    return (
        <Box p={4} textAlign="center">
            <Typography color="textSecondary">Dados não disponíveis.</Typography>
        </Box>
    );
}
