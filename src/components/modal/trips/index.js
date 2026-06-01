import { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import { modalFormRootSx, modalPrimaryButtonSx, modalSecondaryButtonSx, modalShellSx } from '../_shared/modalFormStyles';
import Modal from '@mui/material/Modal';
import BaseCard from '../../baseCard/BaseCard';
import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
} from "@mui/material";
import { showTrip } from '../../../store/ducks/trips';
import { closeModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { getAllVehicles } from '../../../store/fetchActions/vehicles';
import { editTripFetch, addTripFetch } from '../../../store/fetchActions/trips';
import AlertModal from '../../messagesModal';
import { getAllUsers } from '../../../store/fetchActions/user';
import { getAllRoutes } from '../../../store/fetchActions/routes';
import Select from '../../inputs/selects';
import DateTime from '../../inputs/dateTime';
import BasicDatePicker from '../../inputs/datePicker';
export default function TripModal(props) {


    const [form, setForm] = useState({
        vehicle_id: "",
        route_id: "",
        driver_id: "",
        departure_time: "",
        departure_date: "",
        driver: "",
        obs: ""
    });

    const { vehicle_id, route_id, driver_id, departure_time, departure_date, obs } = form;
    const { vehicles } = useSelector(state => state.vehicles);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const { users } = useSelector(state => state.users);
    const { routes } = useSelector(state => state.routes);
    const { trip } = useSelector(state => state.trips);
    // const [driv, setDriver] = useState([]);
    const [texto, setTexto] = useState();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const formatDisplayDate = (date) => {
        try {
            return format(date instanceof Date ? date : new Date(`${date}T12:00:00`), 'dd/MM/yyyy');
        } catch {
            return '';
        }
    };

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            vehicle_id: "",
            route_id: "",
            driver_id: "",
            departure_time: "",
            departure_date: "",
            obs: ""
        });
        setTexto('');
        dispatch(closeModal());
        dispatch(showTrip({}));
    }


    const handleSaveData = async () => {
        if (trip && trip.id) {
            handlePutData();
        } else {
            setConfirmOpen(true);
        }
    };

    const handleConfirm = () => {
        setConfirmOpen(false);
        handlePostData();
    };

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`Viagem Cadastrada com sucesso!`));
        dispatch(addTripFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`Viagem Atualizada com sucesso!`));
        dispatch(editTripFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    const handleSetDepartureDate = (value) => {
        setForm({ ...form, departure_date: value })
    }

    const transformedVehicle = (vechiles) =>
        vechiles.map(({ id, license_plate, brand, model, capacity }) => ({
            id,
            name: `${license_plate} - ${brand}  ${model} CAPACIDADE ${capacity} LUGARES`
        }));

    const transformedRoutes = (routes) =>
        routes.map(({ id, origin, destination }) => ({
            id,
            name: `${origin} X ${destination}` // Concatenar 'origin' e 'destination'
        }));

    const getDrivers = (users) =>
        users
            .filter((user) => Number(user.is_driver) === 1) // Filtra somente os usuários com profile "driver"
            .map(({ id, name }) => ({
                id,
                name
            }));


    useEffect(() => {
        if (trip && trip.id)
            setForm(trip);

    }, [trip]);

    useEffect(() => {
        if (isOpenModal) {
            dispatch(getAllUsers());
            dispatch(getAllRoutes());
            dispatch(getAllVehicles());
        }
    }, [isOpenModal]);

    return (
        <div>
            {props.children}
            <Modal
                open={isOpenModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>

                    <AlertModal />

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={trip && trip.id ? "Editar Viagem " : "Cadastrar Viagem "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                            gap: 2,
                                        }}
                                    >

                                        <BasicDatePicker
                                            id="departure_date"
                                            label="Data da Viagem"
                                            name="departure_date, "
                                            value={departure_date}
                                            setValue={handleSetDepartureDate}
                                            className=""
                                            required
                                        />

                                        <DateTime
                                            id="departure_time"
                                            label="Horário de saída"
                                            name="departure_time"
                                            value={departure_time}
                                            onChange={changeItem}
                                        />



                                    </Box>

                                    <Select
                                        label={'SELECIONE O MOTORISTA'}
                                        name={'driver_id'}
                                        value={driver_id}
                                        store={getDrivers(users)}
                                        changeItem={changeItem}
                                    />

                                    <Select
                                        value={route_id}
                                        label={'SELECIONE A ROTA'}
                                        name={'route_id'}
                                        store={transformedRoutes(routes)}
                                        changeItem={changeItem}
                                    />

                                    <Select
                                        value={vehicle_id}
                                        label={'SELECIONE O VEICULO'}
                                        name={'vehicle_id'}
                                        store={transformedVehicle(vehicles)}
                                        changeItem={changeItem}
                                    />

                                    <TextField
                                        id="Obs"
                                        label={obs && obs.length > 0 ? `Observações: ${300 - obs.length} caracteres restantes` : 'Observações'}
                                        multiline
                                        rows={2}
                                        value={obs ? obs : ''}
                                        name="obs"
                                        // disabled={queue?.id ? true : false}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 300
                                        }}
                                    />
                                </Stack>
                                {/* </FormGroup> */}
                                <br />
                                <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
                                    <Button onClick={handleSaveData} variant="contained" sx={modalPrimaryButtonSx}>
                                        Gravar
                                    </Button>

                                    <Button onClick={() => { cleanForm() }} variant="outlined" sx={modalSecondaryButtonSx}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>

                </Box>
            </Modal>

            {/* Confirmação de cadastro de nova viagem */}
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent sx={{ textAlign: 'center', pt: 5, pb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, fontSize: 18 }}>
                        Confirma o cadastro da viagem para a data
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: 46, lineHeight: 1.2 }}>
                        {formatDisplayDate(departure_date)}{departure_time ? ` às ${departure_time}` : ''}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 4, gap: 2 }}>
                    <Button variant="contained" size="large" onClick={handleConfirm}>
                        Confirmar
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => setConfirmOpen(false)}>
                        Cancelar
                    </Button>
                </DialogActions>
            </Dialog>
        </div >
    );
}




