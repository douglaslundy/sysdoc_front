import React, { useState } from 'react';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Link,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { api } from '../src/services/api';

export default function RedefinirSenha() {
    const router = useRouter();
    const { token, email } = router.query;

    const [form, setForm] = useState({ password: '', password_confirmation: '' });
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erro, setErro] = useState('');

    const handleChange = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        if (form.password.length < 6) {
            setErro('A senha deve ter pelo menos 6 caracteres.');
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
            display="flex"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            bgcolor="#f5f5f5"
            p={2}
        >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 440, width: '100%', borderRadius: 2 }}>
                <Box textAlign="center" mb={3}>
                    <FeatherIcon icon="key" width="48" height="48" color="#1976d2" />
                    <Typography variant="h4" fontWeight="bold" mt={1}>
                        Nova senha
                    </Typography>
                    <Typography color="textSecondary" mt={1}>
                        Digite sua nova senha abaixo.
                    </Typography>
                </Box>

                {sucesso ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography fontWeight="bold">Senha redefinida com sucesso!</Typography>
                        <Typography variant="body2" mt={0.5}>
                            Redirecionando para o login...
                        </Typography>
                    </Alert>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
                        {(!token || !email) && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Link inválido. Solicite um novo link de redefinição.
                            </Alert>
                        )}
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
                        >
                            {loading ? 'Salvando...' : 'Salvar nova senha'}
                        </Button>
                    </form>
                )}

                <Box textAlign="center" mt={3}>
                    <NextLink href="/login" passHref>
                        <Link underline="hover" color="primary">
                            ← Voltar para o login
                        </Link>
                    </NextLink>
                </Box>
            </Paper>
        </Box>
    );
}
