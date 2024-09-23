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
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllLogs } from "../../store/fetchActions/logs";
import { showLetter } from "../../store/ducks/logs";
import { changeTitleAlert, turnModal, turnModalViewLetter } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";


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
    const { logs } = useSelector(state => state.logs);
    const [searchValue, setSearchValue] = useState();
    const [allLogs, setAllLogs] = useState(logs);
    const { user, profile } = useContext(AuthContext);

    const [use, setUse] = useState(null);
    const users = Array.from(new Set(logs.map(u => u.user)));

    // Transforma a variável years em um array JSON
    const usersExists = Object.values({ ...users }).reduce((acc, u) => {
        // Verifica se o usuário já está no acumulador com base no id
        if (!acc.some(user => user.id === u?.id)) {
            acc.push({
                id: u?.id,
                name: u?.name,
            });
        }
        return acc;
    }, []);


    const changeUser = ({ target }) => {
        setUse(target.value)
    }


    useEffect(() => {
        dispatch(getAllLogs());
    }, []);

    useEffect(() => {
        setAllLogs(use ? logs.filter(log => log.user?.id === use) : logs);
    }, [use, logs]);



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
        <BaseCard title={`Você possui ${allLogs.length} Logs Cadastrados`}>
            <AlertModal />

            <Box sx={{
                '& > :not(style)': { mb: 0, mt: 2 },
                'display': 'flex',
                'justify-content': 'space-between'
            }}
            >
                {/* 
                <TextField
                    sx={{ width: "65%" }}
                    label="Pesquisar ofício"
                    name="search"
                    value={searchValue}
                    onChange={searchLogs}

                /> */}

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
                                    ID / Data
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Usuário / Ação
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Descrição / IP
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    {allLogs.length >= 1 ?
                        <TableBody>
                            {allLogs
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((log, index) => (
                                    <StyledTableRow key={log.id} hover>
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
                                                                fontSize: "16px",
                                                            }}
                                                        >
                                                            {log && log.id}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            {log.created_at && format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
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
                                                            {log && log.user?.name}
                                                            {/* .substring(0, 30).toUpperCase() */}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {log && log.action}
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
                                                            {log && log.description}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {log && log.ip_address}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* <TableCell align="center">
                                                <Box sx={{ "& button": { mx: 1 } }}>

                                                    <Button title="Visualizar Ofício" onClick={() => { HandleViewLetter(log) }} color="success" size="medium" variant="contained">
                                                        <FeatherIcon icon="eye" width="20" height="20" />
                                                    </Button>

                                                    <Button title="Editar Ofício" onClick={() => { HandleEditLetter(log) }} color="primary" size="medium" variant="contained"
                                                        disabled={profile != "admin" && log.id_user != user}>
                                                        <FeatherIcon icon="edit" width="20" height="20" />
                                                    </Button>

                                                    <Button title="Excluir Ofício" onClick={() => { HandleInactiveLetter(log) }} color="error" size="medium" variant="contained"
                                                        disabled={log.id_user == user || profile == "admin" ? allLogs.length - index !== allLogs.length : true}>
                                                        <FeatherIcon icon="trash" width="20" height="20" />
                                                    </Button>

                                                </Box>
                                            </TableCell> */}
                                        </>

                                    </StyledTableRow>
                                ))}
                        </TableBody>

                        :

                        <TableCell align="center">
                            Nenhum registro encontrado!

                        </TableCell>

                    }

                </Table>
                <TablePagination
                    component="div"
                    count={allLogs.length}
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
