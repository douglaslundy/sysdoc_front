import { Box, Grid, Skeleton, Typography } from '@mui/material';

export function DashboardLoading() {
    return (
        <Box>
            <Grid container spacing={3}>
                {Array.from({ length: 4 }).map((_, index) => (
                    <Grid item xs={12} sm={6} lg={3} key={`metric-${index}`}>
                        <Skeleton variant="rounded" height={126} />
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={3} mt={0.5}>
                {Array.from({ length: 2 }).map((_, index) => (
                    <Grid item xs={12} md={6} key={`chart-${index}`}>
                        <Skeleton variant="rounded" height={320} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export function getDashboardErrorMessage(modulo, erro) {
    const status = erro?.response?.status;
    const base = `Falha ao carregar o dashboard de ${modulo}.`;

    if (status === 401) return `${base} Sessao expirada. Faca login novamente.`;
    if (status === 403) return `${base} Você não tem permissão para este módulo.`;
    if (status === 429) return `${base} Muitas requisicoes em sequencia. Tente novamente em instantes.`;
    if (status >= 500) return `${base} Erro interno do servidor.`;
    if (status >= 400) return `${base} Requisicao invalida (${status}).`;

    return `${base} Dados indisponiveis no ambiente atual.`;
}

export function DashboardErro({ message = 'Dados indisponiveis.' }) {
    return (
        <Box p={4} textAlign="center">
            <Typography color="textSecondary">{message}</Typography>
        </Box>
    );
}
