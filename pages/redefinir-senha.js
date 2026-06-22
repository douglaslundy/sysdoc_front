import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import FeatherIcon from 'feather-icons-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { api } from '../src/services/api';

export default function RedefinirSenha() {
  const theme = useTheme();
  const router = useRouter();
  const { token, email } = router.query;

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const isDark = theme.palette.mode === 'dark';
  const pageBg = isDark
    ? 'linear-gradient(135deg, #07111f 0%, #0f1b2d 45%, #172554 100%)'
    : 'linear-gradient(135deg, #f5f8ff 0%, #eef4ff 45%, #ffffff 100%)';
  const cardBg = isDark ? alpha('#0b1220', 0.78) : alpha('#ffffff', 0.88);
  const borderColor = isDark ? alpha(theme.palette.primary.light, 0.22) : alpha(theme.palette.primary.main, 0.12);

  const handleChange = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (form.password.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (form.password !== form.password_confirmation) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reset-password', { email, token, ...form });
      setSucesso(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        background: pageBg,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(circle at top left, rgba(59,130,246,0.20), transparent 30%), radial-gradient(circle at bottom right, rgba(16,185,129,0.12), transparent 26%)'
            : 'radial-gradient(circle at top left, rgba(37,99,235,0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(14,165,233,0.10), transparent 24%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          background: cardBg,
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.45)'
            : '0 24px 80px rgba(15,23,42,0.12)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark
                ? 'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(16,185,129,0.16))'
                : 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.10))',
              border: `1px solid ${borderColor}`,
            }}
          >
            <FeatherIcon icon="key" width="32" height="32" color={theme.palette.primary.main} />
          </Box>
          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.3 }}>
            Nova senha
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Digite a nova senha para concluir a redefinição.
          </Typography>
        </Box>

        {sucesso ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography fontWeight={700}>Senha redefinida com sucesso!</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Você será redirecionado para o login em instantes.
            </Typography>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {erro ? <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert> : null}
            {(!token || !email) ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Link inválido. Solicite um novo link de redefinição.
              </Alert>
            ) : null}

            <TextField
              fullWidth
              label="Nova senha"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirmar nova senha"
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !token || !email}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FeatherIcon icon="check" width="18" height="18" />}
              sx={{
                py: 1.3,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main || theme.palette.primary.dark})`,
                boxShadow: `0 18px 36px ${alpha(theme.palette.primary.main, 0.28)}`,
              }}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        )}

        <Box textAlign="center" mt={3}>
          <NextLink href="/login" passHref>
            <Link underline="hover" color="primary" sx={{ fontWeight: 600 }}>
              ← Voltar para o login
            </Link>
          </NextLink>
        </Box>
      </Paper>
    </Box>
  );
}
