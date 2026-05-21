import { Box, CircularProgress, Typography } from '@mui/material';

export function DashboardLoading() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
        </Box>
    );
}

export function getDashboardErrorMessage(modulo, erro) {
    const status = erro?.response?.status;
    const base = `Falha ao carregar o dashboard de ${modulo}.`;

    if (status === 401) return `${base} Sessao expirada. Faca login novamente.`;
    if (status === 403) return `${base} Voce nao tem permissao para este modulo.`;
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
