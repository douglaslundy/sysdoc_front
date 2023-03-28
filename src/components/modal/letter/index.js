import React, { useState, useEffect, useContext } from 'react';
import AlertModal from '../../messagesModal'
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';

import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
} from "@mui/material";

import BaseCard from "../../baseCard/BaseCard";

import { getTextOpenAi, showLetter } from '../../../store/ducks/letters';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editLetterFetch, addLetterFetch, getTextAI } from '../../../store/fetchActions/letter';


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

export default function LetterModal(props) {


    const [form, setForm] = useState({
        sender: "",
        recipient: "",
        subject_matter: "",
        obs: "",
        summary: "",
    });

    const { sender, recipient, subject_matter, obs, summary } = form;
    const { letter, textOpenAi } = useSelector(state => state.letters);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            sender: "",
            recipient: "",
            subject_matter: "",
            obs: "",
            summary: "",
        });
        setTexto('');
        dispatch(getTextOpenAi(""));
        dispatch(turnModal());
        dispatch(showLetter({}));
    }


    const handleSaveData = async () => {
        letter && letter.id ? handlePutData() : handlePostData()
    }

    const handleGetTextAI = async () => {
        dispatch(getTextAI(form));
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`O Ofício foi Cadastrado com sucesso!`));
        dispatch(addLetterFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`O Ofício ${form.number} foi atualizado com sucesso!`));
        dispatch(editLetterFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (letter && letter.id)
            setForm(letter);

    }, [letter]);

    useEffect(() => {
        setForm({ ...form, obs: textOpenAi });
    }, [textOpenAi]);

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
                            <BaseCard title={letter && letter.id ? "Editar Ofício " : "Enviar Ofício "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>
                                    <TextField
                                        id="sender"
                                        label={sender && sender.length > 0 ? `Remetente: ${50 - sender.length} caracteres restantes` : 'Remetente'}
                                        variant="outlined"
                                        name="sender"
                                        value={sender ? sender : ''}
                                        onChange={changeItem}
                                        required
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase",
                                            },
                                            maxLength: 50
                                        }}
                                    />
                                    <TextField
                                        id="recipient"
                                        label={recipient && recipient.length > 0 ? `Destinatário: ${50 - recipient.length} caracteres restantes` : 'Destinatário'}
                                        variant="outlined"
                                        name="recipient"
                                        required
                                        value={recipient ? recipient : ''}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 50
                                        }}
                                    />
                                    <TextField
                                        id="subject_matter"
                                        label={subject_matter && subject_matter.length > 0 ? `Assunto: ${100 - subject_matter.length} caracteres restantes` : 'Assunto'}
                                        variant="outlined"
                                        name="subject_matter"
                                        multiline
                                        value={subject_matter ? subject_matter : ''}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 100
                                        }}
                                        required
                                    />

                                    <TextField
                                        id="summary"
                                        label={summary && summary.length > 0 ? `Resumo: ${500 - summary.length} caracteres restantes` : 'Resumo'}
                                        multiline
                                        rows={2}
                                        value={summary ? summary : ''}
                                        name="summary"
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 500
                                        }}
                                    />

                                    <TextField
                                        id="obs"
                                        label={obs ? `O Modelo gerado pela IA possui ${obs.length} caracteres gerados` : 'Campo destinado a IA'}
                                        multiline
                                        rows={10}
                                        value={obs ? obs : ''}
                                        disabled
                                        name="obs"
                                        onChange={changeItem}
                                    // inputProps={{
                                    //     style: {
                                    //         textTransform: "uppercase"
                                    //     }
                                    // }}
                                    />
                                </Stack>
                                {/* </FormGroup> */}
                                <br />
                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={handleSaveData} variant="contained" mt={2}>
                                        Gravar
                                    </Button>

                                    <Button onClick={handleGetTextAI} variant="contained" color="success" mt={2}>
                                        Gerar um Modelo com IA
                                    </Button>

                                    <Button onClick={() => { cleanForm() }} variant="outlined" mt={2}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>

                </Box>
            </Modal>
        </div>
    );
}