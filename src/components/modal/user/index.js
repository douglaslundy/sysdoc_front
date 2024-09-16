import React, { useState, useEffect, useContext } from 'react';
import AlertModal from '../../messagesModal'
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import CpfCnpj from '../../inputs/textFields/cpfCnpj';

import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
    InputLabel,
    Select,
    MenuItem,
    FormControl
} from "@mui/material";

import BaseCard from "../../baseCard/BaseCard";

import { showUser } from '../../../store/ducks/users';
import { editUserFetch, addUserFetch } from '../../../store/fetchActions/user';
import { turnUserModal, changeTitleAlert, addAlertMessage } from '../../../store/ducks/Layout';
import { AuthContext } from '../../../contexts/AuthContext';


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

const profiles = [
    {
        "id": "admin",
        "name": "Administrador"
    },
    {
        "id": "partner",
        "name": "Parceiro"
    },
    {
        "id": "user",
        "name": "Usuário"
    }
]

export default function UserModal(props) {

    const [form, setForm] = useState({
        profile: "",
        name: "",
        email: "",
        cpf: "",
        password: "",
        password2: "",
    });

    const { user } = useSelector(state => state.users);
    const { isOpenUserModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const { user: userId, profile: userProfile } = useContext(AuthContext);

    const { profile, name, email, cpf, password, password2 } = form;
    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            profile: "",
            name: "",
            email: "",
            cpf: "",
            password: "",
            password2: "",
        });
        setTexto('');
        dispatch(turnUserModal());
        dispatch(showUser({}));
    }


    const handleSaveData = async () => {
        password && password !== password2 ? dispatch(addAlertMessage("As senhas precisam ser iguais")) : user && user.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`O usuário ${form.name} foi Cadastrado com sucesso!`));
        dispatch(addUserFetch(form, cleanForm));
    };

    const handlePutData = async () => {

        if (password && password !== password2)
            alert("erro")

        dispatch(changeTitleAlert(`O usuário ${form.name} foi atualizado com sucesso!`));
        dispatch(editUserFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {

        if (user && user.id)
            setForm(user);

    }, [user]);

    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenUserModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box sx={style}>

                    <AlertModal />

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={user && user.id ? "Editar Usuário" : "Cadastrar Usuário"}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>

                                    {userProfile && userProfile == "admin" &&
                                        <FormControl fullWidth required>
                                            <InputLabel>Perfil do Usuário</InputLabel>
                                            <Select
                                                id="profile"
                                                value={profile}
                                                name="profile"
                                                label="Perfil do Usuário"
                                                onChange={changeItem}
                                                variant="outlined"
                                                disabled={user && user.id == userId ? true : false}
                                            >
                                                {profiles.map((d) => (
                                                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    }

                                    <TextField
                                        id="name"
                                        label="Nome"
                                        variant="outlined"
                                        name="name"
                                        value={name ? name : ''}
                                        onChange={changeItem}
                                        required
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            }
                                        }}
                                    />
                                    <TextField
                                        id="email"
                                        label="@Email"
                                        variant="outlined"
                                        type="email"
                                        name="email"
                                        value={email ? email : ''}
                                        onChange={changeItem}
                                        required
                                    />

                                    <CpfCnpj value={cpf ? cpf : ''}
                                        label={'CPF'}
                                        name={'cpf'}
                                        changeItem={changeItem}
                                        disabled={user && user.id ? true : false}
                                    />

                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="password"
                                        label="Senha"
                                        type="password"
                                        value={password ? password : ''}
                                        onChange={changeItem}
                                        id="password"
                                    />

                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="password2"
                                        label="Repita a Senha"
                                        type="password"
                                        value={password2 ? password2 : ''}
                                        onChange={changeItem}
                                        id="password2"
                                    />

                                </Stack>
                                {/* </FormGroup> */}
                                <br />
                                {texto}
                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={handleSaveData} variant="contained" mt={2}>
                                        Gravar
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