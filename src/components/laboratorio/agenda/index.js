import React, { useState } from 'react';
import {
    Box, Card, CardContent, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography, Button, Alert,
    CircularProgress, styled,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BasicDatePicker from '../../inputs/datePicker';
import { api } from '../../../services/api';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const StyledTableRow = styled(TableRow)(() => ({
    '& td': {
        background: 'var(--queue-row-bg)',
        borderTop: '0.5px solid var(--lg-border)',
        borderBottom: '0.5px solid var(--lg-border)',
        color: 'var(--queue-text-primary)',
    },
    '& td:first-of-type': { borderLeft: '0.5px solid var(--lg-border)', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
    '& td:last-of-type': { borderRight: '0.5px solid var(--lg-border)', borderTopRightRadius: 14, borderBottomRightRadius: 14 },
    '&:hover td': { background: 'var(--queue-row-hover)' },
}));

const STATUS_COLORS = {
    solicitado: 'warning',
    coletado: 'info',
    em_analise: 'primary',
    liberado: 'success',
    cancelado: 'error',
};

const STATUS_LABELS = {
    solicitado: 'Solicitado',
    coletado: 'Coletado',
    em_analise: 'Em Análise',
    liberado: 'Liberado',
    cancelado: 'Cancelado',
};

export default function AgendaColeta() {
    const [dataSelecionada, setDataSelecionada] = useState(new Date());
    const [agenda, setAgenda] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    const buscarAgenda = async () => {
        if (!dataSelecionada) return;
        const data = dataSelecionada instanceof Date
            ? dataSelecionada.toISOString().split('T')[0]
            : dataSelecionada;

        setCarregando(true);
        setErro('');
        try {
            const res = await api.get('/laboratorio/agenda', { params: { data } });
            setAgenda(res.data);
        } catch (err) {
            setErro(err.response?.data?.message || 'Erro ao carregar agenda.');
            setAgenda(null);
        } finally {
            setCarregando(false);
        }
    };

    const formatarData = (str) => {
        if (!str) return '—';
        const [y, m, d] = str.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <Box sx={modalFormRootSx} className="queue-page lab-agenda-page">
        <Card className="card info-card">
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Typography variant="h4">Agenda de Coleta</Typography>
                <Box display="flex" gap={2} alignItems="center">
                    <BasicDatePicker
                        label="Data de coleta"
                        setValue={setDataSelecionada}
                        value={dataSelecionada}
                        sx={{ minWidth: 220 }}
                    />
                    <Button
                        variant="contained"
                        onClick={buscarAgenda}
                        disabled={carregando}
                        startIcon={carregando
                            ? <CircularProgress size={16} color="inherit" />
                            : <FeatherIcon icon="calendar" size={16} />
                        }
                        sx={{
                            py: 1.2,
                            px: 3.2,
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
                        Consultar
                    </Button>
                </Box>
            </Box>

            <CardContent sx={{ pt: 0 }}>
                {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

                {agenda && (
                    <>
                        <Box mb={2} display="flex" gap={1} alignItems="center">
                            <Typography variant="subtitle1">
                                {formatarData(agenda.data)} —
                            </Typography>
                            <Chip
                                label={`${agenda.total} pedido(s)`}
                                color={agenda.total > 0 ? 'primary' : 'default'}
                                size="small"
                            />
                        </Box>

                        {agenda.total === 0 ? (
                            <Alert severity="info">Nenhum pedido de coleta para esta data.</Alert>
                        ) : (
                            <TableContainer>
                                <Table className="queue-page__table" size="small" sx={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><Typography variant="h6">Paciente</Typography></TableCell>
                                            <TableCell><Typography variant="h6">Exames</Typography></TableCell>
                                            <TableCell><Typography variant="h6">Médico</Typography></TableCell>
                                            <TableCell align="center"><Typography variant="h6">Status</Typography></TableCell>
                                            <TableCell><Typography variant="h6">Obs.</Typography></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {agenda.pedidos.map(pedido => (
                                            <StyledTableRow key={pedido.id} hover>
                                                <TableCell>
                                                    <Typography fontWeight="bold">{pedido.paciente?.nome || '—'}</Typography>
                                                    {pedido.paciente?.cpf && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            CPF: {pedido.paciente.cpf}
                                                        </Typography>
                                                    )}
                                                    {!pedido.paciente?.cpf && pedido.paciente?.cns && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            CNS: {pedido.paciente.cns}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                        {pedido.exames.map(e => (
                                                            <Chip key={e.id} label={e.codigo} size="small" title={e.nome} />
                                                        ))}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {pedido.medico
                                                        ? <>
                                                            <Typography variant="body2">{pedido.medico.nome}</Typography>
                                                            {pedido.medico.crm && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    CRM {pedido.medico.crm}{pedido.medico.uf ? '/' + pedido.medico.uf : ''}
                                                                </Typography>
                                                            )}
                                                          </>
                                                        : <Typography color="text.secondary" variant="caption">—</Typography>
                                                    }
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={STATUS_LABELS[pedido.status] || pedido.status}
                                                        color={STATUS_COLORS[pedido.status] || 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {pedido.observacoes || '—'}
                                                    </Typography>
                                                </TableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </>
                )}

                {!agenda && !carregando && (
                    <Box py={4} textAlign="center">
                        <FeatherIcon icon="calendar" size={40} color="#ccc" />
                        <Typography color="text.secondary" mt={1}>
                            Selecione uma data e clique em Consultar
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
        </Box>
    );
}
