import React, { useState } from 'react';
import {
    Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
    Divider, Stack, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import axios from 'axios';

const STATUS_COR = { normal: 'success', baixo: 'info', alto: 'error', critico: 'secondary', indefinido: 'default' };

export default function ConsultaExame() {
    const [form, setForm]             = useState({ protocolo: '', senha: '' });
    const [resultado, setResultado]   = useState(null);
    const [erro, setErro]             = useState('');
    const [loading, setLoading]       = useState(false);

    const change = ({ target }) =>
        setForm(f => ({ ...f, [target.name]: target.name === 'protocolo' ? target.value.toUpperCase() : target.value }));

    const handleConsultar = async () => {
        setErro('');
        setResultado(null);
        setLoading(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/consulta-exame`, form);
            setResultado(res.data);
        } catch (e) {
            setErro(e?.response?.data?.error || 'Protocolo ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };

    const handleNova = () => {
        setResultado(null);
        setErro('');
        setForm({ protocolo: '', senha: '' });
    };

    const handleImprimirLaudo = async () => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/consulta-exame/pdf/${form.protocolo}`,
                { senha: form.senha },
                { responseType: 'blob' },
            );
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laudo-${form.protocolo}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // erro silenciado — PDF pode não estar disponível
        }
    };

    return (
        <Box minHeight="100vh" bgcolor="#f4f6f8" display="flex" alignItems="center" justifyContent="center" p={2}>
            <Box maxWidth={680} width="100%">
                <Typography variant="h4" align="center" mb={3} color="primary.main">
                    Consulta de Resultado de Exame
                </Typography>

                {!resultado ? (
                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <TextField
                                    label="Protocolo"
                                    name="protocolo"
                                    value={form.protocolo}
                                    onChange={change}
                                    placeholder="LAB-XXXXXXXX"
                                    inputProps={{ maxLength: 20, style: { textTransform: 'uppercase', letterSpacing: 2 } }}
                                    fullWidth
                                />
                                <TextField
                                    label="Senha"
                                    name="senha"
                                    type="password"
                                    value={form.senha}
                                    onChange={change}
                                    inputProps={{ maxLength: 6 }}
                                    fullWidth
                                />
                                {erro && <Alert severity="error">{erro}</Alert>}
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleConsultar}
                                    disabled={loading || !form.protocolo || !form.senha}
                                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                                >
                                    {loading ? 'Consultando...' : 'Consultar'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                                <Box>
                                    <Typography variant="h6">{resultado.paciente?.nome}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Protocolo: {resultado.protocolo} &nbsp;|&nbsp;
                                        Válido até: {resultado.data_validade ? new Date(resultado.data_validade).toLocaleDateString('pt-BR') : '—'}
                                    </Typography>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        color="success"
                                        onClick={handleImprimirLaudo}
                                        startIcon={<span style={{ fontSize: 14 }}>⬇</span>}
                                    >
                                        Baixar Laudo PDF
                                    </Button>
                                    <Button variant="outlined" size="small" onClick={handleNova}>Nova Consulta</Button>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {Object.entries(resultado.campos_por_exame || {}).map(([exameId, grupo]) => (
                                <Box key={exameId} mb={3}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                                        {grupo.nome_exame}
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Campo</TableCell>
                                                    <TableCell>Valor</TableCell>
                                                    <TableCell>Unidade</TableCell>
                                                    <TableCell align="center">Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(grupo.campos || []).map((rc, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{rc.campo}</TableCell>
                                                        <TableCell>{rc.valor_numerico ?? rc.valor_texto ?? '—'}</TableCell>
                                                        <TableCell>{rc.unidade || '—'}</TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={rc.status_referencia}
                                                                color={STATUS_COR[rc.status_referencia] || 'default'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
}
