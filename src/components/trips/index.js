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
import TripModal from "../modal/trips";
import TripClientsModal from "../modal/trips/clients";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { excludeTripFetch, getAllTrips, inactiveTripFetch } from "../../store/fetchActions/trips";
import { showTrip } from "../../store/ducks/trips";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";

import AlertModal from "../messagesModal";
import { parseISO, format } from 'date-fns';


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
    const { trips } = useSelector(state => state.trips);
    const [searchValue, setSearchValue] = useState();
    const [allTrips, setAllTrips] = useState(trips);
    const [option, setOption] = useState('add');

    useEffect(() => {
        dispatch(getAllTrips());
    }, []);

    useEffect(() => {
        setAllTrips(searchValue ? [...trips.filter(trip => trip.license_plate.toString().includes(searchValue.toString()))] : trips);
    }, [trips]);

    const HandleEditTrip = async trip => {
        dispatch(showTrip(trip));
        dispatch(turnModal());
    }

    const HandleInactiveTrip = async trip => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a viagem ${trip.id}`, confirm: excludeTripFetch(trip.id) })
        dispatch(changeTitleAlert(`A viagem ${trip.id}  foi excluida com sucesso!`))
    }


    const searchTrips = ({ target }) => {

        setSearchValue(target.value);

        setAllTrips([...trips.filter(
            speci => speci.license_plate && speci.license_plate.toString().toLowerCase().includes(target.value.toString().toLowerCase())
        )]);
    }

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const HandleGoAddClients = trip => {
        setOption('addCli');
        dispatch(showTrip(trip));
        dispatch(turnModal());
    };

    const HandleGoTrip = trip => {
        setOption('addTrip');
        dispatch(showTrip(trip));
        dispatch(turnModal());
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const SwitchModal = ({ option }) => {
        switch (option) {
            case 'addCli':
                return <TripClientsModal />;
            case 'addTrip':
                return <TripModal />;
            default:
                return <></>;
        }
    };


    return (
        <BaseCard title={`Você possui ${allTrips.length} Viagens Cadastrados`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

                <SwitchModal option={option} />

                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar viagem por destino"
                    name="search"
                    value={searchValue}
                    onChange={searchTrips}

                    inputProps={{
                        style: {
                            textTransform: "uppercase",
                        },
                        maxLength: 50,
                        autoComplete: "off", // Desativa o preenchimento automático
                    }}

                />

                <Fab onClick={() => { HandleGoTrip() }} color="primary" aria-label="add">
                    <FeatherIcon icon="user-plus" />
                </Fab>
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
                                    MOTORISTA / VEÍCULO
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    ROTA / HORÁRIO
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    LOTAÇÃO
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
                        {allTrips
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((trip, index) => (
                                <StyledTableRow key={trip.id} hover>
                                    <>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Typography variant="h6"
                                                    sx={{
                                                        fontWeight: "600",
                                                        fontSize: "20px",
                                                    }}
                                                >
                                                    {trip.id && trip.id}
                                                </Typography>
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
                                                    {trip.driver ?
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: "600",
                                                                fontSize: "18px",
                                                            }}
                                                        >
                                                            {trip.driver.name?.toUpperCase()}
                                                        </Typography>

                                                        :
                                                        <Typography
                                                            variant="h6"
                                                        >
                                                            MOTORISTA NÃO ATRIBUIDO
                                                        </Typography>
                                                    }

                                                    <Typography
                                                        variant="h6"
                                                    >
                                                        {/* {trip.vehicle ? trip.vehicle.brand.toUpperCase() : 'VEÍCULO NÃO ATRIBUIDO'}  {trip.vehicle && trip.vehicle.model.toUpperCase()}  {trip.vehicle && trip.vehicle.license_plate.toUpperCase()} */}
                                                        {trip.vehicle ? `${trip.vehicle?.brand.toUpperCase()} ${trip.vehicle?.model.toUpperCase()} ${trip.vehicle?.license_plate.toUpperCase()} - ${trip.vehicle?.capacity} LUGARES ` : 'VEÍCULO NÃO ATRIBUIDO'}
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
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: "600",
                                                        fontSize: "18px",
                                                    }}
                                                >
                                                    {trip.route && trip.route.origin.toUpperCase()} X {trip.route && trip.route.destination.toUpperCase()}
                                                </Typography>
                                            </Box>

                                            <Typography
                                                variant="h6"
                                            >
                                                {trip.departure_date && format(parseISO(trip.departure_date), 'dd/MM/yyyy')} {trip.departure_time && trip.departure_time}
                                            </Typography>

                                        </TableCell>

                                        <TableCell>
                                            <Button title="Passageiros incluindo acompanhantes" onClick={() => { HandleGoAddClients(trip) }} color="success" size="medium" variant="contained">
                                                <FeatherIcon icon="users" width="20" height="20" />
                                                <div style={{ marginLeft: '5px' }}>
                                                    {trip.clients && trip.clients.length}
                                                </div>
                                            </Button>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Editar Viagem" onClick={() => { HandleGoTrip(trip) }} color="primary" size="medium" variant="contained">
                                                    {/* disabled={profile != "admin" && trip.id_user != user}> */}
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir Viagem" onClick={() => { HandleInactiveTrip(trip) }} color="error" size="medium" variant="contained">
                                                    {/* // disabled={trip.id_user == user || profile == "admin" ? allTrips.length - index !== allTrips.length : true}> */}
                                                    {/* disabled={profile != "admin" && trip.id_user != user}> */}
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
                    count={allTrips.length}
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
