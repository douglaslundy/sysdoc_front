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
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllVehicles, inactiveVehicleFetch } from "../../store/fetchActions/vehicles";
import { showVehicle } from "../../store/ducks/vehicles";
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
        dispatch(changeTitleAlert(`O Veículo ${vehicle.brand.toUpperCase()} ${vehicle.model.toUpperCase()} PLACA ${vehicle.license_plate.toUpperCase()} foi excluído com sucesso!`))
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
        <Box sx={modalFormRootSx} className="queue-page">
        <BaseCard title={`Você possui ${allVehicles.length} Veículos Cadastrados`}>
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
                    placeholder="Pesquisar veículo por placa"
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
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add" sx={{ width: 56, height: 56, boxShadow: "0 0 20px rgba(124,58,237,0.45)" }}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </VehicleModal>
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
                                    PLACA
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    MARCA MODELO COR CAPACIDADE / USUÁRIO
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    RENAVAN / CHASSI
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
                                                        {vehicle.brand && vehicle.brand.substring(0, 10).toUpperCase()} {vehicle.model && vehicle.model.substring(0, 10).toUpperCase()} - {vehicle.color && vehicle.color.substring(0, 10).toUpperCase()} - {vehicle.year && vehicle.year} / {vehicle.capacity && vehicle.capacity} Lugares
                                                    </Typography>
                                                    <Typography
                                                        variant="h6"
                                                    >
                                                        {vehicle.user && vehicle.user.name.toUpperCase()}
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

                                                <Button title="Editar Veículo" onClick={() => { HandleEditVehicle(vehicle) }} color="success" size="medium" variant="contained"
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
                <TablePagination className="queue-page__pagination"
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
        </Box>
    );
};


