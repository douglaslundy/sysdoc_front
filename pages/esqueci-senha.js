import React, { useState } from 'react';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Link,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FeatherIcon from 'feather-icons-react';
import NextLink from 'next/link';
import { api } from '../src/services/api';

export default function EsqueciSenha() {
    const theme = useTheme();
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
            const apiMessage = String(err?.response?.data?.message || '');
            const lower = apiMessage.toLowerCase();

            if (err?.response?.status === 429) {
                setErro('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.');
            } else if (lower.includes('authentication required') || lower.includes('expected response code "250" but got code "530"')) {
                setErro('Nao foi possivel enviar o e-mail no momento por indisponibilidade do servico de envio. Tente novamente em instantes.');
            } else {
                setErro(err.response?.data?.message || 'Erro ao enviar e-mail. Tente novamente.');
            }
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
            bgcolor="background.default"
            p={2}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    maxWidth: 440,
                    width: '100%',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                }}
            >
                <Box textAlign="center" mb={3}>
                    <FeatherIcon icon="lock" width="48" height="48" color={theme.palette.primary.main} />
                    <Typography variant="h4" fontWeight="bold" mt={1}>
                        Esqueceu a senha?
                    </Typography>
                    <Typography color="text.secondary" mt={1}>
                        Informe seu e-mail cadastrado e enviaremos um link para redefinicao.
                    </Typography>
                </Box>

                {sucesso ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography fontWeight="bold">E-mail enviado!</Typography>
                        <Typography variant="body2" mt={0.5}>
                            Se o e-mail estiver cadastrado, voce recebera as instrucoes em breve.
                            Verifique tambem a caixa de spam.
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
                            {loading ? 'Enviando...' : 'Enviar link de redefinicao'}
                        </Button>
                    </form>
                )}

                <Box textAlign="center" mt={3}>
                    <NextLink href="/login" passHref>
                        <Link underline="hover" color="primary">
                            Voltar para o login
                        </Link>
                    </NextLink>
                </Box>
            </Paper>
        </Box>
    );
}
