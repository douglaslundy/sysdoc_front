import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import FeatherIcon from "feather-icons-react";
import Button from '@mui/material/Button';
// import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { parseCookies } from 'nookies';
import AlertModal from '../src/components/messagesModal';

import { useDispatch, useSelector } from 'react-redux';


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
        "cpf": '',
        "password": ''
    });

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    }

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
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                    <FeatherIcon icon="lock" />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Login 
                </Typography>
               
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                     <AlertModal />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="CPF"
                        label="CPF"
                        name="cpf"
                        value={cpf}
                        onChange={changeItem}
                        autoComplete="cpf"
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={changeItem}
                        id="password"
                        autoComplete="current-password"
                    />
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
                    {/* <Grid container>
                        <Grid item xs>
                            <Link href="#" variant="body2">
                                Esqueci a senha?
                            </Link>
                        </Grid>
                        
                    </Grid> */}
                </Box>
            </Box>
            <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
    );
}

export async function getServerSideProps(context) {

    const { 'sysvendas.token': token } = parseCookies(context);
    
    if(token){
      return {
        redirect: {
          destination: '/',
          permanent: false, 
        }
      }
    }
    return {
      props: {}, // will be passed to the page component as props
    }
  }