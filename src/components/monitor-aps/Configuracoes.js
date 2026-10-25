import { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle, Circle, Copy, Database, Loader2, Save, Search, Table, Zap } from 'lucide-react';
import AlertModal from '../messagesModal';
import { useDispatch } from 'react-redux';
import { addMessage, addAlertMessage, turnAlert } from '../../store/ducks/Layout';
import { monitorApsApi } from '../../services/monitorApsApi';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Pilula } from '../ui/pilula';

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

    const change = ({ target: { name, value } }) => setConfig((c) => ({ ...c, [name]: value }));

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

    const statusTom = status?.connected ? 'sucesso' : status?.configured ? 'alerta' : 'neutro';
    const statusClasse = status?.connected ? 'text-success-text' : status?.configured ? 'text-warning' : 'text-muted-foreground';

    const statusLabel = status?.connected
        ? 'Conectado'
        : status?.configured
            ? 'Desconectado'
            : 'Não configurado';

    const StatusIcone = status?.connected
        ? CheckCircle
        : status?.configured
            ? AlertCircle
            : Circle;

    return (
        <div className="monitor-aps-page monitor-aps-config-page flex flex-col gap-5">
            <AlertModal />

            <div className="flex flex-col gap-3">
                <CabecalhoDePagina titulo="Configurações do Monitor APS" />

                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <StatusIcone aria-hidden className={`size-5 ${statusClasse}`} />
                    <Pilula tom={statusTom}>{statusLabel}</Pilula>
                    {status?.database && (
                        <span className="text-xs text-muted-foreground">- {status.host} / {status.database}</span>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>1. Conexão com o Banco de Dados eSUS PEC</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <CampoTexto id="cfg-host" label="Host / IP" name="host" value={config.host} onChange={change} />
                        <CampoTexto id="cfg-port" label="Porta" name="port" type="number" value={config.port} onChange={change} />
                        <CampoTexto id="cfg-database" label="Nome do banco" name="database" value={config.database} onChange={change} />
                        <CampoTexto id="cfg-user" label="Usuário" name="user" value={config.user} onChange={change} />
                        <div className="md:col-span-2">
                            <CampoTexto id="cfg-password" label="Senha" name="password" type="password" value={config.password} onChange={change} />
                        </div>
                    </div>

                    {testResult && (
                        <div className="mt-4">
                            <Banner tom={testResult.success ? 'sucesso' : 'perigo'}>
                                {testResult.success
                                    ? testResult.mensagem
                                    : (testResult.mensagem || testResult.error || 'Não foi possível conectar ao servidor')}
                            </Banner>

                            {tabelas.length > 0 && (() => {
                                const porSchema = tabelas.reduce((acc, t) => {
                                    if (!acc[t.schema]) acc[t.schema] = [];
                                    acc[t.schema].push(t);
                                    return acc;
                                }, {});

                                return (
                                    <div className="mt-3 rounded-lg border border-border bg-muted p-3">
                                        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                            {tabelas.length} tabela(s) em {Object.keys(porSchema).length} schema(s)
                                        </span>
                                        <div className="mt-2 flex max-h-80 flex-col gap-3 overflow-y-auto">
                                            {Object.entries(porSchema).map(([schema, itens]) => (
                                                <div key={schema}>
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <Database aria-hidden className="size-3.5 text-muted-foreground" />
                                                        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                                            {schema} ({itens.length})
                                                        </span>
                                                        {testResult?.schema_dw === schema && <Pilula tom="info">DW eSUS</Pilula>}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 pl-4">
                                                        {itens.map((t, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <span className="font-mono text-[11px]">{t.tabela}</span>
                                                                {t.tipo === 'VIEW' && <Pilula tom="info" contorno>view</Pilula>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                        <Button disabled={testando} onClick={testar}>
                            {testando ? <Loader2 className="animate-spin" /> : <Zap />}
                            {testando ? 'Testando...' : 'Testar Conexão'}
                        </Button>
                        <Button variant="outline" disabled={salvando} onClick={salvar}>
                            {salvando ? <Loader2 className="animate-spin" /> : <Save />}
                            {salvando ? 'Salvando...' : 'Salvar Configuração'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>2. Configurações do Município</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <CampoTexto
                            id="cfg-ibge"
                            label="Código IBGE"
                            value={municipio.ibge}
                            onChange={({ target: { value } }) => setMunicipio((m) => ({ ...m, ibge: value }))}
                        />
                        <CampoTexto
                            id="cfg-municipio"
                            label="Nome do Município"
                            value={municipio.nome}
                            onChange={({ target: { value } }) => setMunicipio((m) => ({ ...m, nome: value }))}
                        />
                        <CampoSelecao
                            id="cfg-estrato"
                            label="Estrato IED (1-4)"
                            value={municipio.estrato}
                            onChange={({ target: { value } }) => setMunicipio((m) => ({ ...m, estrato: Number(value) }))}
                        >
                            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                        </CampoSelecao>
                    </div>

                    {equipes.length > 0 && (
                        <div className="mt-4">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                                Equipes ativas no banco ({equipes.length})
                            </span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {equipes.map((eq) => (
                                    <Pilula key={eq.nu_ine} tom="info" contorno>{`${eq.no_equipe} (${eq.tipo})`}</Pilula>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>3. Explorar Banco Operacional eSUS PEC</CardTitle></CardHeader>
                <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">
                        Mapeia todas as tabelas <code>tb_*</code> disponíveis com suas colunas e quantidade de registros - somente leitura, sem alterar nada no servidor.
                    </p>
                    <Button variant="outline" disabled={explorando} onClick={explorar}>
                        {explorando ? <Loader2 className="animate-spin" /> : <Search />}
                        {explorando ? 'Explorando...' : 'Explorar Tabelas'}
                    </Button>

                    {exploracaoResult && (
                        <div className="mt-4">
                            <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                {exploracaoResult.total} tabelas operacionais encontradas
                            </span>
                            <div className="mt-2 flex max-h-[480px] flex-col gap-3 overflow-y-auto">
                                {exploracaoResult.tabelas?.map((t, i) => (
                                    <div key={i} className="rounded-lg border border-border bg-muted p-3">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <Table aria-hidden className="size-3.5 text-muted-foreground" />
                                            <span className="font-mono text-xs font-bold">{t.tabela}</span>
                                            {t.total !== null && (
                                                <Pilula tom="sucesso">{`${t.total.toLocaleString('pt-BR')} registros`}</Pilula>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {t.colunas?.map((c, j) => (
                                                <span key={j} className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[10px]">
                                                    {`${c.coluna} · ${c.tipo}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>4. Script SQL - Criar usuário somente-leitura</CardTitle></CardHeader>
                <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">
                        Execute este script <strong>uma vez</strong> no banco do eSUS PEC como superusuário (postgres) antes de usar em produção.
                    </p>
                    <textarea
                        readOnly
                        aria-label="Script SQL de criação do usuário somente-leitura"
                        rows={8}
                        value={SQL_SETUP}
                        className="w-full resize-y rounded-lg border border-input bg-background p-3 font-mono text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                    />
                    <div className="mt-3">
                        <Button variant="outline" size="sm" onClick={copiarSQL}>
                            {sqlCopiado ? <Check /> : <Copy />}
                            {sqlCopiado ? 'Copiado!' : 'Copiar SQL'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
