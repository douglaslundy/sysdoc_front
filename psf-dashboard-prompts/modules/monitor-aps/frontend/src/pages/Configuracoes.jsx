import { useEffect, useState } from 'react';
import { monitorApsApi } from '../services/monitorApsApi';

const SQL_SETUP = `-- Monitor APS: usuário somente-leitura
CREATE ROLE monitor_aps_reader;
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitor_aps_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO monitor_aps_reader;
CREATE USER monitor_aps WITH PASSWORD 'SenhaSegura123!';
GRANT monitor_aps_reader TO monitor_aps;`;

export default function Configuracoes() {
  const [config, setConfig] = useState({ host:'localhost', port:5432, database:'esus', user:'monitor_aps', password:'' });
  const [status, setStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [sqlCopiado, setSqlCopiado] = useState(false);
  const [equipes, setEquipes] = useState([]);
  const [municipio, setMunicipio] = useState({ ibge:'3131703', nome:'Ilicínea', estrato:4 });

  useEffect(() => {
    monitorApsApi.getStatus().then(setStatus).catch(() => {});
    monitorApsApi.getEquipes().then(d => setEquipes(d.equipes ?? [])).catch(() => {});
  }, []);

  async function testar() {
    setTestando(true); setTestResult(null);
    try {
      const r = await monitorApsApi.testConnection(config);
      setTestResult(r);
      if (r.success) monitorApsApi.getEquipes().then(d => setEquipes(d.equipes ?? [])).catch(() => {});
    } catch(e) {
      setTestResult({ success:false, error: e.message });
    } finally { setTestando(false); }
  }

  async function salvar() {
    setSalvando(true);
    try {
      await monitorApsApi.saveConfig(config);
      const s = await monitorApsApi.getStatus();
      setStatus(s);
      alert('Configuração salva com sucesso!');
    } catch(e) { alert('Erro ao salvar: ' + e.message); }
    finally { setSalvando(false); }
  }

  function copiarSQL() {
    navigator.clipboard.writeText(SQL_SETUP).then(() => { setSqlCopiado(true); setTimeout(() => setSqlCopiado(false), 2000); });
  }

  const statusCor = status?.connected ? '#168821' : status?.configured ? '#FF8C00' : '#888';
  const statusTxt = status?.connected ? '🟢 Conectado' : status?.configured ? '🟡 Desconectado' : '⚪ Não configurado';

  return (
    <div style={{ padding:24, fontFamily:'sans-serif', maxWidth:800 }}>
      <h1 style={{ margin:'0 0 20px', fontSize:20, color:'#1351B4' }}>Configurações do Monitor APS</h1>

      {/* Status */}
      <div style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:8, padding:14, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:14, fontWeight:700, color:statusCor }}>{statusTxt}</span>
        {status?.database && <span style={{ fontSize:12, color:'#888' }}>— {status.host} / {status.database}</span>}
      </div>

      {/* Seção 1: Conexão */}
      <Section titulo="1. Conexão com o Banco de Dados">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { label:'Host / IP', key:'host' },
            { label:'Porta', key:'port', type:'number' },
            { label:'Nome do banco', key:'database' },
            { label:'Usuário', key:'user' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input type={type || 'text'} value={config[key]} onChange={e => setConfig({ ...config, [key]: e.target.value })} style={inputStyle} />
            </div>
          ))}
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelStyle}>Senha</label>
            <input type="password" value={config.password} onChange={e => setConfig({ ...config, password: e.target.value })} style={inputStyle} />
          </div>
        </div>
        {testResult && (
          <div style={{ marginTop:12, padding:10, borderRadius:6, background: testResult.success ? '#f0fff4' : '#fff0f0',
            border:`1px solid ${testResult.success ? '#168821' : '#E52207'}`, fontSize:13 }}>
            {testResult.success
              ? `✅ Conectado — ${testResult.database} (PostgreSQL ${testResult.version?.split(' ')[1] ?? ''})`
              : `❌ Erro: ${testResult.error}`}
          </div>
        )}
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button onClick={testar} disabled={testando} style={btnPrimary}>{testando ? 'Testando...' : 'Testar Conexão'}</button>
          <button onClick={salvar} disabled={salvando} style={btnSecondary}>{salvando ? 'Salvando...' : 'Salvar Configuração'}</button>
        </div>
      </Section>

      {/* Seção 2: Município */}
      <Section titulo="2. Configurações do Município">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <div>
            <label style={labelStyle}>IBGE</label>
            <input value={municipio.ibge} onChange={e => setMunicipio({ ...municipio, ibge: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Nome</label>
            <input value={municipio.nome} onChange={e => setMunicipio({ ...municipio, nome: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Estrato IED (1-4)</label>
            <select value={municipio.estrato} onChange={e => setMunicipio({ ...municipio, estrato: Number(e.target.value) })} style={{ ...inputStyle, height:36 }}>
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        {equipes.length > 0 && (
          <div style={{ marginTop:14 }}>
            <label style={labelStyle}>Equipes ativas no banco ({equipes.length})</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
              {equipes.map(eq => (
                <span key={eq.nu_ine} style={{ background:'#e8f0fe', color:'#1351B4', borderRadius:4, padding:'3px 8px', fontSize:12 }}>
                  {eq.no_equipe} ({eq.tipo})
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Seção 3: SQL de setup */}
      <Section titulo="4. Script SQL — Criar usuário somente-leitura">
        <p style={{ fontSize:13, color:'#555', margin:'0 0 10px' }}>
          Execute este script <strong>uma vez</strong> no banco do eSUS PEC como superusuário (postgres) antes de usar o módulo em produção.
        </p>
        <textarea readOnly value={SQL_SETUP} rows={10}
          style={{ width:'100%', fontFamily:'monospace', fontSize:12, padding:10, borderRadius:4, border:'1px solid #ccc', resize:'vertical', boxSizing:'border-box' }} />
        <button onClick={copiarSQL} style={{ ...btnSecondary, marginTop:8 }}>
          {sqlCopiado ? '✅ Copiado!' : 'Copiar SQL'}
        </button>
      </Section>
    </div>
  );
}

const Section = ({ titulo, children }) => (
  <div style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:8, padding:20, marginBottom:20 }}>
    <h3 style={{ margin:'0 0 16px', fontSize:14, color:'#1351B4', borderBottom:'1px solid #e8f0fe', paddingBottom:8 }}>{titulo}</h3>
    {children}
  </div>
);

const labelStyle = { display:'block', fontSize:12, color:'#555', marginBottom:4, fontWeight:600 };
const inputStyle = { width:'100%', border:'1px solid #ccc', borderRadius:4, padding:'7px 10px', fontSize:13, boxSizing:'border-box' };
const btnPrimary   = { padding:'8px 18px', background:'#1351B4', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:13, fontWeight:600 };
const btnSecondary = { padding:'8px 18px', background:'#fff', color:'#1351B4', border:'1px solid #1351B4', borderRadius:4, cursor:'pointer', fontSize:13, fontWeight:600 };
