import React, { useEffect, useRef, useState } from "react";
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
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";

import { useSelector, useDispatch } from 'react-redux';
import { getAllClients, inactiveClientFetch, viewClientFetch } from "../../store/fetchActions/clients";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { parseISO, format } from 'date-fns';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const StyledTableRow = styled(TableRow)(() => ({
    '& td': {
        backgroundColor: 'rgba(15, 28, 60, 0.55)',
        borderTop: '1px solid rgba(86,127,201,0.22)',
        borderBottom: '1px solid rgba(86,127,201,0.22)',
        paddingTop: '18px',
        paddingBottom: '18px',
    },
    '& td:first-of-type': { borderLeft: '1px solid rgba(86,127,201,0.22)', borderRadius: '14px 0 0 14px' },
    '& td:last-of-type': { borderRight: '1px solid rgba(86,127,201,0.22)', borderRadius: '0 14px 14px 0' },
}));

const safeText = (value, max = 30) => {
    if (!value) return '-';
    return String(value).substring(0, max).toUpperCase();
};

export default function Clients() {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { clients, pagination } = useSelector(state => state.clients);
    const [searchValue, setSearchValue] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const searchRef = useRef(null);

    const buildParams = (overrides = {}) => ({
        page: page + 1,
        per_page: rowsPerPage,
        search: searchValue || undefined,
        ...overrides,
    });

    const handleEditClient = (client) => {
        setConfirmDialog({
            ...confirmDialog,
            isOpen: true,
            title: `Deseja Editar o cliente ${client.name}`,
            confirm: () => dispatch(viewClientFetch(client.id)),
        });
    };

    const handleInactiveClient = (client) => {
        setConfirmDialog({
            ...confirmDialog,
            isOpen: true,
            title: `Deseja Realmente excluir o cliente ${client.name}`,
            confirm: inactiveClientFetch(client),
        });
        dispatch(changeTitleAlert(`O cliente ${client.name} foi inativado com sucesso!`));
    };

    const searchClients = ({ target }) => {
        const value = target.value;
        setSearchValue(value);
        setPage(0);
        clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => {
            dispatch(getAllClients(buildParams({ search: value || undefined, page: 1 })));
        }, 400);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        dispatch(getAllClients(buildParams({ page: newPage + 1 })));
    };

    const handleChangeRowsPerPage = (event) => {
        const value = parseInt(event.target.value, 10);
        setRowsPerPage(value);
        setPage(0);
        dispatch(getAllClients(buildParams({ per_page: value, page: 1 })));
    };

    useEffect(() => {
        dispatch(getAllClients({ page: 1, per_page: rowsPerPage }));
        return () => {
            if (searchRef.current) clearTimeout(searchRef.current);
        };
    }, []);

    useEffect(() => {
        if (pagination?.current_page) {
            setPage(Math.max(0, pagination.current_page - 1));
        }
    }, [pagination?.current_page]);

    return (
        <Box sx={modalFormRootSx}>
            <BaseCard title={`Você possui ${pagination?.total || clients.length} Clientes Cadastrados`}>
                <AlertModal />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mb: 1.2 }}>
                    <TextField
                        className="lg-search-field"
                        sx={{ width: "100%" }}
                        placeholder="Pesquisar cliente: Nome / Telefone / CPF ou CNS"
                        name="search"
                        autoComplete="off"
                        value={searchValue}
                        onChange={searchClients}
                    />

                    <ClientModal>
                        <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add" sx={{ width: 56, height: 56, boxShadow: "0 0 20px rgba(124,58,237,0.45)" }}>
                            <FeatherIcon icon="user-plus" />
                        </Fab>
                    </ClientModal>
                </Box>

                <TableContainer>
                    <Table aria-label="simple table" sx={{ mt: 2, whiteSpace: "nowrap" }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography color="textSecondary" variant="h6">Nome / DN</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Mãe / CPF / CNS</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Telefone / Endereço</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Ações</Typography></TableCell>
                            </TableRow>
                        </TableHead>

                        {clients.length >= 1 ? (
                            <TableBody>
                                {clients.map((client) => (
                                    <StyledTableRow key={client.id} hover>
                                        <TableCell>
                                            <Typography variant="h6" sx={{ fontWeight: "600" }}>
                                                {safeText(client?.name, 35)}
                                            </Typography>
                                            <Typography color="textSecondary" sx={{ fontSize: "13px" }}>
                                                {client?.born_date ? format(parseISO(client.born_date), 'dd/MM/yyyy') : null}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="h6" sx={{ fontWeight: "600" }}>
                                                {safeText(client?.mother, 30)}
                                            </Typography>
                                            <Typography color="textSecondary" sx={{ fontSize: "12px" }}>{client?.cpf}</Typography>
                                            <Typography color="textPrimary" sx={{ fontSize: "12px" }}>{client?.cns}</Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="h6">{client?.phone || '-'}</Typography>
                                            <Typography variant="h6">
                                                {safeText(client?.addresses?.street, 30)}, Nº {client?.addresses?.number || '-'}
                                            </Typography>
                                            <Typography variant="h6">{safeText(client?.addresses?.district, 30)}</Typography>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>
                                                <Button title="Editar cliente" onClick={() => { handleEditClient(client) }} color="success" size="medium" variant="contained">
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir cliente" onClick={() => { handleInactiveClient(client) }} color="error" size="medium" variant="contained">
                                                    <FeatherIcon icon="trash" width="20" height="20" />
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        ) : (
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={4}>Nenhum registro encontrado!</TableCell>
                                </TableRow>
                            </TableBody>
                        )}
                    </Table>
                    <TablePagination
                        component="div"
                        count={pagination?.total || 0}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={PER_PAGE_OPTIONS}
                    />
                </TableContainer>
                <ConfirmDialog
                    confirmDialog={confirmDialog}
                    setConfirmDialog={setConfirmDialog}
                    isAuthenticated
                />
            </BaseCard>
        </Box>
    );
}


