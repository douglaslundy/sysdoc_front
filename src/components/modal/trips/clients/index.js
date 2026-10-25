import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, parseISO } from 'date-fns';
import { closeTripClientsModal, changeTitleAlert } from '../../../../store/ducks/Layout';
import { insertClientTrip, editClientTrip, excludeClientTripFetch, confirmedClientTrip, unConfirmedClientTrip } from '../../../../store/fetchActions/trips';
import AlertModal from '../../../messagesModal';
import InputSelectClient from '../../../inputs/inputSelectClient';
import { getClientsSelect } from '../../../../store/fetchActions/clients';
import Select from '../../../inputs/selects';
import { showTrip } from '../../../../store/ducks/trips';
import ConfirmDialog from "../../../confirmDialog";
import DateTime from '../../../inputs/dateTime';
import Phone from '../../../../components/inputs/textFields/phone';
import { ActionDeleteButton, ActionEditButton } from '../../../actions';
import { Banner } from '../../../ui/banner';
import { Button } from '../../../ui/button';
import { CampoTexto } from '../../../ui/campos';
import { DataTable } from '../../../ui/data-table';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../../ui/dialogo';
import { Interruptor } from '../../../ui/interruptor';
import { Paginacao } from '../../../ui/paginacao';
import { usePaginacaoLocal } from '../../../../lib/usePaginacaoLocal';

const FORM_VAZIO = {
    id: "",
    client_id: "",
    person_type: "",
    phone: "",
    departure_location: "",
    destination_location: "",
    time: ""
};

export default function TripClientsModal(props) {

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { trip } = useSelector(state => state.trips);
    const { isOpenTripClientsModal } = useSelector(state => state.layout);
    const { clients } = useSelector(state => state.clients);
    const [form, setForm] = useState(FORM_VAZIO);

    const { person_type, phone, departure_location, destination_location, time } = form;

    const [cli, setClient] = useState([]);
    const [texto, setTexto] = useState();

    const { fatia, propsDaPaginacao } = usePaginacaoLocal(trip?.clients || []);

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanFormCancel = () => {
        setForm(FORM_VAZIO);
        setClient([]);
        setTexto('');
        dispatch(closeTripClientsModal());
        dispatch(showTrip({}));
    }

    const cleanForm = () => {
        setForm({ ...FORM_VAZIO, id: trip?.id || "" });
        setClient([]);
        setTexto('');
    }

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
                id: cli.pivot.id,
                trip_id: trip.id,
                client_id: cli.id,
                person_type: cli.pivot.person_type,
                phone: cli.pivot.phone,
                departure_location: cli.pivot.departure_location,
                destination_location: cli.pivot.destination_location,
                time: new Date(0, 0, 0, ...(cli.pivot.time.split(":"))).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false })
            },
        )
        setClient({ ...cli })
    }

    const handleSaveClient = async () => {
        dispatch(changeTitleAlert(`O Cliente foi inserido na viagem com sucesso!`));
        dispatch(insertClientTrip(form, cleanForm));
    };

    const handleUpdateClient = async () => {
        dispatch(changeTitleAlert(`O Cliente atualizado na viagem com sucesso!`));
        dispatch(editClientTrip(form, cleanForm));
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

    // Carrega os clientes ao montar (o modal só monta quando open=true)
    useEffect(() => {
        if (clients.length <= 0) {
            dispatch(getClientsSelect({ limit: 50 }));
        }
    }, []);

    const colunas = [
        { chave: 'nome', titulo: 'Nome', render: (c) => <span className="font-semibold">{c?.name && c.name.substring(0, 22).toUpperCase()}</span> },
        { chave: 'tipo', titulo: 'Tipo', render: (c) => (c?.pivot?.person_type == "passenger" ? "PASSAGEIRO" : "ACOMPANHANTE") },
        { chave: 'telefone', titulo: 'Telefone', render: (c) => c?.pivot?.phone && c.pivot.phone.substring(0, 15).toUpperCase() },
        { chave: 'saida', titulo: 'Saída', render: (c) => c?.pivot?.departure_location && c.pivot.departure_location.substring(0, 15).toUpperCase() },
        { chave: 'destino', titulo: 'Destino', render: (c) => c?.pivot?.destination_location && c.pivot.destination_location.substring(0, 10).toUpperCase() },
        { chave: 'horario', titulo: 'Horário', render: (c) => c?.pivot?.time },
        {
            chave: 'confirmado',
            titulo: 'Confirmado?',
            render: (c) => {
                const confirmado = Number(c?.pivot?.is_confirmed) === 1;
                return (
                    <>
                        <Interruptor id={`confirmado-${c.id}`} marcado={confirmado} aoMudar={() => handleIsConfirm(c)}>
                            <span className="text-xs font-bold">{confirmado ? "SIM" : "NÃO"}</span>
                        </Interruptor>
                        {c?.pivot?.updated_at && confirmado ? (
                            <span className="mt-1 block text-xs text-muted-foreground">{format(parseISO(c.pivot.updated_at), "dd/MM/yyyy HH:mm:ss")}</span>
                        ) : null}
                    </>
                );
            },
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (c) => (
                <div className="flex gap-2">
                    <ActionEditButton title="Editar cliente" onClick={() => HandleEditClient(c)} />
                    <ActionDeleteButton title="Excluir cliente" onClick={() => HandleExcludeTrip(c)} />
                </div>
            ),
        },
    ];

    const titulo = `VIAGEM ${trip?.id} - ${trip?.route?.origin?.toUpperCase()} X ${trip?.route?.destination?.toUpperCase()}`
        + `${trip?.vehicle?.brand ? ` - VEÍCULO ${trip.vehicle.brand.toUpperCase()}` : ''}`
        + `${trip?.vehicle?.model ? ` ${trip.vehicle.model.toUpperCase()}` : ''}`
        + `${trip?.vehicle?.license_plate ? ` PLACA ${trip.vehicle.license_plate.toUpperCase()}` : ''}`
        + `${trip?.vehicle?.capacity ? ` ${trip.vehicle.capacity} LUGARES` : ''}`;

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenTripClientsModal)} aoFechar={cleanFormCancel} tamanho="xl">
                <DialogoCabecalho>{titulo}</DialogoCabecalho>
                <AlertModal />

                <div className="grid gap-3">
                    {texto && <Banner tom="alerta">{texto}</Banner>}
                    {trip?.obs && <Banner tom="alerta">{trip.obs}</Banner>}
                </div>

                <div className="mt-4 grid gap-4">
                    <div className="max-w-[200px]">
                        <DateTime
                            id="time"
                            label="Horário do compromisso"
                            name="time"
                            value={time ? time : ''}
                            onChange={changeItem}
                            wd="200px"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_300px_300px]">
                        {cli?.id ? (
                            <CampoTexto id="cliente-da-viagem" label="Cliente" value={cli?.name || ''} disabled readOnly />
                        ) : (
                            <InputSelectClient
                                id="client_id"
                                label="SELECIONE O CLIENTE"
                                value=""
                                name="client_id"
                                clients={clients}
                                setClient={setClient}
                                wd="100%"
                            />
                        )}

                        <Select
                            value={person_type ? person_type : ''}
                            label={'QUALIFIQUE O CLIENTE'}
                            name={'person_type'}
                            store={typesOfPerson}
                            changeItem={changeItem}
                        />

                        <Phone value={phone ? phone : ''}
                            label={'Telefone'}
                            name={'phone'}
                            changeItem={changeItem}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <CampoTexto
                            id="departure_location"
                            label={departure_location && departure_location.length > 0 ? `LOCAL DE SAÍDA: ${50 - departure_location.length} caracteres restantes` : 'LOCAL DE SAÍDA'}
                            value={departure_location ? departure_location : ''}
                            name="departure_location"
                            onChange={changeItem}
                            maxLength={50}
                            className="uppercase"
                        />
                        <CampoTexto
                            id="destination_location"
                            label={destination_location && destination_location.length > 0 ? `LOCAL DE DESTINO: ${50 - destination_location.length} caracteres restantes` : 'LOCAL DE DESTINO'}
                            value={destination_location ? destination_location : ''}
                            name="destination_location"
                            onChange={changeItem}
                            maxLength={50}
                            className="uppercase"
                        />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                        <Button type="button" variant="outline" onClick={cleanForm}>Limpar dados</Button>
                        <Button type="button" onClick={handleSaveData}>Gravar</Button>
                    </div>
                </div>

                <div className="mt-6">
                    <DataTable
                        rotulo="passageiros da viagem"
                        colunas={colunas}
                        linhas={fatia}
                        chaveDaLinha={(c) => c.id}
                        vazio="Nenhum passageiro na viagem."
                    />
                    <Paginacao {...propsDaPaginacao} />
                </div>

                <DialogoRodape>
                    <Button type="button" onClick={cleanFormCancel}>Cancelar</Button>
                </DialogoRodape>

                <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
            </Dialogo>
        </div>
    );
}
