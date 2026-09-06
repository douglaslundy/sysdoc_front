import React, { useState, useEffect, useContext } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import CpfCnpj from '../../inputs/textFields/cpfCnpj';
import Phone from '../../inputs/textFields/phone';
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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { showUser } from '../../../store/ducks/users';
import { editUserFetch, addUserFetch } from '../../../store/fetchActions/user';
import { turnUserModal, changeTitleAlert, addAlertMessage } from '../../../store/ducks/Layout';
import { AuthContext } from '../../../contexts/AuthContext';
import { getAllProfiles } from '../../../store/fetchActions/accessProfiles';
import { api } from '../../../services/api';

const flattenProtocolUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).flatMap((item) => [
    { ...item, level },
    ...flattenProtocolUnits(item.children, level + 1),
  ]);

export default function UserModal(props) {
  const [form, setForm] = useState({
    profile: '',
    name: '',
    preferred_name: '',
    phone: '',
    email: '',
    cpf: '',
    is_driver: false,
    is_rt_psf: false,
    rt_all_teams: false,
    chat_access_override: '',
    protocol_unit_ids: [],
    password: '',
    password2: '',
  });

  const [equipesRt, setEquipesRt] = useState([]);
  const [equipesOpcoes, setEquipesOpcoes] = useState([]);
  const [loadingEquipes, setLoadingEquipes] = useState(false);
  const [protocolUnits, setProtocolUnits] = useState([]);
  const [specialityPermissions, setSpecialityPermissions] = useState([]);
  const [specialityPermissionsLoaded, setSpecialityPermissionsLoaded] = useState(false);

  const { user } = useSelector((state) => state.users);
  const { isOpenUserModal } = useSelector((state) => state.layout);
  const { profiles: dbProfiles } = useSelector((state) => state.accessProfiles);
  const dispatch = useDispatch();
  const { user: userId, profile: userProfile } = useContext(AuthContext);

  const { profile, name, preferred_name, phone, email, cpf, is_driver, password, password2 } = form;
  const [texto, setTexto] = useState();

  const changeItem = ({ target }) => {
    setForm({
      ...form,
      [target.name]: target.name === 'preferred_name'
        ? target.value.toUpperCase()
        : target.value,
    });
  };

  const cleanForm = () => {
    setForm({
      profile: '',
      name: '',
      preferred_name: '',
      phone: '',
      email: '',
      cpf: '',
      is_driver: false,
      is_rt_psf: false,
      rt_all_teams: false,
      chat_access_override: '',
      protocol_unit_ids: [],
      password: '',
      password2: '',
    });
    setTexto('');
    setEquipesRt([]);
    setEquipesOpcoes([]);
    setProtocolUnits([]);
    setSpecialityPermissions([]);
    setSpecialityPermissionsLoaded(false);
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

    // Wrap cleanForm so that equipes and speciality permissions are saved before the modal closes.
    // editUserFetch calls the second argument synchronously in .then(),
    // so we pass an async wrapper that fires the PUT calls first.
    const cleanFormWithEquipes = async () => {
      if (userProfile === 'admin' && user?.id) {
        await api.put(`/users/${user.id}/equipe-aps`, {
          is_rt_psf: form.is_rt_psf,
          rt_all_teams: form.rt_all_teams,
          equipes: form.is_rt_psf && !form.rt_all_teams ? equipesRt : [],
        }).catch(() => {});

        if (specialityPermissionsLoaded) {
          await api.put(`/users/${user.id}/speciality-permissions`, {
            permissions: specialityPermissions.map((item) => ({
              speciality_id: item.speciality_id,
              can_view: item.can_view,
              can_edit: item.can_edit,
              can_insert: item.can_insert,
            })),
          }).catch(() => {});
        }
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

  const toggleSpecialityPermission = (specialityId, field) => {
    setSpecialityPermissions((current) => current.map((item) => {
      if (item.speciality_id !== specialityId) return item;

      const next = { ...item, [field]: !item[field] };

      if ((field === 'can_edit' || field === 'can_insert') && next[field]) {
        next.can_view = true;
      }

      if (field === 'can_view' && !next.can_view) {
        next.can_edit = false;
        next.can_insert = false;
      }

      return next;
    }));
  };

  const handleClose = () => {
    cleanForm();
  };

  // Load user data when editing an existing user
  useEffect(() => {
    if (user && user.id) {
      setForm({
        ...user,
        preferred_name: user.preferred_name ?? '',
        phone: user.phone ?? '',
        is_driver: user.is_driver === true || Number(user.is_driver) === 1,
        is_rt_psf: Boolean(user.is_rt_psf),
        rt_all_teams: Boolean(user.rt_all_teams),
        chat_access_override: user.chat_access_override ?? '',
        protocol_unit_ids: Array.isArray(user.protocol_unit_ids) ? user.protocol_unit_ids : [],
      });
      if (userProfile === 'admin') {
        api.get(`/users/${user.id}/equipe-aps`)
          .then(r => setEquipesRt(r.data.equipes ?? []))
          .catch(() => {});
        api.get(`/users/${user.id}/speciality-permissions`)
          .then(r => {
            setSpecialityPermissions(r.data ?? []);
            setSpecialityPermissionsLoaded(true);
          })
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

  useEffect(() => {
    if (!isOpenUserModal || userProfile !== 'admin' || protocolUnits.length > 0) return;
    api.get('/protocolos/unidades-organizacionais')
      .then(({ data }) => setProtocolUnits(flattenProtocolUnits(data).filter((unit) => unit.ativo !== false)))
      .catch(() => {});
  }, [isOpenUserModal, userProfile, protocolUnits.length]);

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
                    id="preferred_name"
                    label="Como gostaria de ser chamado"
                    variant="outlined"
                    name="preferred_name"
                    value={preferred_name || ''}
                    onChange={changeItem}
                    fullWidth
                    helperText="Se não preencher, o chat exibirá o nome do usuário."
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

                  <Phone
                    value={phone || ''}
                    label="Telefone"
                    name="phone"
                    changeItem={changeItem}
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
                      <FormControl fullWidth>
                        <InputLabel>Acesso individual ao chat</InputLabel>
                        <Select
                          value={form.chat_access_override}
                          label="Acesso individual ao chat"
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            chat_access_override: event.target.value,
                          }))}
                        >
                          <MenuItem value="">Herdar configuração do perfil</MenuItem>
                          <MenuItem value={true}>Permitir</MenuItem>
                          <MenuItem value={false}>Bloquear</MenuItem>
                        </Select>
                      </FormControl>

                      <Autocomplete
                        multiple
                        fullWidth
                        options={protocolUnits}
                        getOptionLabel={(option) => `${'— '.repeat(option.level || 0)}${option.nome}`}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={protocolUnits.filter((unit) => form.protocol_unit_ids.includes(unit.id))}
                        onChange={(_, selected) => setForm((current) => ({
                          ...current,
                          protocol_unit_ids: selected.map((unit) => unit.id),
                        }))}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Secretaria / unidade organizacional"
                            placeholder="Selecione a lotação do usuário"
                          />
                        )}
                      />

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

                      {Boolean(user && user.id) && specialityPermissionsLoaded && specialityPermissions.length > 0 && (
                        <>
                          <Typography
                            sx={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--lg-text-muted)',
                              letterSpacing: '0.07em',
                              textTransform: 'uppercase',
                              mt: 1,
                            }}
                          >
                            Permissões por especialidade da Fila
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Especialidade</TableCell>
                                <TableCell align="center">Ver</TableCell>
                                <TableCell align="center">Editar</TableCell>
                                <TableCell align="center">Inserir paciente</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {specialityPermissions.map((item) => (
                                <TableRow key={item.speciality_id}>
                                  <TableCell>{item.speciality_name}</TableCell>
                                  <TableCell align="center">
                                    <Checkbox
                                      checked={Boolean(item.can_view)}
                                      onChange={() => toggleSpecialityPermission(item.speciality_id, 'can_view')}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Checkbox
                                      checked={Boolean(item.can_edit)}
                                      onChange={() => toggleSpecialityPermission(item.speciality_id, 'can_edit')}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Checkbox
                                      checked={Boolean(item.can_insert)}
                                      onChange={() => toggleSpecialityPermission(item.speciality_id, 'can_insert')}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
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

