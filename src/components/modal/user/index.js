import React, { useState, useEffect, useContext } from 'react';
import AlertModal from '../../messagesModal';
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
  FormControl,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';

import BaseCard from '../../baseCard/BaseCard';

import { showUser } from '../../../store/ducks/users';
import { editUserFetch, addUserFetch } from '../../../store/fetchActions/user';
import { turnUserModal, changeTitleAlert, addAlertMessage } from '../../../store/ducks/Layout';
import { AuthContext } from '../../../contexts/AuthContext';
import { getAllProfiles } from '../../../store/fetchActions/accessProfiles';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '400px',
  maxWidth: '95vw',
  maxHeight: '92vh',
  overflow: 'auto',
  background: 'var(--lg-glass-modal)',
  backdropFilter: 'var(--lg-blur-modal)',
  WebkitBackdropFilter: 'var(--lg-blur-modal)',
  border: '0.5px solid var(--lg-border)',
  borderTop: '1px solid var(--lg-border-strong)',
  boxShadow: 'var(--lg-shadow-modal)',
  borderRadius: '20px',
  p: 3.2,
};

export default function UserModal(props) {
  const [form, setForm] = useState({
    profile: '',
    name: '',
    email: '',
    cpf: '',
    is_driver: false,
    password: '',
    password2: '',
  });

  const { user } = useSelector((state) => state.users);
  const { isOpenUserModal } = useSelector((state) => state.layout);
  const { profiles: dbProfiles } = useSelector((state) => state.accessProfiles);
  const dispatch = useDispatch();
  const { user: userId, profile: userProfile } = useContext(AuthContext);

  const { profile, name, email, cpf, is_driver, password, password2 } = form;
  const [texto, setTexto] = useState();

  const changeItem = ({ target }) => {
    setForm({ ...form, [target.name]: target.value });
  };

  const cleanForm = () => {
    setForm({
      profile: '',
      name: '',
      email: '',
      cpf: '',
      is_driver: false,
      password: '',
      password2: '',
    });
    setTexto('');
    dispatch(turnUserModal());
    dispatch(showUser({}));
  };

  const handleSaveData = async () => {
    password && password !== password2
      ? dispatch(addAlertMessage('As senhas precisam ser iguais'))
      : user && user.id
        ? handlePutData()
        : handlePostData();
  };

  const handlePostData = async () => {
    dispatch(changeTitleAlert(`O usuario ${form.name} foi cadastrado com sucesso!`));
    dispatch(addUserFetch(form, cleanForm));
  };

  const handlePutData = async () => {
    if (password && password !== password2) {
      return;
    }

    dispatch(changeTitleAlert(`O usuario ${form.name} foi atualizado com sucesso!`));
    dispatch(editUserFetch(form, cleanForm));
  };

  const handleIsDriver = (isDriver) => {
    setForm({
      ...form,
      is_driver: !isDriver,
    });
  };

  const handleClose = () => {
    cleanForm();
  };

  useEffect(() => {
    if (user && user.id) setForm(user);
  }, [user]);

  useEffect(() => {
    if (isOpenUserModal && userProfile === 'admin' && dbProfiles.length === 0) {
      dispatch(getAllProfiles());
    }
  }, [isOpenUserModal, userProfile, dbProfiles.length, dispatch]);

  return (
    <div>
      {props.children}
      <Modal
        keepMounted
        open={isOpenUserModal}
        onClose={handleClose}
        aria-labelledby="keep-mounted-modal-title"
        aria-describedby="keep-mounted-modal-description"
        slotProps={{
          backdrop: {
            sx: {
              background: 'var(--lg-overlay-bg)',
              backdropFilter: 'var(--lg-blur-overlay)',
              WebkitBackdropFilter: 'var(--lg-blur-overlay)',
            },
          },
        }}
      >
        <Box
          sx={{
            ...style,
            '& .MuiCard-root': {
              background: 'transparent',
              boxShadow: 'none',
            },
            '& .MuiCardContent-root': {
              p: 0,
            },
            '& .MuiInputLabel-root': {
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--lg-text-muted)',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            },
            '& .MuiInputBase-root': {
              background: 'var(--lg-glass-input)',
              border: '0.5px solid var(--lg-border-input)',
              borderRadius: '10px',
              color: 'var(--lg-text-primary)',
              boxShadow: '0 1px 3px rgba(var(--lg-accent-rgb), 0.05), 0 1px 0 rgba(255,255,255,0.1) inset',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '& .MuiInputBase-root.Mui-focused': {
              background: 'var(--lg-glass-input-focus)',
              boxShadow: 'var(--lg-focus-ring)',
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--lg-text-muted)',
              opacity: 1,
            },
            '& .MuiInputBase-input': {
              color: 'var(--lg-text-primary)',
            },
            '& .MuiFormControlLabel-root': {
              m: 0,
              px: 1.6,
              py: 1.2,
              borderRadius: '10px',
              border: '0.5px solid var(--lg-border-input)',
              background: 'rgba(var(--lg-accent-rgb), 0.04)',
            },
            '& .MuiFormControlLabel-label': {
              fontSize: '13px',
              color: 'var(--lg-text-secondary)',
              textTransform: 'none',
              letterSpacing: 'normal',
              fontWeight: 400,
            },
          }}
        >
          <AlertModal />

          <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
              <BaseCard title={user && user.id ? 'Editar Usuario' : 'Cadastrar Usuario'}>
                {texto && <Alert variant="filled" severity="warning">{texto}</Alert>}

                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--lg-text-muted)',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    mb: 2,
                  }}
                >
                  Dados do usuario
                </Typography>

                <Stack spacing={2}>
                  {userProfile === 'admin' && (
                    <FormControl fullWidth required>
                      <InputLabel>Perfil do Usuario</InputLabel>
                      <Select
                        id="profile"
                        value={profile}
                        name="profile"
                        label="Perfil do Usuario"
                        onChange={changeItem}
                        variant="outlined"
                        disabled={Boolean(user && user.id === userId)}
                      >
                        {dbProfiles
                          .filter((p) => p.ativo && p.slug !== 'admin')
                          .map((p) => (
                            <MenuItem key={p.id} value={p.slug}>
                              {p.nome}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    id="name"
                    label="Nome"
                    variant="outlined"
                    name="name"
                    value={name || ''}
                    onChange={changeItem}
                    required
                    inputProps={{
                      style: {
                        textTransform: 'uppercase',
                      },
                    }}
                  />

                  <TextField
                    id="email"
                    label="@Email"
                    variant="outlined"
                    type="email"
                    name="email"
                    value={email || ''}
                    onChange={changeItem}
                    required
                  />

                  <CpfCnpj
                    value={cpf || ''}
                    label={'CPF'}
                    name={'cpf'}
                    changeItem={changeItem}
                    disabled={Boolean(user && user.id)}
                  />

                  <FormControlLabel
                    control={<Switch checked={is_driver} onClick={() => handleIsDriver(is_driver)} />}
                    label={is_driver ? 'DIRIGE VEICULO OFICIAL' : 'NAO DIRIGE VEICULO OFICIAL'}
                  />

                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Senha"
                    type="password"
                    value={password || ''}
                    onChange={changeItem}
                    id="password"
                  />

                  <TextField
                    required
                    fullWidth
                    name="password2"
                    label="Repita a Senha"
                    type="password"
                    value={password2 || ''}
                    onChange={changeItem}
                    id="password2"
                  />
                </Stack>

                <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
                  <Button
                    onClick={handleSaveData}
                    variant="contained"
                    sx={{
                      flex: 1,
                      py: 1.2,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--lg-accent), #6D28D9)',
                      boxShadow: 'var(--lg-shadow-btn)',
                      textTransform: 'none',
                      fontSize: '14px',
                      '&:hover': {
                        opacity: 0.92,
                        transform: 'translateY(-1px)',
                        boxShadow: 'var(--lg-shadow-btn-hover)',
                        background: 'linear-gradient(135deg, var(--lg-accent-hover), #7C3AED)',
                      },
                    }}
                  >
                    Gravar
                  </Button>

                  <Button
                    onClick={cleanForm}
                    variant="outlined"
                    sx={{
                      py: 1.2,
                      px: 2.2,
                      borderRadius: '10px',
                      background: 'var(--lg-glass-input)',
                      border: '0.5px solid var(--lg-border-input)',
                      color: 'var(--lg-text-secondary)',
                      textTransform: 'none',
                      '&:hover': {
                        background: 'var(--lg-glass-input-focus)',
                        color: 'var(--lg-text-primary)',
                        border: '0.5px solid var(--lg-border-input)',
                      },
                    }}
                  >
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
