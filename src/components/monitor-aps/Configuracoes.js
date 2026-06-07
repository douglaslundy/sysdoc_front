import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    MenuItem,
    Select,
    TextField,
    Typography,
    FormControl,
    InputLabel,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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

const emptyConfig = {
    host: 'localhost',
    port: 5432,
    database: 'esus',
    user: 'monitor_aps',
    password: '',
};

const emptyMunicipio = {
    ibge: '',
    nome: '',
    estrato: 4,
};

export default function ConfiguracoesAPS() {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [config, setConfig] = useState(emptyConfig);
    const [status, setStatus] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [equipes, setEquipes] = useState([]);
    const [municipio, setMunicipio] = useState(emptyMunicipio);
    const [tabelas, setTabelas] = useState([]);
    const [explorando, setExplorando] = useState(false);
    const [exploracaoResult, setExploracaoResult] = useState(null);
    const [testando, setTestando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [sqlCopiado, setSqlCopiado] = useState(false);

    const isLightMode = theme.palette.mode === 'light';
    const inputChipBorder = alpha(theme.palette.primary.main, isLightMode ? 0.24 : 0.28);

    useEffect(() => {
        monitorApsApi.get('/config/status').then(setStatus).catch(() => {});
        monitorApsApi.get('/config/load').then((c) => {
            setConfig((prev) => ({
                ...prev,
                host: c.host || prev.host,
                port: c.port || prev.port,
                database: c.database || prev.database,
                user: c.user || prev.user,
                password: c.password || prev.password,
            }));
            setMunicipio((prev) => ({
                ibge: c.municipio_ibge || prev.ibge,
                nome: c.municipio_nome || prev.nome,
                estrato: c.estrato_ied ?? prev.estrato,
            }));
        }).catch((e) => {
            dispatch(addAlertMessage(`Erro ao carregar configuração: ${e.response?.status ?? ''} ${e.message}`));
        });
        monitorApsApi.get('/config/equipes').then((d) => setEquipes(d.equipes ?? [])).catch(() => {});
    }, [dispatch]);

    const change = ({ target }) => setConfig((c) => ({ ...c, [target.name]: target.value }));

    async function testar() {
        setTestando(true);
        setTestResult(null);
        try {
            const r = await monitorApsApi.post('/config/test', config);
            setTestResult(r);
            if (r.success) {
                setTabelas(r.tabelas ?? []);
                const eq = await monitorApsApi.get('/config/equipes');
                setEquipes(eq.equipes ?? []);
            }
        } catch (e) {
            setTestResult({ success: false, error: e.message });
        } finally {
            setTestando(false);
        }
    }

    async function salvar() {
        setSalvando(true);
        try {
            await monitorApsApi.post('/config/save', {
                ...config,
                municipio_ibge: municipio.ibge,
                municipio_nome: municipio.nome,
                estrato_ied: municipio.estrato,
            });
            setStatus((s) => ({ ...s, configured: true, host: config.host, database: config.database }));
            dispatch(addMessage('Configuração salva com sucesso!'));
            dispatch(turnAlert());
        } catch (e) {
            const backendError = e.response?.data?.error || e.response?.data?.message;
            dispatch(addAlertMessage(`Erro ao salvar: ${backendError || e.message}`));
        } finally {
            setSalvando(false);
        }
    }

    async function explorar() {
        setExplorando(true);
        setExploracaoResult(null);
        try {
            const r = await monitorApsApi.get('/config/explorar');
            setExploracaoResult(r);
        } catch (e) {
            dispatch(addAlertMessage(`Erro ao explorar banco: ${e.message}`));
        } finally {
            setExplorando(false);
        }
    }

    function copiarSQL() {
        navigator.clipboard.writeText(SQL_SETUP).then(() => {
            setSqlCopiado(true);
            setTimeout(() => setSqlCopiado(false), 2000);
        });
    }

    const statusTone = status?.connected
        ? theme.palette.success.main
        : status?.configured
            ? theme.palette.warning.main
            : theme.palette.text.secondary;

    const statusLabel = status?.connected
        ? 'Conectado'
        : status?.configured
            ? 'Desconectado'
            : 'Não configurado';

    const statusIcon = status?.connected
        ? 'check-circle'
        : status?.configured
            ? 'alert-circle'
            : 'circle';

    const panelSx = {
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        position: 'relative',
        zIndex: 1,
    };

    const statusBoxSx = {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, isLightMode ? 0.18 : 0.24)}`,
        background: isLightMode
            ? `linear-gradient(135deg, ${alpha('#ffffff', 0.76)}, ${alpha('#eef5ff', 0.72)})`
            : `linear-gradient(135deg, ${alpha('#08122f', 0.8)}, ${alpha('#071024', 0.86)})`,
        boxShadow: isLightMode
            ? `0 14px 30px ${alpha(theme.palette.primary.main, 0.12)}`
            : `0 18px 36px ${alpha('#020817', 0.38)}`,
        backdropFilter: 'var(--lg-blur-input)',
        WebkitBackdropFilter: 'var(--lg-blur-input)',
    };

    const resultBoxSx = (success) => ({
        p: 1.5,
        borderRadius: 1.5,
        border: `1px solid ${alpha(success ? theme.palette.success.main : theme.palette.error.main, isLightMode ? 0.3 : 0.42)}`,
        background: success
            ? alpha(theme.palette.success.main, isLightMode ? 0.08 : 0.14)
            : alpha(theme.palette.error.main, isLightMode ? 0.08 : 0.14),
    });

    const inlineChipSx = (color) => ({
        height: 20,
        borderColor: alpha(color, 0.35),
        background: alpha(color, isLightMode ? 0.08 : 0.18),
        color: isLightMode ? theme.palette.text.primary : theme.palette.common.white,
        fontWeight: 700,
    });

    return (
        <Box className="dashboard-neon-page monitor-aps-page queue-page" sx={modalFormRootSx}>
            <Box className="dashboard-neon-home monitor-aps-surface monitor-aps-config-page queue-page" sx={panelSx}>
                <AlertModal />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Typography variant="h5" fontWeight={700} mt="20px">
                        Configurações do Monitor APS
                    </Typography>

                    <Box sx={statusBoxSx}>
                        <FeatherIcon icon={statusIcon} color={statusTone} width="20" height="20" />
                        <Chip
                            label={statusLabel}
                            size="small"
                            sx={{
                                bgcolor: alpha(statusTone, isLightMode ? 0.12 : 0.18),
                                color: statusTone,
                                border: `1px solid ${alpha(statusTone, 0.25)}`,
                                fontWeight: 700,
                            }}
                        />
                        {status?.database && (
                            <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                - {status.host} / {status.database}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <BaseCard title="1. Conexão com o Banco de Dados eSUS PEC">
                    <Grid container spacing={2} mt={0.5}>
                        <Grid item xs={12} md={6}>
                            <TextField className="lg-search-field" fullWidth label="Host / IP" name="host" value={config.host} onChange={change} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField className="lg-search-field" fullWidth label="Porta" name="port" type="number" value={config.port} onChange={change} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField className="lg-search-field" fullWidth label="Nome do banco" name="database" value={config.database} onChange={change} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField className="lg-search-field" fullWidth label="Usuário" name="user" value={config.user} onChange={change} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                className="lg-search-field"
                                fullWidth
                                label="Senha"
                                name="password"
                                type="password"
                                value={config.password}
                                onChange={change}
                            />
                        </Grid>
                    </Grid>

                    {testResult && (
                        <Box mt={2}>
                            <Box sx={resultBoxSx(testResult.success)}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: testResult.success ? theme.palette.success.dark : theme.palette.error.dark,
                                        fontWeight: 600,
                                    }}
                                >
                                    {testResult.success
                                        ? `✅ ${testResult.mensagem}`
                                        : `❌ ${testResult.mensagem || testResult.error || 'Não foi possível conectar ao servidor'}`}
                                </Typography>
                            </Box>

                            {tabelas.length > 0 && (() => {
                                const porSchema = tabelas.reduce((acc, t) => {
                                    if (!acc[t.schema]) acc[t.schema] = [];
                                    acc[t.schema].push(t);
                                    return acc;
                                }, {});

                                return (
                                    <Box
                                        mt={1.5}
                                        p={1.5}
                                        borderRadius={1.5}
                                        sx={{
                                            bgcolor: 'var(--lg-glass-input)',
                                            border: '0.5px solid var(--lg-border-input)',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                color: 'var(--lg-text-muted)',
                                                letterSpacing: 0.5,
                                            }}
                                        >
                                            {tabelas.length} tabela(s) em {Object.keys(porSchema).length} schema(s)
                                        </Typography>
                                        <Box mt={1} sx={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {Object.entries(porSchema).map(([schema, itens]) => (
                                                <Box key={schema}>
                                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                        <FeatherIcon icon="database" width="13" height="13" color="var(--lg-text-muted)" />
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: 'var(--lg-text-muted)',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5,
                                                            }}
                                                        >
                                                            {schema} ({itens.length})
                                                        </Typography>
                                                        {testResult?.schema_dw === schema && (
                                                            <Chip
                                                                label="DW eSUS"
                                                                size="small"
                                                                color="primary"
                                                                sx={inlineChipSx(theme.palette.primary.main)}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Box display="flex" flexDirection="column" gap={0.2} pl={2}>
                                                        {itens.map((t, i) => (
                                                            <Box key={i} display="flex" alignItems="center" gap={0.8}>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{ fontFamily: 'monospace', color: 'var(--lg-text-primary)', fontSize: 11 }}
                                                                >
                                                                    {t.tabela}
                                                                </Typography>
                                                                {t.tipo === 'VIEW' && (
                                                                    <Chip label="view" size="small" sx={inlineChipSx(theme.palette.info.main)} />
                                                                )}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                );
                            })()}
                        </Box>
                    )}

                    <Box display="flex" gap={1.5} mt={2} flexWrap="wrap">
                        <Button
                            variant="contained"
                            disabled={testando}
                            onClick={testar}
                            startIcon={testando ? <CircularProgress size={16} /> : <FeatherIcon icon="zap" width="16" height="16" />}
                        >
                            {testando ? 'Testando...' : 'Testar Conexão'}
                        </Button>
                        <Button
                            variant="outlined"
                            disabled={salvando}
                            onClick={salvar}
                            startIcon={salvando ? <CircularProgress size={16} /> : <FeatherIcon icon="save" width="16" height="16" />}
                        >
                            {salvando ? 'Salvando...' : 'Salvar Configuração'}
                        </Button>
                    </Box>
                </BaseCard>

                <BaseCard title="2. Configurações do Município">
                    <Grid container spacing={2} mt={0.5}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                className="lg-search-field"
                                fullWidth
                                label="Código IBGE"
                                value={municipio.ibge}
                                onChange={(e) => setMunicipio((m) => ({ ...m, ibge: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                className="lg-search-field"
                                fullWidth
                                label="Nome do Município"
                                value={municipio.nome}
                                onChange={(e) => setMunicipio((m) => ({ ...m, nome: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Estrato IED (1-4)</InputLabel>
                                <Select
                                    label="Estrato IED (1-4)"
                                    value={municipio.estrato}
                                    onChange={(e) => setMunicipio((m) => ({ ...m, estrato: Number(e.target.value) }))}
                                >
                                    {[1, 2, 3, 4].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {equipes.length > 0 && (
                        <Box mt={2}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'var(--lg-text-muted)',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Equipes ativas no banco ({equipes.length})
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.8} mt={0.8}>
                                {equipes.map((eq) => (
                                    <Chip
                                        key={eq.nu_ine}
                                        label={`${eq.no_equipe} (${eq.tipo})`}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            borderColor: inputChipBorder,
                                            bgcolor: alpha(theme.palette.primary.main, isLightMode ? 0.08 : 0.14),
                                            color: theme.palette.text.primary,
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </BaseCard>

                <BaseCard title="3. Explorar Banco Operacional eSUS PEC">
                    <Typography variant="body2" sx={{ color: 'var(--lg-text-secondary)', mb: 1.5 }}>
                        Mapeia todas as tabelas <code>tb_*</code> disponíveis com suas colunas e quantidade de registros - somente leitura, sem alterar nada no servidor.
                    </Typography>
                    <Button
                        variant="outlined"
                        disabled={explorando}
                        onClick={explorar}
                        startIcon={explorando ? <CircularProgress size={16} /> : <FeatherIcon icon="search" width="16" height="16" />}
                    >
                        {explorando ? 'Explorando...' : 'Explorar Tabelas'}
                    </Button>

                    {exploracaoResult && (
                        <Box mt={2}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: 'var(--lg-text-muted)',
                                    letterSpacing: 0.5,
                                }}
                            >
                                {exploracaoResult.total} tabelas operacionais encontradas
                            </Typography>
                            <Box mt={1} sx={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {exploracaoResult.tabelas?.map((t, i) => (
                                    <Box
                                        key={i}
                                        p={1.5}
                                        borderRadius={1.5}
                                        sx={{
                                            bgcolor: 'var(--lg-glass-input)',
                                            border: '0.5px solid var(--lg-border-input)',
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1} mb={0.8}>
                                            <FeatherIcon icon="table" width="14" height="14" color="var(--lg-text-muted)" />
                                            <Typography
                                                variant="caption"
                                                sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lg-text-primary)' }}
                                            >
                                                {t.tabela}
                                            </Typography>
                                            {t.total !== null && (
                                                <Chip
                                                    label={`${t.total.toLocaleString('pt-BR')} registros`}
                                                    size="small"
                                                    sx={inlineChipSx(theme.palette.success.main)}
                                                />
                                            )}
                                        </Box>
                                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                                            {t.colunas?.map((c, j) => (
                                                <Chip
                                                    key={j}
                                                    label={`${c.coluna} · ${c.tipo}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: 10,
                                                        fontFamily: 'monospace',
                                                        borderColor: inputChipBorder,
                                                        bgcolor: alpha(theme.palette.primary.main, isLightMode ? 0.06 : 0.12),
                                                        color: theme.palette.text.primary,
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </BaseCard>

                <BaseCard title="4. Script SQL - Criar usuário somente-leitura">
                    <Typography variant="body2" sx={{ color: 'var(--lg-text-secondary)', mb: 1.5 }}>
                        Execute este script <strong>uma vez</strong> no banco do eSUS PEC como superusuário (postgres) antes de usar em produção.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        maxRows={8}
                        value={SQL_SETUP}
                        InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                        className="lg-search-field"
                    />
                    <Box mt={1.5}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={copiarSQL}
                            startIcon={<FeatherIcon icon={sqlCopiado ? 'check' : 'copy'} width="16" height="16" />}
                        >
                            {sqlCopiado ? 'Copiado!' : 'Copiar SQL'}
                        </Button>
                    </Box>
                </BaseCard>
            </Box>
        </Box>
    );
}
