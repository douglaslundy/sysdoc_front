import React, { useState, useEffect } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Phone from '../../inputs/textFields/phone';
import CpfCnpj from '../../inputs/textFields/cpfCnpj';
import BasicDatePicker from '../../inputs/datePicker';

import {
  Grid,
  Stack,
  TextField,
  Alert,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import BaseCard from '../../baseCard/BaseCard';

import { showClient } from '../../../store/ducks/clients';
import { editClientFetch, addClientFetch } from '../../../store/fetchActions/clients';
import { closeModal, changeTitleAlert } from '../../../store/ducks/Layout';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '960px',
  maxWidth: '96vw',
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

export default function ClientModal(props) {
  const [form, setForm] = useState({
    name: '',
    mother: '',
    cpf: '',
    cns: '',
    phone: '',
    email: '',
    obs: '',
    born_date: '',
    sexo: '',
    raca_cor: '',
    data_obito: '',
    zip_code: '',
    city: '',
    street: '',
    number: '',
    district: '',
    complement: '',
  });

  const { client } = useSelector((state) => state.clients);
  const { isOpenModal } = useSelector((state) => state.layout);
  const dispatch = useDispatch();

  const {
    name,
    mother,
    cpf,
    cns,
    phone,
    email,
    obs,
    born_date,
    sexo,
    zip_code,
    city,
    street,
    number,
    district,
    complement,
    raca_cor,
    data_obito,
  } = form;
  const [texto, setTexto] = useState();
  const [confirmObito, setConfirmObito] = useState(false);

  const changeItem = ({ target }) => {
    setForm({ ...form, [target.name]: target.value });
  };

  const cleanForm = () => {
    setForm({
      name: '',
      mother: '',
      cpf: '',
      cns: '',
      phone: '',
      email: '',
      obs: '',
      born_date: '',
      sexo: '',
      raca_cor: '',
      data_obito: '',
      zip_code: '',
      city: '',
      street: '',
      number: '',
      district: '',
      complement: '',
    });
    setTexto('');
    dispatch(closeModal());
    dispatch(showClient({}));
  };

  const handleSaveData = () => {
    const clienteAtivo = !(client?.id) || client?.active;
    if (form.data_obito && clienteAtivo) {
        setConfirmObito(true);
        return;
    }
    client && client.id ? handlePutData() : handlePostData();
  };

  const handleConfirmarObito = () => {
    setConfirmObito(false);
    client && client.id ? handlePutData() : handlePostData();
  };

  const handlePostData = async () => {
    dispatch(changeTitleAlert(`O cliente ${form.name} foi cadastrado com sucesso!`));
    dispatch(addClientFetch(form, cleanForm));
  };

  const handlePutData = async () => {
    dispatch(changeTitleAlert(`O cliente ${form.name} foi atualizado com sucesso!`));
    dispatch(editClientFetch(form, cleanForm));
  };

  const handleClose = () => {
    cleanForm();
  };

  const handleSetDn = (value) => {
    setForm({ ...form, born_date: value });
  };

  const handleSetDataObito = (value) => {
    setForm({ ...form, data_obito: value });
  };

  useEffect(() => {
    if (client && client.id) {
      setForm({ ...client, ...client?.addresses });
    }
  }, [client]);

  const obitoReadOnly = !!(client?.id && !client?.active && client?.data_obito);

  return (
    <div>
      {props.children}
      <Modal
        keepMounted
        open={isOpenModal}
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
          }}
        >
          <AlertModal />

          <Grid container spacing={0}>
            <Grid item xs={12}>
              <BaseCard title={client && client.id ? 'Editar Cliente' : 'Cadastrar Cliente'}>
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
                  Dados do cliente
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    id="name"
                    label={name?.length > 0 ? `Nome Completo: ${100 - name.length} caracteres restantes` : 'Nome Completo'}
                    variant="outlined"
                    name="name"
                    value={name || ''}
                    onChange={changeItem}
                    required
                    inputProps={{
                      style: { textTransform: 'uppercase' },
                      maxLength: 100,
                    }}
                  />

                  <TextField
                    id="mother"
                    label={mother?.length > 0 ? `Nome da Mae: ${50 - mother.length} caracteres restantes` : 'Nome da Mae'}
                    variant="outlined"
                    name="mother"
                    value={mother || ''}
                    onChange={changeItem}
                    inputProps={{
                      style: { textTransform: 'uppercase' },
                      maxLength: 50,
                    }}
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label={email?.length > 0 ? `@Email: ${100 - email.length} caracteres restantes` : '@Email'}
                      variant="outlined"
                      type="email"
                      name="email"
                      value={email || ''}
                      onChange={changeItem}
                      required
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 100,
                      }}
                    />

                    <BasicDatePicker
                      label="Data de Nascimento"
                      name="born_date"
                      value={born_date}
                      setValue={handleSetDn}
                      required
                    />

                    <FormControl>
                      <InputLabel id="sexo">Sexo</InputLabel>
                      <Select
                        labelId="sexo"
                        id="sexo"
                        value={sexo}
                        label="Sexo"
                        onChange={(event) => setForm({ ...form, sexo: event.target.value })}
                      >
                        <MenuItem value="MASCULINE">Masculino</MenuItem>
                        <MenuItem value="FEMININE">Feminino</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <FormControl>
                      <InputLabel id="raca_cor">Raça/Cor</InputLabel>
                      <Select
                        labelId="raca_cor"
                        value={raca_cor || ''}
                        label="Raça/Cor"
                        onChange={(e) => setForm({ ...form, raca_cor: e.target.value })}
                      >
                        <MenuItem value="">— Não selecionado —</MenuItem>
                        <MenuItem value="Branca">Branca</MenuItem>
                        <MenuItem value="Preta">Preta</MenuItem>
                        <MenuItem value="Amarela">Amarela</MenuItem>
                        <MenuItem value="Parda">Parda</MenuItem>
                        <MenuItem value="Indígena">Indígena</MenuItem>
                        <MenuItem value="Não informado">Não informado</MenuItem>
                      </Select>
                    </FormControl>

                    {client?.id && (
                      <BasicDatePicker
                        label={obitoReadOnly ? 'Data do Óbito (registrada pelo e-SUS)' : 'Data do Óbito'}
                        name="data_obito"
                        value={data_obito}
                        setValue={handleSetDataObito}
                        disabled={obitoReadOnly}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    <CpfCnpj value={cpf} label={'CPF'} name={'cpf'} required={'required'} changeItem={changeItem} />

                    <TextField
                      id="cns"
                      label={cns?.length > 0 ? `CARTAO DO SUS: ${15 - cns.length} caracteres restantes` : 'CARTAO DO SUS'}
                      variant="outlined"
                      name="cns"
                      value={cns || ''}
                      onChange={changeItem}
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 15,
                      }}
                    />

                    <Phone value={phone} label={'Telefone'} name={'phone'} changeItem={changeItem} />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 3fr 1fr' }, gap: 2 }}>
                    <TextField
                      id="zip_code"
                      label={zip_code?.length > 0 ? `CEP: ${10 - zip_code.length} caracteres restantes` : 'CEP'}
                      variant="outlined"
                      name="zip_code"
                      value={zip_code || ''}
                      onChange={changeItem}
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 10,
                      }}
                    />

                    <TextField
                      id="street"
                      label={street?.length > 0 ? `Rua: ${100 - street.length} caracteres restantes` : 'Rua'}
                      variant="outlined"
                      name="street"
                      value={street || ''}
                      onChange={changeItem}
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 100,
                      }}
                    />

                    <TextField
                      id="number"
                      label={number?.length > 0 ? `N: ${6 - number.length} caracteres restantes` : 'N'}
                      variant="outlined"
                      name="number"
                      value={number || ''}
                      onChange={changeItem}
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 6,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    <TextField
                      id="complement"
                      label={complement?.length > 0 ? `Complemento: ${50 - complement.length} caracteres restantes` : 'Complemento'}
                      variant="outlined"
                      name="complement"
                      value={complement || ''}
                      onChange={changeItem}
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 50,
                      }}
                    />

                    <TextField
                      id="district"
                      label={district?.length > 0 ? `Bairro: ${100 - district.length} caracteres restantes` : 'Bairro'}
                      variant="outlined"
                      name="district"
                      value={district || ''}
                      onChange={changeItem}
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 100,
                      }}
                    />

                    <TextField
                      id="city"
                      label={city?.length > 0 ? `Cidade: ${30 - city.length} caracteres restantes` : 'Cidade'}
                      variant="outlined"
                      name="city"
                      value={city || ''}
                      onChange={changeItem}
                      inputProps={{
                        style: { textTransform: 'uppercase' },
                        maxLength: 30,
                      }}
                    />
                  </Box>

                  <TextField
                    className="client-obs-field"
                    id="obs"
                    label={obs?.length > 0 ? `OBS: ${500 - obs.length} caracteres restantes` : 'OBS'}
                    multiline
                    rows={1}
                    sx={{
                      '& .MuiInputBase-root.MuiOutlinedInput-root': {
                        minHeight: '66px !important',
                        height: '66px',
                        alignItems: 'flex-start',
                        padding: '8px 12px !important',
                      },
                      '& textarea.MuiInputBase-input': {
                        height: '42px !important',
                        minHeight: '42px !important',
                        paddingTop: '0 !important',
                        paddingBottom: '0 !important',
                        lineHeight: '14px !important',
                        overflow: 'auto',
                      },
                    }}
                    value={obs || ''}
                    name="obs"
                    onChange={changeItem}
                    inputProps={{
                      style: { textTransform: 'uppercase' },
                      maxLength: 500,
                    }}
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

        <Dialog open={confirmObito} onClose={() => setConfirmObito(false)}>
            <DialogTitle>Confirmar registro de óbito</DialogTitle>
            <DialogContent>
                <Typography>
                    Informar a data do óbito irá <strong>inativar o cadastro e todas as filas abertas</strong> deste cliente. Deseja continuar?
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmObito(false)} color="inherit">
                    Cancelar
                </Button>
                <Button onClick={handleConfirmarObito} variant="contained" color="error">
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    </div>
  );
}
