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
import VehicleModal from "../modal/vehicles";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllVehicles, inactiveVehicleFetch } from "../../store/fetchActions/vehicles";
import { showVehicle } from "../../store/ducks/vehicles";
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
    const { vehicles } = useSelector(state => state.vehicles);
    const [searchValue, setSearchValue] = useState();
    const [allVehicles, setAllVehicles] = useState(vehicles);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllVehicles());
    }, []);

    useEffect(() => {
        setAllVehicles(searchValue ? [...vehicles.filter(vehicle => vehicle.license_plate.toString().includes(searchValue.toString()))] : vehicles);
    }, [vehicles]);

    const HandleEditVehicle = async vehicle => {
        dispatch(showVehicle(vehicle));
        dispatch(turnModal());
    }

    const HandleInactiveVehicle = async vehicle => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a Sala ${vehicle.license_plate}`, confirm: inactiveVehicleFetch(vehicle) })
        dispatch(changeTitleAlert(` O Veiculo ${vehicle.brand.toUpperCase()} ${vehicle.model.toUpperCase()} PLACA ${vehicle.license_plate.toUpperCase()} foi excluida com sucesso!`))
    }


    const searchVehicles = ({ target }) => {

        setSearchValue(target.value);

        setAllVehicles([...vehicles.filter(
            speci => speci.license_plate && speci.license_plate.toString().toLowerCase().includes(target.value.toString().toLowerCase())
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
        <BaseCard title={`Você possui ${allVehicles.length} Veiculos Cadastrados`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar veículo por placa"
                    name="search"
                    value={searchValue}
                    onChange={searchVehicles}

                    inputProps={{
                        style: {
                            textTransform: "uppercase",
                        },
                        maxLength: 50,
                        autoComplete: "off", // Desativa o preenchimento automático
                    }}

                />

                <VehicleModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="user-plus" />
                    </Fab>
                </VehicleModal>
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
                                    PLACA
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    MARCA MODELO COR / CAPACIDADE
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    RENAVAN / CHASSI
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
                        {allVehicles
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((vehicle, index) => (
                                <StyledTableRow key={vehicle.id} hover>
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
                                                        {vehicle.license_plate && vehicle.license_plate.substring(0, 10).toUpperCase()}
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
                                                        {vehicle.brand && vehicle.brand.substring(0, 10).toUpperCase()} {vehicle.model && vehicle.model.substring(0, 10).toUpperCase()} - {vehicle.color && vehicle.color.substring(0, 10).toUpperCase()} / {vehicle.year && vehicle.year}
                                                    </Typography>
                                                    <Typography>
                                                        {vehicle.capacity && vehicle.capacity} Lugares
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
                                                        {vehicle.renavan && vehicle.renavan.substring(0, 15).toUpperCase()}
                                                    </Typography>

                                                    <Typography>
                                                        {vehicle.chassis && vehicle.chassis.substring(0, 15).toUpperCase()}
                                                    </Typography>

                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Editar Veículo" onClick={() => { HandleEditVehicle(vehicle) }} color="primary" size="medium" variant="contained"
                                                    disabled={profile != "admin" && vehicle.id_user != user}>
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir Veículo" onClick={() => { HandleInactiveVehicle(vehicle) }} color="error" size="medium" variant="contained"
                                                    // disabled={vehicle.id_user == user || profile == "admin" ? allVehicles.length - index !== allVehicles.length : true}>
                                                    disabled={profile != "admin" && vehicle.id_user != user}>
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
                    count={allVehicles.length}
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
