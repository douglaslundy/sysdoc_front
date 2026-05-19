import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { monitorApsApi } from '../services/monitorApsApi';
import ClassificacaoBadge from '../components/ClassificacaoBadge';
import AlertaBloqueio from '../components/AlertaBloqueio';

const COR_CLASS = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };

export default function Dashboard() {
  const [ano, setAno]   = useState(2025);
  const [quad, setQuad] = useState(2);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setLoading(true); setErro(null);
    monitorApsApi.getResumo(ano, quad)
      .then(setData)
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [ano, quad]);

  const totalRepasse = data?.repasse?.reduce((s, e) => s + e.total_estimado, 0) ?? 0;

  // Contagem de classificações dos indicadores
  const indicadores = [
    ...(data?.qualidade?.esf ?? []),
    ...(data?.qualidade?.esb ?? []),
  ];
  const contagem = { otimo: 0, bom: 0, suficiente: 0, regular: 0 };
  indicadores.forEach(i => { const c = i.indicador?.resultado?.classificacao; if (c) contagem[c]++; });
  const pieData = Object.entries(contagem).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));

  // Equipes com alertas (classificação regular)
  const alertas = data?.vinculos?.filter(v => v.classificacao === 'regular') ?? [];

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 1200 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: '#1351B4' }}>Monitor APS — Cofinanciamento Federal</h1>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
            {data?.municipio || 'Município'} · {quad}° Quad. {ano}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={selectStyle}>
            {[2023,2024,2025].map(a => <option key={a}>{a}</option>)}
          </select>
          <select value={quad} onChange={e => setQuad(Number(e.target.value))} style={selectStyle}>
            <option value={1}>1° Quadrimestre</option>
            <option value={2}>2° Quadrimestre</option>
            <option value={3}>3° Quadrimestre</option>
          </select>
        </div>
      </div>

      {erro && <div style={{ background:'#fff0f0', border:'1px solid #E52207', borderRadius:6, padding:12, color:'#E52207', marginBottom:16 }}>Erro: {erro}</div>}
      {loading && <div style={{ textAlign:'center', color:'#888', padding:40 }}>Carregando...</div>}

      {!loading && data && (
        <>
          {/* Cards de resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <ScoreCard titulo="Repasse Estimado" valor={`R$ ${totalRepasse.toLocaleString('pt-BR')}`} sub="/mês (estimado)" cor="#168821" />
            <ScoreCard titulo="Equipes Monitoradas" valor={data.total_equipes} sub={`${data.vinculos?.length ?? 0} eSF/eAP ativas`} cor="#1351B4" />
            <ScoreCard titulo="Alertas de Risco" valor={alertas.length} sub="equipes em regular/suspensão" cor={alertas.length > 0 ? '#E52207' : '#168821'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
            {/* Mapa de calor de indicadores */}
            <div style={cardStyle}>
              <h3 style={h3Style}>Indicadores por Equipe</h3>
              <HeatmapTable vinculos={data.vinculos} indicadores={indicadores} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Donut */}
              <div style={cardStyle}>
                <h3 style={h3Style}>Distribuição de Classificações</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({name,value}) => `${name}: ${value}`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={COR_CLASS[entry.name]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Alertas */}
              {alertas.length > 0 && (
                <div style={cardStyle}>
                  <h3 style={h3Style}>Alertas</h3>
                  {alertas.map((a, i) => (
                    <AlertaBloqueio key={i} equipe={a.nome} motivo="Vínculo territorial em classificação Regular" tipo="proporcional" />
                  ))}
                </div>
              )}

              {/* Repasse por equipe */}
              <div style={cardStyle}>
                <h3 style={h3Style}>Repasse por Equipe</h3>
                {data.repasse?.map((r, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f0f0f0', fontSize:13 }}>
                    <span>{r.nome}</span>
                    <span style={{ fontWeight:700 }}>R$ {r.total_estimado.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScoreCard({ titulo, valor, sub, cor }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${cor}` }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: cor }}>{valor}</div>
      <div style={{ fontSize: 12, color: '#555' }}>{sub}</div>
    </div>
  );
}

function HeatmapTable({ vinculos = [], indicadores = [] }) {
  const equipes = vinculos.map(v => v.ine);
  const indsPorId = {};
  indicadores.forEach(i => {
    const id  = i.indicador?.id;
    const ine = i.indicador?.equipe?.ine;
    if (!indsPorId[id]) indsPorId[id] = {};
    indsPorId[id][ine] = i.indicador?.resultado;
  });
  const ids = Object.keys(indsPorId).map(Number).sort((a,b) => a-b);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ background:'#f5f5f5' }}>
            <th style={th}>IND</th>
            {equipes.map(ine => <th key={ine} style={th}>{ine.slice(-4)}</th>)}
          </tr>
        </thead>
        <tbody>
          {ids.map(id => (
            <tr key={id}>
              <td style={td}>{id}</td>
              {equipes.map(ine => {
                const r = indsPorId[id]?.[ine];
                const cor = COR_CLASS[r?.classificacao] ?? '#ccc';
                return <td key={ine} style={{ ...td, background: cor + '22', color: cor, fontWeight:700, textAlign:'center' }}>
                  {r ? `${r.percentual}%` : '—'}
                </td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cardStyle  = { background:'#fff', border:'1px solid #e0e0e0', borderRadius:8, padding:16 };
const h3Style    = { margin:'0 0 12px', fontSize:14, color:'#333' };
const selectStyle = { border:'1px solid #ccc', borderRadius:4, padding:'4px 8px', fontSize:13 };
const th = { padding:'6px 10px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #ddd' };
const td = { padding:'5px 10px', borderBottom:'1px solid #f0f0f0' };
