import React, { useState, useEffect, useContext } from "react";
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Fab,
    Button,
    styled,
    TableContainer,
    TablePagination,
    TextField
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";

import { useSelector, useDispatch } from 'react-redux';
import ConfirmDialog from "../confirmDialog";

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";
import { parseCookies } from "nookies";
import { editCallFetch, startCallFetch, getFilteredCalls } from "../../store/fetchActions/calls";
import { changeTitleAlert } from "../../store/ducks/Layout";


const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export default () => {

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { calls } = useSelector(state => state.calls);
    const [searchValue, setSearchValue] = useState();
    const [allCalls, setAllCalls] = useState(calls);

    // define that query only return today calls
    
    const verb = 'calls/today';
    
    const { 'sysvendas.id': user_id, 'sysvendas.status': status, 'sysvendas.call_service_id': call_service_id, 'sysvendas.room_id': room_id } = parseCookies();

    useEffect(() => {
        dispatch(getFilteredCalls({ status, call_service_id, room_id, verb }));
    }, [])

    useEffect(() => {
        setAllCalls(searchValue ? [...calls.filter(call => call.subject && call.subject.toString().toLowerCase().includes(searchValue.toString().toLowerCase()))] : calls);
    }, [calls]);

    const searchCalls = ({ target }) => {
        setSearchValue(target.value);

        setAllCalls([...calls.filter(
            call => call.subject && call.subject.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                call.id && call.id == target.value
        )]);
    }

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const HandleCallClient = call => {
        call = {
            ...call,
            'is_called': 'now'
        }
        dispatch(changeTitleAlert(`A senha ${call.call_prefix} ${call.call_number} foi chamada com sucesso!`));
        dispatch(editCallFetch(call));
    };

    const HandleStartCall = (call) => {
        dispatch(changeTitleAlert(`Atendimento da senha ${call.call_prefix} ${call.call_number} foi iniciado!`));
        dispatch(startCallFetch(call));
    };

    return (
        <BaseCard title={`Você possui ${allCalls.length} Chamados`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar Chamado"
                    name="search"
                    value={searchValue}
                    onChange={searchCalls}

                />

            </Box>

            <TableContainer>

                <Table
                    aria-label="simple table"
                    sx={{
                        mt: 3,
                        whiteSpace: "nowrap",
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Senha / Data
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Cliente / Assunto
                                </Typography>
                            </TableCell>

                            <TableCell align="center">
                                <Typography color="textSecondary" variant="h6">
                                    Ações
                                </Typography>
                            </TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allCalls
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((call, index) => (
                                <StyledTableRow key={call.id} hover>
                                    <>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                            fontSize: "38px",
                                                        }}
                                                    >
                                                        {call && `${call.call_prefix} ${call.call_number}`}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {call.call_datetime && format(parseISO(call.call_datetime), 'dd/MM/yyyy HH:mm:ss')}
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
                                                            fontSize: "20px",
                                                        }}
                                                    >
                                                        {call.client ? call.client.name : 'Cliente não cadastrado'}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {call.subject ? call.subject.substring(0, 30).toUpperCase() : 'assunto não cadastrado'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Chamar Cliente" onClick={() => { HandleCallClient(call) }} disabled={call.status == 'CLOSED' ? true : false} color="warning" size="medium" variant="contained">
                                                    <FeatherIcon icon="monitor" width="20" height="20" />
                                                </Button>
                                                <Button title="Atender Cliente" onClick={() => { HandleStartCall(call) }} disabled={call.status == 'CLOSED' ? true : false} color="primary" size="medium" variant="contained">
                                                    <FeatherIcon icon="edit-3" width="20" height="20" />
                                                </Button>

                                            </Box>
                                        </TableCell>
                                    </>

                                </StyledTableRow>
                            ))}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={allCalls.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog} />

        </BaseCard >
    );
};
