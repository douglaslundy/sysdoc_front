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
import RouteModal from "../modal/routes";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllRoutes, inactiveRouteFetch } from "../../store/fetchActions/routes";
import { showRoute } from "../../store/ducks/routes";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";

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
    const { routes } = useSelector(state => state.routes);
    const [searchValue, setSearchValue] = useState();
    const [allRoutes, setAllRoutes] = useState(routes);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllRoutes());
    }, []);

    useEffect(() => {
        setAllRoutes(searchValue ? [...routes.filter(route => route.destination.toString().includes(searchValue.toString()))] : routes);
    }, [routes]);

    const HandleEditRoute = async route => {
        dispatch(showRoute(route));
        dispatch(turnModal());
    }

    const HandleInactiveRoute = async route => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a Sala ${route.license_plate}`, confirm: inactiveRouteFetch(route) })
        dispatch(changeTitleAlert(` A  rota ${route.origin.toUpperCase()} - ${route.destination.toUpperCase()} foi excluida com sucesso!`))
    }


    const searchRoutes = ({ target }) => {

        setSearchValue(target.value);

        setAllRoutes([...routes.filter(
            rout => rout.destination && rout.destination.toString().toLowerCase().includes(target.value.toString().toLowerCase())
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

    return (
        <BaseCard title={`Você possui ${allRoutes.length} Rotas Cadastrados`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar rota por placa"
                    name="search"
                    value={searchValue}
                    onChange={searchRoutes}

                    inputProps={{
                        style: {
                            textTransform: "uppercase",
                        },
                        maxLength: 50,
                        autoComplete: "off", // Desativa o preenchimento automático
                    }}

                />

                <RouteModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="user-plus" />
                    </Fab>
                </RouteModal>
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
                                    ID
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    ORIGEM X DESTINO / USUÁRIO
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    DISTÂNCIA
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
                        {allRoutes
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((route, index) => (
                                <StyledTableRow key={route.id} hover>
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
                                                            fontSize: "20px",
                                                        }}
                                                    >
                                                        {route.id && route.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>


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
                                                            fontSize: "18px",
                                                        }}
                                                    >
                                                        {route.origin && route.origin.substring(0, 30).toUpperCase()} X {route.destination && route.destination.substring(0, 30).toUpperCase()}
                                                    </Typography>

                                                    <Typography>
                                                        {route.user && route.user.name.substring(0, 30).toUpperCase()}
                                                    </Typography>

                                                </Box>
                                            </Box>
                                        </TableCell>

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
                                                            fontSize: "14px",
                                                        }}
                                                    >
                                                        {route.distance && route.distance} KM
                                                    </Typography>

                                                    <Typography>
                                                        {route.chassis && route.chassis.substring(0, 15).toUpperCase()}
                                                    </Typography>

                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Editar Rota" onClick={() => { HandleEditRoute(route) }} color="primary" size="medium" variant="contained"
                                                    disabled={profile != "admin" && route.id_user != user}>
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir Rota" onClick={() => { HandleInactiveRoute(route) }} color="error" size="medium" variant="contained"
                                                    // disabled={route.id_user == user || profile == "admin" ? allRoutes.length - index !== allRoutes.length : true}>
                                                    disabled={profile != "admin" && route.id_user != user}>
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
                    count={allRoutes.length}
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
