import React, { useState } from 'react';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Link,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import NextLink from 'next/link';
import { api } from '../src/services/api';

export default function EsqueciSenha() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erro, setErro] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setLoading(true);
        try {
            await api.post('/forgot-password', { email });
            setSucesso(true);
        } catch (err) {
            setErro(err.response?.data?.message || 'Erro ao enviar e-mail. Tente novamente.');
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
                    <FeatherIcon icon="lock" width="48" height="48" color="#1976d2" />
                    <Typography variant="h4" fontWeight="bold" mt={1}>
                        Esqueceu a senha?
                    </Typography>
                    <Typography color="textSecondary" mt={1}>
                        Informe seu e-mail cadastrado e enviaremos um link para redefinição.
                    </Typography>
                </Box>

                {sucesso ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography fontWeight="bold">E-mail enviado!</Typography>
                        <Typography variant="body2" mt={0.5}>
                            Se o e-mail estiver cadastrado, você receberá as instruções em breve.
                            Verifique também a caixa de spam.
                        </Typography>
                    </Alert>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
                        <TextField
                            fullWidth
                            label="E-mail"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FeatherIcon icon="send" width="18" height="18" />}
                        >
                            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
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
