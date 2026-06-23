import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import { AuthContext } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const EMPTY = {
  title: '',
  subtitle: '',
  body: '',
  image_data: '',
  times_per_day: 1,
  interval_minutes: 60,
  target_user_id: '',
  valid_until: '',
  is_active: true,
};

export default function AdminSystemNotices() {
  const theme = useTheme();
  const { permissionsLoaded } = useContext(AuthContext);
  const [form, setForm] = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: theme.palette.text.primary,
      background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.35 : 0.72),
      borderRadius: 2,
      '& fieldset': {
        borderColor: alpha(theme.palette.divider, 0.9),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.55),
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
    },
    '& .MuiSelect-icon': {
      color: theme.palette.text.secondary,
    },
    '& .MuiInputBase-inputMultiline': {
      lineHeight: 1.7,
    },
  };

  const load = async () => {
    setError('');
    const [usersRes, noticesRes] = await Promise.allSettled([
      api.get('/users'),
      api.get('/system-notices'),
    ]);

    setUsers(usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : []);
    setNotices(noticesRes.status === 'fulfilled' ? (noticesRes.value.data || []) : []);

    const failures = [];
    if (usersRes.status === 'rejected') failures.push('usuários');
    if (noticesRes.status === 'rejected') failures.push('avisos');
    setError(failures.length === 2 ? 'Não foi possível carregar usuários ou avisos.' : '');
  };

  useEffect(() => {
    if (!permissionsLoaded) return;
    load().catch(() => setError('Não foi possível carregar usuários ou avisos.'));
  }, [permissionsLoaded]);

  const change = ({ target }) => {
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setForm((current) => ({ ...current, [target.name]: value }));
  };

  const handleImage = async ({ target }) => {
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image_data: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const targetUserId = form.target_user_id === '' ? null : Number(form.target_user_id);
      await api.post('/system-notices', {
        ...form,
        times_per_day: Number(form.times_per_day),
        interval_minutes: Number(form.interval_minutes),
        target_user_id: Number.isFinite(targetUserId) ? targetUserId : null,
        valid_until: form.valid_until || null,
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível salvar o aviso.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Deseja remover este aviso?')) return;
    await api.delete(`/system-notices/${id}`);
    load();
  };

  return (
    <Box className="queue-page avisos-page" sx={[{ py: 2 }, modalFormRootSx]}>
      <BaseCard title="Cadastro de Avisos">
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Box component="form" onSubmit={submit} sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <TextField sx={fieldSx} name="title" label="Título" value={form.title} onChange={change} required fullWidth />
            <TextField sx={fieldSx} name="subtitle" label="Subtítulo" value={form.subtitle} onChange={change} fullWidth />
            <TextField sx={fieldSx} name="body" label="Texto do aviso" value={form.body} onChange={change} required fullWidth multiline minRows={4} />
            <Button component="label" variant="outlined" startIcon={<FeatherIcon icon="image" width="16" height="16" />} sx={{ alignSelf: 'flex-start' }}>
              Inserir imagem
              <input hidden type="file" accept="image/*" onChange={handleImage} />
            </Button>
            {form.image_data ? <img src={form.image_data} alt="Pré-visualização" style={{ maxWidth: 360, borderRadius: 12, border: `1px solid ${alpha(theme.palette.divider, 0.8)}` }} /> : null}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                sx={fieldSx}
                name="times_per_day"
                label="Vezes por dia"
                type="number"
                value={form.times_per_day}
                onChange={change}
                inputProps={{ min: 1, max: 24 }}
                fullWidth
              />
              <TextField
                sx={fieldSx}
                name="interval_minutes"
                label="Intervalo em minutos"
                type="number"
                value={form.interval_minutes}
                onChange={change}
                inputProps={{ min: 1, max: 1440 }}
                fullWidth
              />
              <TextField
                sx={fieldSx}
                name="valid_until"
                label="Válido até"
                type="date"
                value={form.valid_until}
                onChange={change}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Destinatário</InputLabel>
                <Select name="target_user_id" value={form.target_user_id} label="Destinatário" onChange={change}>
                  <MenuItem value="">Todos</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" startIcon={<FeatherIcon icon="save" width="16" height="16" />}>
                Salvar
              </Button>
            </Stack>
          </Stack>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6">Título</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Destinatário</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Período</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Status</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Ações</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{notice.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{notice.subtitle || '-'}</Typography>
                  </TableCell>
                  <TableCell>{notice.target_user_id ? notice.target_user?.name || `Usuário #${notice.target_user_id}` : 'Todos'}</TableCell>
                  <TableCell>{notice.valid_until || '-'}</TableCell>
                  <TableCell>
                    <Chip size="small" color={notice.is_active ? 'success' : 'default'} label={notice.is_active ? 'Ativo' : 'Inativo'} />
                  </TableCell>
                  <TableCell>
                    <Button color="error" onClick={() => remove(notice.id)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!notices.length && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhum aviso cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </BaseCard>
    </Box>
  );
}
