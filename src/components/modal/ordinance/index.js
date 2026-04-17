import React, { useState, useEffect } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';

import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography
} from "@mui/material";

import BaseCard from "../../baseCard/BaseCard";

import { getTextOpenAi, showOrdinance } from '../../../store/ducks/ordinances';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editOrdinanceFetch, addOrdinanceFetch, getTextAIOrdinance } from '../../../store/fetchActions/ordinances';

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

const ordinanceTypes = [
    { id: 'normativa', name: 'Normativa' },
    { id: 'ordinatoria', name: 'Ordinatória' },
];

export default function OrdinanceModal(props) {
    const [form, setForm] = useState({
        type: "normativa",
        title: "",
        subject: "",
        summary: "",
        content: "",
        legal_basis: "",
        signatory_name: "",
        signatory_role: "",
        notes: "",
        additional_instructions: ""
    });

    const {
        type,
        title,
        subject,
        summary,
        content,
        legal_basis,
        signatory_name,
        signatory_role,
        notes,
        additional_instructions
    } = form;

    const { ordinance, textOpenAi } = useSelector(state => state.ordinances);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            type: "normativa",
            title: "",
            subject: "",
            summary: "",
            content: "",
            legal_basis: "",
            signatory_name: "",
            signatory_role: "",
            notes: "",
            additional_instructions: ""
        });

        setTexto('');
        dispatch(getTextOpenAi(""));
        dispatch(turnModal());
        dispatch(showOrdinance({}));
    };

    const handleSaveData = async () => {
        ordinance && ordinance.id ? handlePutData() : handlePostData();
    };

    const handleGetTextAI = async () => {
        dispatch(getTextAIOrdinance(form));
    };

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`A Portaria foi cadastrada com sucesso!`));
        dispatch(addOrdinanceFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A Portaria ${form.number} foi atualizada com sucesso!`));
        dispatch(editOrdinanceFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (ordinance && ordinance.id) {
            setForm({
                ...ordinance,
                additional_instructions: ordinance.additional_instructions || ""
            });
        }
    }, [ordinance]);

    useEffect(() => {
        setForm(prev => ({ ...prev, content: textOpenAi }));
    }, [textOpenAi]);

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenModal} onClose={handleClose}>
                <Box sx={style}>
                    <AlertModal />

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={ordinance && ordinance.id ? "Editar Portaria" : "Cadastrar Portaria"}>
                                {texto && <Alert variant="filled" severity="warning">{texto}</Alert>}

                                <br />

                                <Stack spacing={3}>
                                    <FormControl fullWidth>
                                        <InputLabel id="type-label">Tipo de Portaria</InputLabel>
                                        <Select
                                            labelId="type-label"
                                            name="type"
                                            value={type}
                                            label="Tipo de Portaria"
                                            onChange={changeItem}
                                        >
                                            {ordinanceTypes.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Typography variant="body2">
                                        <strong>Normativa:</strong> use quando a portaria estabelecer regras gerais,
                                        abstratas e de aplicação mais ampla.
                                        <br />
                                        <strong>Ordinatória:</strong> use quando a portaria tratar de organização interna,
                                        designações, determinações ou providências administrativas concretas.
                                    </Typography>

                                    <TextField
                                        label={title && title.length > 0 ? `Título: ${255 - title.length} caracteres restantes` : 'Título'}
                                        variant="outlined"
                                        name="title"
                                        value={title || ''}
                                        onChange={changeItem}
                                        required
                                        inputProps={{ maxLength: 255 }}
                                    />

                                    <TextField
                                        label={subject && subject.length > 0 ? `Assunto: ${255 - subject.length} caracteres restantes` : 'Assunto'}
                                        variant="outlined"
                                        name="subject"
                                        value={subject || ''}
                                        onChange={changeItem}
                                        required
                                        inputProps={{ maxLength: 255 }}
                                    />

                                    <TextField
                                        label={signatory_name && signatory_name.length > 0 ? `Signatário: ${150 - signatory_name.length} caracteres restantes` : 'Nome do Signatário'}
                                        variant="outlined"
                                        name="signatory_name"
                                        value={signatory_name || ''}
                                        onChange={changeItem}
                                        required
                                        inputProps={{ maxLength: 150 }}
                                    />

                                    <TextField
                                        label={signatory_role && signatory_role.length > 0 ? `Cargo: ${150 - signatory_role.length} caracteres restantes` : 'Cargo do Signatário'}
                                        variant="outlined"
                                        name="signatory_role"
                                        value={signatory_role || ''}
                                        onChange={changeItem}
                                        inputProps={{ maxLength: 150 }}
                                    />

                                    <TextField
                                        label={summary && summary.length > 0 ? `Resumo: ${1000 - summary.length} caracteres restantes` : 'Resumo'}
                                        multiline
                                        rows={4}
                                        value={summary || ''}
                                        name="summary"
                                        onChange={changeItem}
                                        inputProps={{ maxLength: 1000 }}
                                    />

                                    <TextField
                                        label="Fundamentação Legal"
                                        multiline
                                        rows={3}
                                        value={legal_basis || ''}
                                        name="legal_basis"
                                        onChange={changeItem}
                                    />

                                    <TextField
                                        label="Instruções adicionais para IA"
                                        multiline
                                        rows={2}
                                        value={additional_instructions || ''}
                                        name="additional_instructions"
                                        onChange={changeItem}
                                    />

                                    <TextField
                                        label={content ? `O modelo gerado possui ${content.length} caracteres` : 'Conteúdo da portaria'}
                                        multiline
                                        rows={12}
                                        value={content || ''}
                                        name="content"
                                        onChange={changeItem}
                                    />

                                    <TextField
                                        label="Observações"
                                        multiline
                                        rows={3}
                                        value={notes || ''}
                                        name="notes"
                                        onChange={changeItem}
                                    />
                                </Stack>

                                <br />
                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={handleSaveData} variant="contained">
                                        Gravar
                                    </Button>

                                    <Button onClick={handleGetTextAI} variant="contained" color="success">
                                        Gerar um Modelo com IA
                                    </Button>

                                    <Button onClick={cleanForm} variant="outlined">
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