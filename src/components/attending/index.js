import React, { useEffect, useState } from "react";
import BaseCard from "../baseCard/BaseCard";
import { Alert, Box, Button, FormControlLabel, FormGroup, Stack, Switch, TextField, Typography } from "@mui/material";
import { parseCookies } from "nookies";
import { useRouter } from "next/router";
import { alterTypeOfAlert, changeTitleAlert, turnAlert, turnModal } from "../../store/ducks/Layout";
import { useDispatch, useSelector } from "react-redux";
import AlertModal from "../messagesModal";
import { getAllServices } from '../../store/fetchActions/service_calls';
import Select from '../inputs/selects';
import { finishCallFetch, getShowCall } from "../../store/fetchActions/calls";
import CreateCallModal from "../modal/create_call";



export default function Attending() {

    const { 'sysvendas.call_id': id_call } = parseCookies();
    const { services } = useSelector(state => state.services);
    const { call, calls } = useSelector(state => state.calls);

    const [form, setForm] = useState({
        call_id: id_call,
        description: "",
        call_service_forwarded_id: "",
        client_id: "",
        service_status: "finished"
    });

    const { description, call_service_forwarded_id, call_id, client_id, service_status } = form;

    const [texto, setTexto] = useState();
    const router = useRouter();
    const dispatch = useDispatch();
    const { isOpenAlert } = useSelector(state => state.layout);
    const [isVisible, setIsVisible] = useState(false);


    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            call_id: "",
            description: "",
            call_service_forwarded_id: "",
            client_id: "",
            service_status: "finished"
        });
    }

    const handleIsVisible = () => {
        setIsVisible(!isVisible);
        setForm({ ...form, service_status: isVisible ? 'finished' : 'forwarded' })
    }

    const handleOpenCallModalToSetClient = async () => {
        dispatch(turnModal());
    }
    const handleSaveData = async () => {
        call_id && call_id != 'null' ? handlePostData() : dispatch(turnAlert()) && router.push('/listing_calls');
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`Atendimento gravado com sucesso!`));
        dispatch(finishCallFetch(form, cleanForm()));
    };

    const prohibitedAction = () => {
        dispatch(changeTitleAlert(`Você não pode realizar esta ação, pois não possui um atendimento aberto`));
        dispatch(alterTypeOfAlert(false));
        !isOpenAlert && dispatch(turnAlert()) && router.push('/listing_calls');
    }

    useEffect(() => {
        (!call_id || call_id == 'null') && prohibitedAction();
        dispatch(getShowCall(call_id));
    }, [calls]);

    useEffect(() => {
        dispatch(getAllServices());
    }, []);

    return (
        <BaseCard title={`Você está atendendo a senha de Nº ${call?.call_prefix} ${call?.call_number}`}>

            <AlertModal />
            <CreateCallModal />

            {texto &&
                <Alert variant="filled" severity="warning">
                    {texto}
                </Alert>
            }

            {/* <FormGroup > */}
            <Stack spacing={3}>

                {call?.client &&
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: "600",
                            fontSize: "20px",
                        }}
                    >
                        Cliente: {call?.client?.name}
                    </Typography>
                }
                {call?.subject &&
                    <>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: "600",
                                fontSize: "16px",
                            }}
                        >
                            Motivo:
                        </Typography>
                        {call?.subject.toUpperCase()}
                    </>
                }

                {!call?.client &&
                    <Box sx={{ "& button": { mx: 1 } }}>
                        <Button onClick={handleOpenCallModalToSetClient} variant="contained" mt={2}>
                            Informar cliente
                        </Button>
                    </Box>
                }

                <TextField
                    id="description"
                    label={description && description.length > 0 ? `Resumo: ${500 - description.length} caracteres restantes` : 'Descrição'}
                    multiline
                    rows={2}
                    value={description}
                    name="description"
                    onChange={changeItem}
                    inputProps={{
                        style: {
                            textTransform: "uppercase"
                        },
                        maxLength: 500
                    }}
                />

                <FormGroup>
                    <FormControlLabel control={<Switch checked={isVisible}
                        onClick={handleIsVisible} />} label={isVisible ? "Encaminhar" : "Finalizar"} />
                </FormGroup>

                {
                    isVisible &&
                    <Select
                        value={call_service_forwarded_id}
                        label={'Serviço'}
                        name={'call_service_forwarded_id'}
                        store={services}
                        changeItem={changeItem}
                    />
                }

            </Stack>
            {/* </FormGroup> */}
            <br />
            <Box sx={{ "& button": { mx: 1 } }}>
                <Button onClick={handleSaveData} variant="contained" mt={2}>
                    {isVisible ? 'Encaminhar' : 'Finalizar'}
                </Button>

                <Button onClick={() => { cleanForm() }} variant="outlined" mt={2}>
                    Cancelar
                </Button>
            </Box>
        </BaseCard>
    );
};
