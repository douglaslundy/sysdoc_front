import { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';

import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
    styled,
    FormControlLabel,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Typography,
    TablePagination
} from "@mui/material";


import BaseCard from "../../../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";

import { turnModal, changeTitleAlert } from '../../../../store/ducks/Layout';
import { insertClientTrip, excludeClientTripFetch } from '../../../../store/fetchActions/trips';
import AlertModal from '../../../messagesModal';
import InputSelectClient from '../../../inputs/inputSelectClient';
import { getAllClients } from '../../../../store/fetchActions/clients';
import Select from '../../../inputs/selects';
import { showTrip } from '../../../../store/ducks/trips';
import ConfirmDialog from "../../../confirmDialog";


const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "90%",
    height: "98%",
    bgcolor: 'background.paper',
    border: '0px solid #000',
    boxShadow: 24,
    p: 4,
    overflow: "scroll",
};

export default function TripClientsModal(props) {

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });


    const dispatch = useDispatch();
    const { trip } = useSelector(state => state.trips);
    const { isOpenModal } = useSelector(state => state.layout);
    const { clients } = useSelector(state => state.clients);
    const [form, setForm] = useState({
        id: "",
        client_id: "",
        person_type: "",
        destination_location: ""
    });

    const { person_type, destination_location } = form;

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [cli, setClient] = useState([]);
    const [texto, setTexto] = useState();


    // const { person_type, destination_location } = form;



    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };


    const cleanForm = () => {
        setForm({
            id: "",
            client_id: "",
            person_type: "",
            destination_location: ""
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showTrip({}));
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSaveData = async () => {
        trip && trip.id ? handlePutData() : null
    }


    const HandleExcludeTrip = async cli => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a o passageiro? `, confirm: excludeClientTripFetch(cli) })
        dispatch(changeTitleAlert(`Passageiro foi excluido com sucesso!`))
    }

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`O Cliente foi inserido na viagem com sucesso!`));
        dispatch(insertClientTrip(form));
    };

    const handleClose = () => {
        cleanForm();
    };

    // Carregar os dados do trip ao iniciar
    useEffect(() => {
        if (trip && trip.id) {
            setForm(prevForm => ({
                ...prevForm,
                id: trip.id
            }));
        }
    }, [trip]);


    // Atualiza o client_id quando o cliente é selecionado
    useEffect(() => {
        setForm(prevForm => ({
            ...prevForm,
            client_id: cli?.id
        }));
    }, [cli]);

    const typesOfPerson = [
        {
            id: "passenger",
            name: "PASSAGEIRO"
        }, {
            id: "companion",
            name: "ACOMPANHANTE"
        }
    ]

    // Carrega os clientes quando o modal é aberto
    useEffect(() => {
        if (isOpenModal) {
            if (clients.length <= 0) {
                dispatch(getAllClients());
            }
        } else {
            setClient({});
        }
    }, [isOpenModal]);


    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box sx={style}>

                    <AlertModal />

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={`VIAGEM ${form.id} - ${trip?.route?.origin.toUpperCase()} X ${trip?.route?.destination.toUpperCase()} - VEÍCULO ${trip?.vehicle?.brand.toUpperCase()} ${trip?.vehicle?.model.toUpperCase()} PLACA ${trip?.vehicle?.license_plate.toUpperCase()} - ${trip?.vehicle?.capacity} LUGARES`}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>


                                    {
                                        isOpenModal &&

                                        <InputSelectClient
                                            id="client_id"
                                            label="Selecione o cliente"
                                            name="client_id"
                                            clients={clients}
                                            setClient={setClient}
                                            wd={"100%"}
                                        />

                                    }

                                    <Select
                                        value={person_type}
                                        label={'QUALIFIQUE O CLIENTE'}
                                        name={'person_type'}
                                        store={typesOfPerson}
                                        changeItem={changeItem}
                                    />

                                    <TextField
                                        id="destination_location"
                                        label={destination_location && destination_location > 0 ? `LOCAL DE DESTINO: ${300 - destination_location} caracteres restantes` : 'LOCAL DE DESTINO'}
                                        multiline
                                        rows={2}
                                        value={destination_location ? destination_location : ''}
                                        name="destination_location"
                                        // disabled={queue?.id ? true : false}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 50
                                        }}
                                    />
                                </Stack>
                                {/* </FormGroup> */}
                                <br />
                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={handleSaveData} variant="contained" mt={2}>
                                        Gravar
                                    </Button>

                                    <Button onClick={() => { cleanForm() }} variant="outlined" mt={2}>
                                        Cancelar
                                    </Button>
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
                                                        NOME
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography color="textSecondary" variant="h6">
                                                        TIPO
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography color="textSecondary" variant="h6">
                                                        DESTINO
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
                                            {trip?.clients ?
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((cli, index) => (
                                                        <StyledTableRow key={cli.id} hover>
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
                                                                                fontSize: "18px",
                                                                            }}
                                                                        >
                                                                            {cli.name && cli.name.toUpperCase()}
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
                                                                        <Typography
                                                                            variant="h6"
                                                                        >
                                                                            {cli.pivot.person_type && cli.pivot.person_type == "passenger" ? "PASSAGEIRO" : "ACOMPANHANTE"}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>


                                                                <TableCell>
                                                                    <Typography
                                                                        variant="h6"
                                                                    >
                                                                        {cli.pivot.destination_location && cli.pivot.destination_location.substring(0, 30).toUpperCase()}
                                                                    </Typography>
                                                                </TableCell>

                                                                <TableCell align="center">
                                                                    <Box sx={{ "& button": { mx: 1 } }}>

                                                                        <Button title="Excluir Viagem" onClick={() => { HandleExcludeTrip(cli.id) }} color="error" size="medium" variant="contained">
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
                                        count={trip?.clients?.length}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
                                </TableContainer>

                                <ConfirmDialog
                                    confirmDialog={confirmDialog}
                                    setConfirmDialog={setConfirmDialog} />

                            </BaseCard>
                        </Grid>
                    </Grid>

                </Box>
            </Modal>
        </div>
    );
}