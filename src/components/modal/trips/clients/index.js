import { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Phone from '../../../inputs/textFields/phone';

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
    TablePagination,
    FormGroup,
    Switch
} from "@mui/material";


import BaseCard from "../../../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";

import { turnModal, changeTitleAlert } from '../../../../store/ducks/Layout';
import { insertClientTrip, editClientTrip, excludeClientTripFetch, confirmedClientTrip, unConfirmedClientTrip } from '../../../../store/fetchActions/trips';
import AlertModal from '../../../messagesModal';
import InputSelectClient from '../../../inputs/inputSelectClient';
import { getAllClients } from '../../../../store/fetchActions/clients';
import Select from '../../../inputs/selects';
import { showTrip } from '../../../../store/ducks/trips';
import ConfirmDialog from "../../../confirmDialog";
import DateTime from '../../../inputs/dateTime';
import { parseISO, format } from "date-fns";


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
        phone: "",
        departure_location: "",
        destination_location: "",
        time: ""
    });

    const { id, person_type, phone, departure_location, destination_location, time } = form;

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [cli, setClient] = useState([]);
    const [texto, setTexto] = useState();


    // const { person_type, destination_location } = form;



    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };


    const cleanFormCancel = () => {
        setForm({
            id: "",
            client_id: "",
            person_type: "",
            phone: "",
            departure_location: "",
            destination_location: "",
            time: ""
        });
        setClient([]);
        setTexto('');
        dispatch(turnModal());
        dispatch(showTrip({}));
    }

    const cleanForm = () => {
        setForm({
            ...form,
            client_id: "",
            person_type: "",
            phone: "",
            departure_location: "",
            destination_location: "",
            time: ""
        });
        setClient([]);
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSaveData = async () => {
        trip && trip?.id ? (cli && cli?.pivot?.id ? handleUpdateClient() : handleSaveClient()) : null
    }


    const HandleExcludeTrip = async cli => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a o passageiro? `, confirm: excludeClientTripFetch(cli) })
        dispatch(changeTitleAlert(`Passageiro foi excluido com sucesso!`))
    }

    const HandleEditClient = async cli => {
        setForm(
            {
                // ...form,
                id: cli.pivot.id,
                trip_id: trip.id,
                client_id: cli.id,
                person_type: cli.pivot.person_type,
                phone: cli.pivot.phone,
                departure_location: cli.pivot.departure_location,
                destination_location: cli.pivot.destination_location,
                // time: cli.pivot.time
                time: new Date(0, 0, 0, ...(cli.pivot.time.split(":"))).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false })
            },
        )
        setClient({ ...cli })
    }

    const handleSaveClient = async () => {
        dispatch(changeTitleAlert(`O Cliente foi inserido na viagem com sucesso!`));
        dispatch(insertClientTrip(form));
    };

    const handleUpdateClient = async () => {
        dispatch(changeTitleAlert(`O Cliente atualizado na viagem com sucesso!`));
        dispatch(editClientTrip(form));
    };

    const handleIsConfirm = async (cli) => {
        if (cli.pivot.is_confirmed == 0) {
            dispatch(changeTitleAlert(`Viagem de ${cli?.name} foi confirmada com sucesso!`));
            dispatch(confirmedClientTrip(cli));
        } else {
            dispatch(changeTitleAlert(`A confirmação da viagem de ${cli?.name} foi revogada com sucesso!`));
            dispatch(unConfirmedClientTrip(cli));
        }
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
                            <BaseCard title={`VIAGEM ${trip?.id} - ${trip?.route?.origin.toUpperCase()} X ${trip?.route?.destination?.toUpperCase()} 
                            
                                ${trip?.vehicle?.brand ? `${" - VEÍCULO " + trip?.vehicle?.brand.toUpperCase()}` : ''} 
                                ${trip?.vehicle?.model ? trip?.vehicle?.model.toUpperCase() : ''} 
                                ${trip?.vehicle?.license_plate ? `${"PLACA " + trip?.vehicle?.license_plate.toUpperCase()}` : ''} 
                                ${trip?.vehicle?.capacity ? `${trip?.vehicle?.capacity} LUGARES` : ''}`}>


                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                {trip?.obs &&
                                    <Alert variant="filled" severity="warning">
                                        {trip.obs}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>

                                    <DateTime
                                        id="time"
                                        label="Horário do compromisso"
                                        name="time"
                                        value={time ? time : ''}
                                        onChange={changeItem}
                                        wd={"20%"}
                                    />

                                    {
                                        isOpenModal &&
                                        (
                                            cli?.id ? (
                                                <TextField
                                                    id={cli?.id_client}
                                                    value={cli?.name || ''}
                                                    name=""
                                                    disabled
                                                />
                                            ) : (
                                                <InputSelectClient
                                                    id="client_id"
                                                    label="SELECIONE O CLIENTE"
                                                    value=""
                                                    name="client_id"
                                                    clients={clients}
                                                    setClient={setClient}
                                                    wd={"100%"}
                                                />
                                            )
                                        )
                                    }

                                    <Box sx={{
                                        '& > :not(style)': { mb: 0 },
                                        'display': 'flex',
                                        'justify-content': 'space-between'
                                    }}
                                    >

                                        <Select
                                            value={person_type ? person_type : ''}
                                            label={'QUALIFIQUE O CLIENTE'}
                                            name={'person_type'}
                                            wd={{ width: '49%', mr: 2 }}
                                            store={typesOfPerson}
                                            changeItem={changeItem}
                                        />


                                        <Phone value={phone ? phone : ''}
                                            label={'Telefone'}
                                            name={'phone'}
                                            sx={{ width: '49%', mr: 0 }}
                                            changeItem={changeItem}
                                        />
                                    </Box>

                                    <TextField
                                        id="departure_location"
                                        label={departure_location && departure_location.length > 0 ? `LOCAL DE SAÍDA:${50 - departure_location.length} caracteres restantes` : 'LOCAL DE SAÍDA'}
                                        multiline
                                        rows={2}
                                        value={departure_location ? departure_location : ''}
                                        name="departure_location"
                                        // disabled={queue?.id ? true : false}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 50
                                        }}
                                    />


                                    <TextField
                                        id="destination_location"
                                        label={destination_location && destination_location.length > 0 ? `LOCAL DE DESTINO: ${50 - destination_location.length} caracteres restantes` : 'LOCAL DE DESTINO'}
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
                                        Limpar dados
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
                                                        TELEFONE
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography color="textSecondary" variant="h6">
                                                        SAÍDA
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography color="textSecondary" variant="h6">
                                                        DESTINO
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography color="textSecondary" variant="h6">
                                                        HORÁRIO
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography color="textSecondary" variant="h6">
                                                        CONFIRMADO?
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
                                                                            {cli?.name && cli?.name.substring(0, 22).toUpperCase()}
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
                                                                            {cli?.pivot?.person_type && cli?.pivot?.person_type == "passenger" ? "PASSAGEIRO" : "ACOMPANHANTE"}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>


                                                                <TableCell>
                                                                    <Typography
                                                                        variant="h6"
                                                                    >
                                                                        {cli?.pivot?.phone && cli?.pivot?.phone.substring(0, 15).toUpperCase()}
                                                                    </Typography>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <Typography
                                                                        variant="h6"
                                                                    >
                                                                        {cli?.pivot?.departure_location && cli?.pivot?.departure_location.substring(0, 15).toUpperCase()}
                                                                    </Typography>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <Typography
                                                                        variant="h6"
                                                                    >
                                                                        {cli?.pivot?.destination_location && cli?.pivot?.destination_location.substring(0, 10).toUpperCase()}
                                                                    </Typography>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <Typography
                                                                        variant="h6"
                                                                    >
                                                                        {cli?.pivot?.time && cli?.pivot?.time}
                                                                    </Typography>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <FormGroup>
                                                                        <FormControlLabel control={<Switch checked={cli?.pivot?.is_confirmed == 1}
                                                                            onClick={() => handleIsConfirm(cli)} />} label={cli?.pivot?.is_confirmed == 1 ? "SIM" : "NÃO"} />
                                                                    </FormGroup>

                                                                    <Typography
                                                                        variant="h6"
                                                                    >
                                                                        {cli?.pivot?.updated_at && cli?.pivot?.is_confirmed == 1 ? format(parseISO(cli?.pivot?.updated_at),"dd/MM/yyyy HH:mm:ss") : ''}
                                                                    </Typography>

                                                                </TableCell>

                                                                <TableCell align="center">
                                                                    <Box sx={{ "& button": { mx: 1 } }}>

                                                                        <Button title="Editar cliente" onClick={() => { HandleEditClient(cli) }} color="success" size="medium" variant="contained">
                                                                            <FeatherIcon icon="edit" width="20" height="20" />
                                                                        </Button>

                                                                        <Button title="Excluir cliente" onClick={() => { HandleExcludeTrip(cli) }} color="error" size="medium" variant="contained">
                                                                            <FeatherIcon icon="trash" width="20" height="20" />
                                                                        </Button>

                                                                    </Box>
                                                                </TableCell>
                                                            </>

                                                        </StyledTableRow>
                                                    ))}
                                        </TableBody>
                                    </Table>
                                    <br />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', "& button": { mx: 1 } }}>
                                        <Button onClick={() => { cleanFormCancel() }} variant="contained" mt={2}>
                                            Cancelar
                                        </Button>
                                    </Box>
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
            </Modal >
        </div >
    );
}