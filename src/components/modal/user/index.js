import React, { useState, useEffect, useContext } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import CpfCnpj from '../../inputs/textFields/cpfCnpj';
import {
  modalFormRootSx,
  modalBackdropSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalShellSx,
} from '../_shared/modalFormStyles';
import BaseCard from '../../baseCard/BaseCard';
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
  Autocomplete,
  Checkbox,
  Chip,
} from '@mui/material';
import { showUser } from '../../../store/ducks/users';
import { editUserFetch, addUserFetch } from '../../../store/fetchActions/user';
import { turnUserModal, changeTitleAlert, addAlertMessage } from '../../../store/ducks/Layout';
import { AuthContext } from '../../../contexts/AuthContext';
import { getAllProfiles } from '../../../store/fetchActions/accessProfiles';
import { api } from '../../../services/api';
export default function UserModal(props) {
  const [form, setForm] = useState({
    profile: '',
    name: '',
    email: '',
    cpf: '',
    is_driver: false,
    is_rt_psf: false,
    rt_all_teams: false,
    password: '',
    password2: '',
  });

  const [equipesRt, setEquipesRt] = useState([]);
  const [equipesOpcoes, setEquipesOpcoes] = useState([]);
  const [loadingEquipes, setLoadingEquipes] = useState(false);

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
      is_rt_psf: false,
      rt_all_teams: false,
      password: '',
      password2: '',
    });
    setTexto('');
    setEquipesRt([]);
    setEquipesOpcoes([]);
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
    dispatch(changeTitleAlert(`O usuário ${form.name} foi cadastrado com sucesso!`));
    dispatch(addUserFetch(form, cleanForm));
  };

  const handlePutData = async () => {
    if (password && password !== password2) {
      return;
    }

    // Wrap cleanForm so that equipes are saved before the modal closes.
    // editUserFetch calls the second argument synchronously in .then(),
    // so we pass an async wrapper that fires the equipes PUT first.
    const cleanFormWithEquipes = async () => {
      if (userProfile === 'admin' && user?.id) {
        await api.put(`/users/${user.id}/equipe-aps`, {
          is_rt_psf: form.is_rt_psf,
          rt_all_teams: form.rt_all_teams,
          equipes: form.is_rt_psf && !form.rt_all_teams ? equipesRt : [],
        }).catch(() => {});
      }
      cleanForm();
    };

    dispatch(changeTitleAlert(`O usuário ${form.name} foi atualizado com sucesso!`));
    dispatch(editUserFetch(form, cleanFormWithEquipes));
  };

  const handleIsDriver = (isDriver) => {
    setForm({
      ...form,
      is_driver: isDriver,
    });
  };

  const handleClose = () => {
    cleanForm();
  };

  // Load user data when editing an existing user
  useEffect(() => {
    if (user && user.id) {
      setForm({
        ...user,
        is_driver: user.is_driver === true || Number(user.is_driver) === 1,
        is_rt_psf: Boolean(user.is_rt_psf),
        rt_all_teams: Boolean(user.rt_all_teams),
      });
      if (userProfile === 'admin') {
        api.get(`/users/${user.id}/equipe-aps`)
          .then(r => setEquipesRt(r.data.equipes ?? []))
          .catch(() => {});
      }
    }
  }, [user]);

  // Load equipes options when RT toggle is turned on
  useEffect(() => {
    if (!form.is_rt_psf || equipesOpcoes.length > 0) return;
    setLoadingEquipes(true);
    api.get('/monitor-aps/config/equipes')
      .then(r => setEquipesOpcoes(r.data.equipes ?? []))
      .catch(() => {})
      .finally(() => setLoadingEquipes(false));
  }, [form.is_rt_psf, equipesOpcoes.length]);

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
        slotProps={{ backdrop: { sx: modalBackdropSx } }}
      >
        <Box
          className="monitor-users-modal-shell"
          sx={{ ...modalShellSx, ...modalFormRootSx }}
        >
          <AlertModal />

          <Grid container spacing={0}>
            <Grid item xs={12} lg={12}>
              <BaseCard title={user && user.id ? 'Editar Usuário' : 'Cadastrar Usuário'}>
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
                  Dados do usuário
                </Typography>

                <Stack spacing={2}>
                  {userProfile === 'admin' && (
                  <FormControl fullWidth required>
                    <InputLabel>Perfil do Usuário</InputLabel>
                    <Select
                        id="profile"
                        value={profile}
                        name="profile"
                        label="Perfil do Usuário"
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
                    fullWidth
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
                    fullWidth
                  />

                  <CpfCnpj
                    value={cpf || ''}
                    label={'CPF'}
                    name={'cpf'}
                    changeItem={changeItem}
                    disabled={Boolean(user && user.id)}
                    fullWidth
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(is_driver)}
                        onChange={(event) => handleIsDriver(event.target.checked)}
                      />
                    }
                    label={is_driver ? 'DIRIGE VEÍCULO OFICIAL' : 'NÃO DIRIGE VEÍCULO OFICIAL'}
                  />

                  {userProfile === 'admin' && (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(form.is_rt_psf)}
                            onChange={e => setForm(f => ({
                              ...f,
                              is_rt_psf: e.target.checked,
                              rt_all_teams: false,
                            }))}
                          />
                        }
                        label="É Responsável Técnico de Equipe PSF"
                      />

                      {form.is_rt_psf && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={Boolean(form.rt_all_teams)}
                              onChange={e => setForm(f => ({ ...f, rt_all_teams: e.target.checked }))}
                            />
                          }
                          label="Acesso a todas as equipes"
                        />
                      )}

                      {form.is_rt_psf && !form.rt_all_teams && (
                        <Autocomplete
                          multiple
                          fullWidth
                          options={equipesOpcoes}
                          loading={loadingEquipes}
                          getOptionLabel={opt => opt.no_equipe ?? ''}
                          isOptionEqualToValue={(opt, val) => opt.nu_ine === val.nu_ine}
                          value={equipesRt}
                          onChange={(_, newValue) => setEquipesRt(newValue)}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                key={option.nu_ine}
                                label={option.no_equipe}
                                size="small"
                                {...getTagProps({ index })}
                              />
                            ))
                          }
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Equipes autorizadas"
                              placeholder={equipesRt.length === 0 ? 'Selecione as equipes' : ''}
                              variant="outlined"
                              fullWidth
                            />
                          )}
                        />
                      )}
                    </>
                  )}

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
                  <Button onClick={handleSaveData} variant="contained" sx={modalPrimaryButtonSx}>
                    Gravar
                  </Button>

                  <Button onClick={cleanForm} variant="outlined" sx={modalSecondaryButtonSx}>
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





