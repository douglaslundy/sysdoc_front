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
import UserModal from "../modal/user";

import { useSelector, useDispatch } from 'react-redux';
import { getAllUsers, inactiveUserFetch } from "../../store/fetchActions/user";
import { showUser } from "../../store/ducks/users";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";


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
    const { users } = useSelector(state => state.users);
    const [searchValue, setSearchValue] = useState();
    const [allUsers, setAllUsers] = useState(users);

    useEffect(() => {
        dispatch(getAllUsers());
    }, []);

    useEffect(() => {
        setAllUsers(users);
    }, [users]);

    const HandleEditUser = async user => {
        dispatch(showUser(user));
        dispatch(turnModal());
    }

    const HandleInactiveUser = async user => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente inativar o usuario ${user.name}`, confirm: inactiveUserFetch(user) })
        dispatch(changeTitleAlert(`O usuário ${user.name} foi inativado com sucesso!`))
    }


    const searchUsers = ({ target }) => {
        setSearchValue(target.value.toLowerCase());
        setAllUsers([...users.filter(use => use.name.toLowerCase().indexOf(searchValue) > -1)]);
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

    return (
        <BaseCard title="Usuários">

            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>
                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar usuarios"
                    name="search"
                    value={searchValue}
                    onChange={searchUsers}

                />

                <UserModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="user-plus" />
                    </Fab>
                </UserModal>
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
                                    Nome
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    CPF / E-mail
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
                        {allUsers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user, index) => (
                                <StyledTableRow key={user && user.id} hover>
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
                                                        {user && user.name ? user.name.toUpperCase() : ''}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {/* {user.profile ? user.profile.toUpperCase() : ''} */}
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
                                                        {user && user.cpf}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {user && user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Editar usuário" onClick={() => { HandleEditUser(user) }} color="primary" size="medium" variant="contained">
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Inativar usuário" onClick={() => { HandleInactiveUser(user) }} color="error" size="medium" variant="contained">
                                                    <FeatherIcon icon="trash" width="20" height="20" />
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
                    count={allUsers.length}
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
