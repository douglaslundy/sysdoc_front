import React, { useState, useEffect } from "react";
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    styled,
    TableContainer,
    TablePagination,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import Select from '../inputs/selects';
import { useSelector, useDispatch } from 'react-redux';
import { getAllErrorLogs } from "../../store/fetchActions/errorlogs";
import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const getFriendlyError = (log) => {
    const rawType = log?.type || '';
    const type = rawType.split('\\').pop();
    const message = String(log?.message || '').toLowerCase();

    if (type === 'ValidationException') {
        return {
            summary: 'Nao foi possivel salvar porque alguns campos estao invalidos ou ausentes.',
            reason: 'Revise os campos obrigatorios destacados e tente novamente.',
        };
    }

    if (type === 'AuthenticationException') {
        return {
            summary: 'Sua sessao expirou ou voce nao esta autenticado.',
            reason: 'Faca login novamente para continuar.',
        };
    }

    if (type === 'AuthorizationException') {
        return {
            summary: 'Voce nao tem permissao para executar esta acao.',
            reason: 'Solicite acesso ao administrador do sistema.',
        };
    }

    if (type === 'NotFoundHttpException') {
        return {
            summary: 'O recurso solicitado nao foi encontrado.',
            reason: 'Verifique se o item ainda existe ou se o link/rota esta correto.',
        };
    }

    if (type === 'QueryException') {
        return {
            summary: 'Ocorreu uma falha ao processar os dados no banco.',
            reason: 'Pode ser incompatibilidade de estrutura, dado invalido ou indisponibilidade temporaria.',
        };
    }

    if (message.includes('timeout')) {
        return {
            summary: 'A operacao excedeu o tempo esperado.',
            reason: 'Verifique conectividade, carga do servidor ou tente novamente.',
        };
    }

    return {
        summary: 'Ocorreu um erro inesperado durante a operacao.',
        reason: 'Tente novamente. Se persistir, acione o suporte com o ID do log.',
    };
};

export default () => {
    const dispatch = useDispatch();
    const { errorlogs, total } = useSelector(state => state.errorlogs);

    const [use, setUse] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const users = Array.from(new Set(errorlogs.map(u => u.user).filter(Boolean)));
    const usersExists = Object.values({ ...users }).reduce((acc, u) => {
        if (!acc.some(user => user.id === u?.id)) {
            acc.push({ id: u?.id, name: u?.name });
        }
        return acc;
    }, []);

    const changeUser = ({ target }) => setUse(target.value);

    useEffect(() => {
        dispatch(getAllErrorLogs(page + 1, rowsPerPage));
    }, [page, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const displayedLogs = use ? errorlogs.filter(log => log.user?.id === use) : errorlogs;

    return (
        <BaseCard title={`${total} Logs de erro Cadastrados`}>
            <AlertModal />

            <Box sx={{ '& > :not(style)': { mb: 0, mt: 2 }, display: 'flex', justifyContent: 'space-between' }}>
                <Select
                    label="Usuario"
                    name="user"
                    value={use}
                    store={usersExists}
                    changeItem={changeUser}
                    wd={"60%"}
                />
            </Box>

            <TableContainer>
                <Table aria-label="simple table" sx={{ mt: 3, whiteSpace: "nowrap" }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">ID / Usuario / Data</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">Tipo / Arquivo - Linha</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">Mensagem amigavel / Detalhe tecnico</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    {displayedLogs.length >= 1 ? (
                        <TableBody>
                            {displayedLogs.map((errorlog) => {
                                const friendly = getFriendlyError(errorlog);
                                const fileName = errorlog?.file ? errorlog.file.split('/').pop() : '-';
                                const errorType = errorlog?.type ? errorlog.type.split('\\').pop() : '-';

                                return (
                                    <StyledTableRow key={errorlog.id} hover>
                                        <>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontWeight: "600", fontSize: "12px" }}>
                                                            {errorlog.id}
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontSize: "12px" }}>
                                                            {(errorlog.user?.name || 'NAO IDENTIFICADO').toUpperCase()}
                                                        </Typography>
                                                        <Typography color="textSecondary" sx={{ fontSize: "13px" }}>
                                                            {errorlog.created_at && format(parseISO(errorlog.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "left" }}>
                                                    <Box>
                                                        <Typography variant="h6">{errorType}</Typography>
                                                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                                                            {fileName} linha / {errorlog.line || '-'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "left" }}>
                                                    <Box>
                                                        <Typography variant="h6">{friendly.summary}</Typography>
                                                        <Typography color="textSecondary" sx={{ fontSize: "12px", mb: 0.8 }}>
                                                            Motivo: {friendly.reason}
                                                        </Typography>
                                                        <details>
                                                            <summary>Detalhes tecnicos</summary>
                                                            <Typography sx={{ mt: 0.8, fontSize: "12px" }}>
                                                                {errorlog.message || '-'}
                                                            </Typography>
                                                            <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                                                                {errorlog.context ? JSON.stringify(errorlog.context) : '-'}
                                                            </Typography>
                                                        </details>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        </>
                                    </StyledTableRow>
                                );
                            })}
                        </TableBody>
                    ) : (
                        <TableCell align="center">Nenhum registro encontrado!</TableCell>
                    )}
                </Table>
                <TablePagination
                    component="div"
                    count={use ? displayedLogs.length : total}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[25, 50, 100]}
                />
            </TableContainer>
        </BaseCard>
    );
};
