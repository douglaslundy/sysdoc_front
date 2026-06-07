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
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllRoutes, inactiveRouteFetch } from "../../store/fetchActions/routes";
import { showRoute } from "../../store/ducks/routes";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";

import AlertModal from "../messagesModal";


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
    '& td:first-of-type': { borderLeft: '0.5px solid var(--lg-border)', borderRadius: '14px 0 0 14px' },
    '& td:last-of-type': { borderRight: '0.5px solid var(--lg-border)', borderRadius: '0 14px 14px 0' },
    '&:hover td': {
        background: 'var(--queue-row-hover)',
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
        dispatch(changeTitleAlert(`A rota ${route.origin.toUpperCase()} - ${route.destination.toUpperCase()} foi excluída com sucesso!`))
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
        <Box sx={modalFormRootSx} className="queue-page">
        <BaseCard title={`Você possui ${allRoutes.length} rotas cadastradas`}>
            <AlertModal />
            <Box className="queue-page__toolbar" sx={{
                '& > :not(style)': { m: 0 },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
            }}>

                <TextField
                    className="lg-search-field"
                    sx={{ flex: 1, minWidth: 260 }}
                    placeholder="Pesquisar rota por placa"
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
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add" sx={{ width: 56, height: 56, boxShadow: "0 0 20px rgba(124,58,237,0.45)" }}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </RouteModal>
            </Box>

            <TableContainer className="queue-page__table-wrap">

                <Table className="queue-page__table"
                    aria-label="simple table"
                    sx={{
                        mt: 2,
                        whiteSpace: "nowrap",
                    }}
                >
                    <TableHead>
                        <TableRow>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    ID
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    ORIGEM X DESTINO / USUÁRIO
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    DISTÂNCIA
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th" align="center">
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
                                                        {route.origin && route.origin.substring(0, 30).toUpperCase()} - {route.origin_state && route.origin_state} X {route.destination && route.destination.substring(0, 30).toUpperCase()} - {route.destination && route.destination_state}
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

                                                <Button title="Editar Rota" onClick={() => { HandleEditRoute(route) }} color="success" size="medium" variant="contained"
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
                <TablePagination className="queue-page__pagination"
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
        </Box>
    );
};



