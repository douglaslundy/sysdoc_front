import { useEffect, useState } from 'react';
import {
    Box, Button, Chip, CircularProgress, Divider, Grid,
    MenuItem, Select, TextField, Typography, FormControl, InputLabel,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import { useDispatch } from 'react-redux';
import { addMessage, addAlertMessage, turnAlert } from '../../store/ducks/Layout';
import { monitorApsApi } from '../../services/monitorApsApi';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const SQL_SETUP = `-- Execute como superusuário (postgres) antes de usar em produção
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'monitor_aps_reader') THEN
    CREATE ROLE monitor_aps_reader;
  END IF;
END $$;
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitor_aps_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO monitor_aps_reader;
CREATE USER monitor_aps WITH PASSWORD 'SenhaSegura123!';
GRANT monitor_aps_reader TO monitor_aps;`;

export default function ConfiguracoesAPS() {
    const dispatch = useDispatch();
    const [config, setConfig]     = useState({ host: 'localhost', port: 5432, database: 'esus', user: 'monitor_aps', password: '' });
    const [status, setStatus]     = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [equipes, setEquipes]   = useState([]);
    const [municipio, setMunicipio] = useState({ ibge: '3131703', nome: 'Ilicínea', estrato: 4 });
    const [testando, setTestando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [sqlCopiado, setSqlCopiado] = useState(false);

    useEffect(() => {
        monitorApsApi.get('/config/status').then(s => {
            setStatus(s);
            if (s.host) setConfig(c => ({
                ...c,
                host:     s.host     ?? c.host,
                port:     s.port     ?? c.port,
                database: s.database ?? c.database,
                user:     s.user     ?? c.user,
            }));
        }).catch(() => {});
        monitorApsApi.get('/config/equipes').then(d => setEquipes(d.equipes ?? [])).catch(() => {});
    }, []);

    const change = ({ target }) => setConfig(c => ({ ...c, [target.name]: target.value }));

    async function testar() {
        setTestando(true); setTestResult(null);
        try {
            const r = await monitorApsApi.post('/config/test', config);
            setTestResult(r);
            if (r.success) {
                const eq = await monitorApsApi.get('/config/equipes');
                setEquipes(eq.equipes ?? []);
            }
        } catch (e) {
            setTestResult({ success: false, error: e.message });
        } finally { setTestando(false); }
    }

    async function salvar() {
        setSalvando(true);
        try {
            await monitorApsApi.post('/config/save', config);
            const s = await monitorApsApi.get('/config/status');
            setStatus(s);
            dispatch(addMessage('Configuração salva com sucesso!'));
            dispatch(turnAlert());
        } catch (e) {
            dispatch(addAlertMessage(`Erro ao salvar: ${e.message}`));
        } finally { setSalvando(false); }
    }

    function copiarSQL() {
        navigator.clipboard.writeText(SQL_SETUP).then(() => {
            setSqlCopiado(true);
            setTimeout(() => setSqlCopiado(false), 2000);
        });
    }

    const statusCor  = status?.connected ? '#168821' : status?.configured ? '#FF8C00' : '#888';
    const statusLabel = status?.connected ? 'Conectado' : status?.configured ? 'Desconectado' : 'Não configurado';
    const statusIcon  = status?.connected ? 'check-circle' : status?.configured ? 'alert-circle' : 'circle';

    return (
        <Box sx={modalFormRootSx}>
            <AlertModal />

            <Typography variant="h5" fontWeight={700} mt="20px" mb={3}>Configurações do Monitor APS</Typography>

            {/* Status */}
            <Box display="flex" alignItems="center" gap={1.5} mb={3} p={2}
                sx={{ bgcolor: 'var(--lg-glass-input)', border: '0.5px solid var(--lg-border-input)', borderRadius: 2 }}>
                <FeatherIcon icon={statusIcon} color={statusCor} width="20" height="20" />
                <Chip label={statusLabel} size="small" sx={{ bgcolor: statusCor + '22', color: statusCor, fontWeight: 700 }} />
                {status?.database && (
                    <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                        — {status.host} / {status.database}
                    </Typography>
                )}
            </Box>

            {/* Seção 1: Conexão */}
            <BaseCard title="1. Conexão com o Banco de Dados eSUS PEC">
                <Grid container spacing={2} mt={0.5}>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Host / IP" name="host"
                            value={config.host} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Porta" name="port" type="number"
                            value={config.port} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Nome do banco" name="database"
                            value={config.database} onChange={change} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField className="lg-search-field" fullWidth label="Usuário" name="user"
                            value={config.user} onChange={change} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField className="lg-search-field" fullWidth label="Senha" name="password" type="password"
                            value={config.password} onChange={change} />
                    </Grid>
                </Grid>

                {testResult && (
                    <Box mt={2} p={1.5} borderRadius={1}
                        sx={{ bgcolor: testResult.success ? '#f0fff4' : '#fff0f0', border: `1px solid ${testResult.success ? '#168821' : '#E52207'}` }}>
                        <Typography variant="body2" sx={{ color: testResult.success ? '#168821' : '#E52207' }}>
                            {testResult.success
                                ? `✅ Conectado — ${testResult.database} (PostgreSQL ${testResult.version?.split(' ')[1] ?? ''})`
                                : `❌ Erro: ${testResult.error}`}
                        </Typography>
                    </Box>
                )}

                <Box display="flex" gap={1.5} mt={2}>
                    <Button variant="contained" disabled={testando} onClick={testar}
                        startIcon={testando ? <CircularProgress size={16} /> : <FeatherIcon icon="zap" width="16" height="16" />}>
                        {testando ? 'Testando...' : 'Testar Conexão'}
                    </Button>
                    <Button variant="outlined" disabled={salvando} onClick={salvar}
                        startIcon={salvando ? <CircularProgress size={16} /> : <FeatherIcon icon="save" width="16" height="16" />}>
                        {salvando ? 'Salvando...' : 'Salvar Configuração'}
                    </Button>
                </Box>
            </BaseCard>

            {/* Seção 2: Município */}
            <BaseCard title="2. Configurações do Município">
                <Grid container spacing={2} mt={0.5}>
                    <Grid item xs={12} md={4}>
                        <TextField className="lg-search-field" fullWidth label="Código IBGE" value={municipio.ibge}
                            onChange={e => setMunicipio(m => ({ ...m, ibge: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField className="lg-search-field" fullWidth label="Nome do Município" value={municipio.nome}
                            onChange={e => setMunicipio(m => ({ ...m, nome: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Estrato IED (1–4)</InputLabel>
                            <Select label="Estrato IED (1–4)" value={municipio.estrato}
                                onChange={e => setMunicipio(m => ({ ...m, estrato: Number(e.target.value) }))}>
                                {[1, 2, 3, 4].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {equipes.length > 0 && (
                    <Box mt={2}>
                        <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                            Equipes ativas no banco ({equipes.length})
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.8} mt={0.8}>
                            {equipes.map(eq => (
                                <Chip key={eq.nu_ine} label={`${eq.no_equipe} (${eq.tipo})`} size="small" variant="outlined" color="primary" />
                            ))}
                        </Box>
                    </Box>
                )}
            </BaseCard>

            {/* Seção 3: SQL */}
            <BaseCard title="3. Script SQL — Criar usuário somente-leitura">
                <Typography variant="body2" sx={{ color: 'var(--lg-text-secondary)', mb: 1.5 }}>
                    Execute este script <strong>uma vez</strong> no banco do eSUS PEC como superusuário (postgres) antes de usar em produção.
                </Typography>
                <TextField
                    fullWidth multiline minRows={3} maxRows={8} value={SQL_SETUP}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                    className="lg-search-field"
                />
                <Box mt={1.5}>
                    <Button variant="outlined" size="small" onClick={copiarSQL}
                        startIcon={<FeatherIcon icon={sqlCopiado ? 'check' : 'copy'} width="16" height="16" />}>
                        {sqlCopiado ? 'Copiado!' : 'Copiar SQL'}
                    </Button>
                </Box>
            </BaseCard>
        </Box>
    );
}
