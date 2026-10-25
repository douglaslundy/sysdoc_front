import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { showTrip } from '../../../store/ducks/trips';
import { closeTripModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { getAllVehicles } from '../../../store/fetchActions/vehicles';
import { editTripFetch, addTripFetch, getDriversOptions } from '../../../store/fetchActions/trips';
import AlertModal from '../../messagesModal';
import { getAllRoutes } from '../../../store/fetchActions/routes';
import Select from '../../inputs/selects';
import DateTime from '../../inputs/dateTime';
import BasicDatePicker from '../../inputs/datePicker';
import ReplicateTripModal from '../trips/replicate';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoDescricao, DialogoRodape } from '../../ui/dialogo';

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
    const { isOpenTripModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const { routes } = useSelector(state => state.routes);
    const { trip, drivers } = useSelector(state => state.trips);
    const [texto, setTexto] = useState();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [createdTrip, setCreatedTrip] = useState(null);
    const [replicateOpen, setReplicateOpen] = useState(false);

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
        dispatch(closeTripModal());
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
        dispatch(addTripFetch(form, cleanForm, (trip) => setCreatedTrip(trip)));
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

    const getDrivers = (drivers) =>
        (drivers || []).map(({ id, name }) => ({
            id,
            name
        }));

    useEffect(() => {
        if (trip && trip.id)
            setForm(trip);

    }, [trip]);

    useEffect(() => {
        if (isOpenTripModal) {
            dispatch(getDriversOptions());
            dispatch(getAllRoutes());
            dispatch(getAllVehicles());
        }
    }, [isOpenTripModal]);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenTripModal)} aoFechar={handleClose} tamanho="lg">
                <DialogoCabecalho>{trip && trip.id ? "Editar Viagem" : "Cadastrar Viagem"}</DialogoCabecalho>
                <AlertModal />
                {texto && <div className="mb-4"><Banner tom="alerta">{texto}</Banner></div>}

                <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <BasicDatePicker
                            id="departure_date"
                            label="Data da Viagem"
                            name="departure_date"
                            value={departure_date}
                            setValue={handleSetDepartureDate}
                            required
                        />
                        <DateTime
                            id="departure_time"
                            label="Horário de saída"
                            name="departure_time"
                            value={departure_time}
                            onChange={changeItem}
                        />
                    </div>

                    <Select
                        label={'SELECIONE O MOTORISTA'}
                        name={'driver_id'}
                        value={driver_id}
                        store={getDrivers(drivers)}
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

                    <CampoTexto
                        id="Obs"
                        label={obs && obs.length > 0 ? `Observações: ${300 - obs.length} caracteres restantes` : 'Observações'}
                        multiline
                        rows={2}
                        value={obs ? obs : ''}
                        name="obs"
                        onChange={changeItem}
                        maxLength={300}
                        className="uppercase"
                    />
                </div>

                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
                    <Button type="button" onClick={handleSaveData}>Gravar</Button>
                </DialogoRodape>
            </Dialogo>

            {/* Confirmação de cadastro de nova viagem */}
            <Dialogo aberto={confirmOpen} aoFechar={() => setConfirmOpen(false)} tamanho="md" elevado>
                <DialogoCabecalho>Confirma o cadastro da viagem para a data</DialogoCabecalho>
                <p className="text-center font-display text-4xl font-extrabold leading-tight">
                    {formatDisplayDate(departure_date)}{departure_time ? ` às ${departure_time}` : ''}
                </p>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                    <Button type="button" onClick={handleConfirm}>Confirmar</Button>
                </DialogoRodape>
            </Dialogo>

            {/* Viagem cadastrada: oferece replicar para outras datas */}
            <Dialogo aberto={Boolean(createdTrip) && !replicateOpen} aoFechar={() => setCreatedTrip(null)} tamanho="md" elevado>
                <DialogoCabecalho>Viagem cadastrada com sucesso!</DialogoCabecalho>
                <DialogoDescricao>
                    Deseja replicar a rota e as observações desta viagem para outras datas? Motorista, veículo e pacientes são adicionados depois, em cada viagem.
                </DialogoDescricao>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={() => setCreatedTrip(null)}>Fechar</Button>
                    <Button type="button" onClick={() => setReplicateOpen(true)}>Replicar Viagem</Button>
                </DialogoRodape>
            </Dialogo>

            <ReplicateTripModal
                open={replicateOpen}
                trip={createdTrip}
                onClose={() => {
                    setReplicateOpen(false);
                    setCreatedTrip(null);
                }}
            />
        </div>
    );
}
