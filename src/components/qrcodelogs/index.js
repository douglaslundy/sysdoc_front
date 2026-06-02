import React, { useState, useEffect, useContext } from "react";
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

import { useSelector, useDispatch } from 'react-redux';
import { getAllQrCodeLogs } from "../../store/fetchActions/qrcodelogs";

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";


const StyledTableRow = styled(TableRow)(() => ({
    '& td': {
        background: 'var(--queue-row-bg)',
        borderTop: '0.5px solid var(--lg-border)',
        borderBottom: '0.5px solid var(--lg-border)',
        paddingTop: 12,
        paddingBottom: 12,
        color: 'var(--queue-text-primary)',
    },
    '& td + td': {
        borderLeft: '0.5px solid rgba(114, 147, 222, 0.24)',
    },
    '& td:first-of-type': {
        borderLeft: '0.5px solid var(--lg-border)',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    '& td:last-of-type': {
        borderRight: '0.5px solid var(--lg-border)',
        borderTopRightRadius: 14,
        borderBottomRightRadius: 14,
    },
    '&:hover td': {
        background: 'var(--queue-row-hover)',
    },
}));

export default () => {

    const dispatch = useDispatch();
    const { qrlogs } = useSelector(state => state.qrlogs);

    const [allQrLogs, setAllQrLogs] = useState(qrlogs);

    useEffect(() => {
        dispatch(getAllQrCodeLogs());
    }, []);

    useEffect(() => {
        setAllQrLogs(qrlogs);
    }, [qrlogs]);



    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={modalFormRootSx} className="queue-page">
        <BaseCard title={`Você possui ${allQrLogs?.length} Logs Cadastrados`}>
            <AlertModal />

            <TableContainer className="queue-page__table-wrap">

                <Table className="queue-page__table"
                    aria-label="simple table"
                    sx={{
                        mt: 3,
                        whiteSpace: "nowrap",
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    PROTOCOLO / ESCANEADO EM / UUID
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    CLIENTE / POSIÇÃO
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    FILA / URGÊNCIA / CADASTRADO EM
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    IP / HOSTNAME
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    AGENTE / LOCALIZAÇÃO
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    {allQrLogs?.length >= 1 ?
                        <TableBody>
                            {allQrLogs
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((log, index) => (
                                    <StyledTableRow key={log.id} hover>
                                        <>
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "left"
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {log && log?.queue_id}
                                                            {/* .substring(0, 30).toUpperCase() */}
                                                        </Typography>

                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            {log?.accessed_at && format(parseISO(log?.accessed_at), 'dd/MM/yyyy HH:mm:ss')}
                                                        </Typography>

                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {log && log?.uuid}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>



                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "left"
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {log && log?.queue?.client?.name?.toUpperCase()}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {log && log?.position}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "left"
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {log && log?.queue?.speciality?.name.substring(0, 15).toUpperCase()}
                                                        </Typography>

                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {log && log?.queue?.urgency == 0 ? 'NORMAL' : 'URGENTE'}
                                                        </Typography>

                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            {log?.queue && format(parseISO(log?.queue?.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "left"
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {log && log?.ip_address}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {log && log?.host_name?.substring(0, 40)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "left"
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {log && log?.user_agent?.substring(0, 100)}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {log && log?.location?.substring(0, 100)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        </>

                                    </StyledTableRow>
                                ))}
                        </TableBody>

                        :

                        <TableBody>
                            <TableRow>
                                <TableCell align="center" colSpan={5}>
                                    Nenhum registro encontrado!
                                </TableCell>
                            </TableRow>
                        </TableBody>

                    }

                </Table>
                <TablePagination className="queue-page__pagination"
                    component="div"
                    count={allQrLogs?.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </BaseCard >
        </Box>
    );
};
