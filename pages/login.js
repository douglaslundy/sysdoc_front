import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import FeatherIcon from "feather-icons-react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { parseCookies } from 'nookies';
import AlertModal from '../src/components/messagesModal';
import LogoDark from "../assets/images/logos/logo.png";
import Image from "next/image";

import { useDispatch } from 'react-redux';
import { loginFetch } from '../src/store/fetchActions/auth';

function Copyright(props) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="www.dlsistemas.com.br">
                DLSistemas
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

export default function SignIn() {
    const dispatch = useDispatch();

    const [form, setForm] = useState({
        cpf: '',
        password: ''
    });

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const { cpf, password } = form;

    const handleSubmit = (event) => {
        event.preventDefault();
        dispatch(loginFetch(form));
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    <Image width={310} height={80} src={LogoDark} alt={LogoDark} />
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <AlertModal />
                    <Stack spacing={1.5}>
                        <TextField
                            required
                            fullWidth
                            id="CPF"
                            label="CPF"
                            name="cpf"
                            value={cpf}
                            onChange={changeItem}
                            autoComplete="cpf"
                            autoFocus
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    minHeight: '78px',
                                },
                                '& .MuiOutlinedInput-input': {
                                    paddingTop: '27.7px',
                                    paddingBottom: '27.7px',
                                },
                            }}
                        />
                        <TextField
                            required
                            fullWidth
                            name="password"
                            label="Senha"
                            type="password"
                            value={password}
                            onChange={changeItem}
                            id="password"
                            autoComplete="current-password"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    minHeight: '78px',
                                },
                                '& .MuiOutlinedInput-input': {
                                    paddingTop: '27.7px',
                                    paddingBottom: '27.7px',
                                },
                            }}
                        />
                    </Stack>
                    {/* <FormControlLabel
                        control={<Checkbox value="remember" color="primary" />}
                        label="Lembrar"
                    /> */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Entrar
                    </Button>
                    <Grid container justifyContent="center">
                        <Grid item>
                            <Link href="/esqueci-senha" variant="body2">
                                Esqueceu a senha?
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
            <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
    );
}

export async function getServerSideProps(context) {
    const cookies = parseCookies(context);
    // sysvendas.token é httpOnly e pode persistir brevemente após o logout
    // devido a race conditions no Set-Cookie do browser.
    // sysvendas.id + sysvendas.profile são não-httpOnly e deletados de forma
    // confiável pelo handler server-side e pelo bloco catch do logoutFetch.
    const hasSession = cookies['sysvendas.id'] && cookies['sysvendas.profile'];

    if (hasSession) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            }
        };
    }
    return {
        props: {},
    };
}
