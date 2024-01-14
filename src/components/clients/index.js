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
import ClientModal from "../modal/client";

import { useSelector, useDispatch } from 'react-redux';
import { getAllClients, inactiveClientFetch } from "../../store/fetchActions/clients";
import { showClient } from "../../store/ducks/clients";
import { changeTitleAlert, turnModal, turnModalGetPendingSales } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { parseISO, format, setDate } from 'date-fns';

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
    const { clients, client } = useSelector(state => state.clients);
    const [searchValue, setSearchValue] = useState("");
    const [allClients, setAllClients] = useState(clients);

    const HandleEditClient = async client => {

        setConfirmDialog({
            ...confirmDialog, isOpen: true, title: `Deseja Editar o cliente ${client.name}`, confirm:

                () => (
                    dispatch(showClient(client)),
                    dispatch(turnModal())
                )

        })
    }

    const HandleInactiveClient = async client => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente excluir o cliente ${client.name}`, confirm: inactiveClientFetch(client) })
        dispatch(changeTitleAlert(`O cliente ${client.name} foi inativado com sucesso!`))
    }

    const searchClients = ({ target }) => {
        setSearchValue(target.value.toLowerCase());
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


    useEffect(() => {
        dispatch(getAllClients());
    }, []);

    useEffect(() => {
        setAllClients(searchValue ? [...clients.filter(cli => cli.name.toString().includes(searchValue.toString()))] : clients);
    }, [clients]);

    useEffect(() => {
        const removeAccents = str => {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };

        const filteredClients = clients.filter(cli => {
            const search = removeAccents(searchValue.toString().trim().toLowerCase());

            if (!search) {
                return true; // Retorna todos os clientes se nenhum termo de pesquisa for fornecido
            }

            const name = removeAccents(cli.name.toString().trim().toLowerCase());
            const cnsMatch = cli.cns && cli.cns.toString() === search;
            const cpfMatch = cli.cpf && cli.cpf.toString() === search; // Nova condição para pesquisa por CPF
            const phoneMatch = cli?.phone?.includes(search);
            const nameMatch = name.includes(search);

            return cnsMatch || cpfMatch || phoneMatch || nameMatch; // Inclui a pesquisa por CPF na condição de retorno
        });

        setAllClients(filteredClients);
    }, [searchValue]);


    return (
        <BaseCard title={`Você possui ${allClients.length} Clientes Cadastrados`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>
                <TextField
                    sx={{ width: "100%" }}
                    label="Pesquisar cliente: Nome / Telefone / CPF ou CNS"
                    name="search"
                    autoComplete="off"
                    value={searchValue}
                    onChange={searchClients}
                />

                <ClientModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="user-plus" />
                    </Fab>
                </ClientModal>
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
                                    Nome / DN
                                </Typography>
                            </TableCell>
                            {/* <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Endereço
                                </Typography>
                            </TableCell> */}
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    MÃE / CPF / CNS
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Telefone / Endereço / Obs
                                </Typography>
                            </TableCell>

                            <TableCell align="center">
                                <Typography color="textSecondary" variant="h6">
                                    Ações
                                </Typography>
                            </TableCell>

                        </TableRow>
                    </TableHead>

                    {allClients.length >= 1 ?
                        <TableBody>
                            {allClients
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((client, index) => (
                                    <StyledTableRow key={client.id} hover>
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
                                                            }}
                                                        >
                                                            {client?.name.substring(0, 35).toUpperCase()}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            {client?.born_date ? format(parseISO(client?.born_date), 'dd/MM/yyyy') : null}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "left",
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {client?.mother?.substring(0, 30).toUpperCase()}
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {client?.cpf}
                                                        </Typography>
                                                        <Typography
                                                            color="textPrimary"
                                                            sx={{
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {client?.cns}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="h6">{client?.phone}</Typography>
                                                <Typography variant="h6">{client?.addresses?.street.substring(0, 30).toUpperCase()}, Nº {client?.addresses?.number}</Typography>
                                                <Typography variant="h6">{client?.addresses?.district.substring(0, 30).toUpperCase()}</Typography>
                                            </TableCell>

                                            <TableCell align="center">
                                                <Box sx={{ "& button": { mx: 1 } }}>

                                                    <Button title="Editar cliente" onClick={() => { HandleEditClient(client) }} color="success" size="medium" variant="contained">
                                                        <FeatherIcon icon="edit" width="20" height="20" />
                                                    </Button>

                                                    <Button title="Excluir cliente" onClick={() => { HandleInactiveClient(client) }} color="error" size="medium" variant="contained">
                                                        <FeatherIcon icon="trash" width="20" height="20" />
                                                    </Button>


                                                </Box>
                                            </TableCell>
                                        </>

                                    </StyledTableRow>
                                ))}
                        </TableBody>

                        :

                        <TableCell>
                            Nenhum registro encontrado!
                        </TableCell>
                    }
                </Table>
                <TablePagination
                    component="div"
                    count={allClients ? allClients.length : 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog}
                isAuthenticated
            />

        </BaseCard >
    );
};
