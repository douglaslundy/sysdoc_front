import { useEffect, useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { monitorApsApi } from '../services/monitorApsApi';
import ClassificacaoBadge from '../components/ClassificacaoBadge';

export default function PorEquipe() {
  const [ano, setAno]       = useState(2025);
  const [quad, setQuad]     = useState(2);
  const [equipes, setEquipes] = useState([]);
  const [ine, setIne]       = useState('');
  const [vinculo, setVinculo] = useState(null);
  const [indicadores, setIndicadores] = useState([]);
  const [repasse, setRepasse] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    monitorApsApi.getEquipes().then(d => {
      const eq = d.equipes ?? [];
      setEquipes(eq);
      if (eq.length > 0) setIne(eq[0].nu_ine);
    });
  }, []);

  useEffect(() => {
    if (!ine) return;
    setLoading(true);
    Promise.all([
      monitorApsApi.getVinculo(ano, quad, ine),
      monitorApsApi.getQualidade(ano, quad, ine),
      monitorApsApi.getRepasse(ano, quad),
      monitorApsApi.getHistorico(ine, 8, '2025'), // Indicador 8 como exemplo
    ]).then(([v, q, r, h]) => {
      setVinculo(v.equipes?.[0] ?? null);
      setIndicadores(q.indicadores ?? []);
      setRepasse(r.repasse?.find(x => x.ine === ine) ?? null);
      setHistorico(h.historico ?? []);
    }).finally(() => setLoading(false));
  }, [ine, ano, quad]);

  const radarData = indicadores.map(i => ({
    indicador: `IND ${i.indicador?.id}`,
    valor:     i.indicador?.resultado?.percentual ?? 0,
    meta:      i.indicador?.resultado?.meta_bom   ?? 60,
  }));

  const classQ = indicadores.length > 0
    ? ['regular','suficiente','bom','otimo'][Math.round(
        indicadores.reduce((s,i) => s + (['regular','suficiente','bom','otimo'].indexOf(i.indicador?.resultado?.classificacao ?? 'regular')), 0)
        / indicadores.length
      )]
    : 'regular';

  return (
    <div style={{ padding:24, fontFamily:'sans-serif', maxWidth:1100 }}>
      <h1 style={{ margin:'0 0 16px', fontSize:20, color:'#1351B4' }}>Desempenho por Equipe</h1>

      {/* Seletor */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <select value={ine} onChange={e => setIne(e.target.value)} style={sel}>
          {equipes.map(eq => <option key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</option>)}
        </select>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} style={sel}>
          {[2023,2024,2025].map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={quad} onChange={e => setQuad(Number(e.target.value))} style={sel}>
          {[1,2,3].map(q => <option key={q} value={q}>{q}° Quad.</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign:'center', color:'#888', padding:40 }}>Carregando...</div>}

      {!loading && (
        <>
          {/* Cards de classificação */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
            <ClassCard titulo="Vínculo Territorial" classificacao={vinculo?.classificacao} repasse={repasse?.componente_vinculo} />
            <ClassCard titulo="Qualidade" classificacao={classQ} repasse={repasse?.componente_qualidade} />
            <div style={cardStyle}>
              <div style={{ fontSize:12, color:'#888' }}>Repasse Estimado</div>
              <div style={{ fontSize:28, fontWeight:700, color:'#168821' }}>
                R$ {(repasse?.total_estimado ?? 0).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize:12, color:'#555' }}>/mês</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Radar */}
            <div style={cardStyle}>
              <h3 style={h3Style}>Radar dos Indicadores</h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 11 }} />
                    <Radar name="Valor" dataKey="valor" stroke="#1351B4" fill="#1351B4" fillOpacity={0.3} />
                    <Radar name="Meta Bom" dataKey="meta" stroke="#168821" fill="transparent" strokeDasharray="5 5" />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <p style={{ color:'#888', fontSize:13 }}>Sem dados de indicadores para esta equipe.</p>}
            </div>

            {/* Histórico */}
            <div style={cardStyle}>
              <h3 style={h3Style}>Histórico — Indicador 8 (Visita ACS)</h3>
              {historico.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historico}>
                    <XAxis dataKey="quadrimestre" tickFormatter={q => `${q}°Q`} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Line type="monotone" dataKey="percentual" stroke="#1351B4" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p style={{ color:'#888', fontSize:13 }}>Histórico sem dados disponíveis.</p>}
            </div>
          </div>

          {/* Tabela de indicadores */}
          <div style={{ ...cardStyle, marginTop:16 }}>
            <h3 style={h3Style}>Todos os Indicadores</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr style={{ background:'#f5f5f5' }}>
                {['IND','Nome','Numerador','Denominador','%','Classificação'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {indicadores.map(i => {
                  const r = i.indicador?.resultado ?? {};
                  return (
                    <tr key={i.indicador?.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                      <td style={td}>{i.indicador?.id}</td>
                      <td style={td}>{i.indicador?.nome}</td>
                      <td style={td}>{r.numerador}</td>
                      <td style={td}>{r.denominador}</td>
                      <td style={td}>{r.percentual}%</td>
                      <td style={td}><ClassificacaoBadge classificacao={r.classificacao} size="sm" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const ClassCard = ({ titulo, classificacao, repasse }) => (
  <div style={cardStyle}>
    <div style={{ fontSize:12, color:'#888' }}>{titulo}</div>
    <div style={{ margin:'8px 0' }}><ClassificacaoBadge classificacao={classificacao} /></div>
    {repasse !== undefined && <div style={{ fontSize:12, color:'#555' }}>+ R$ {(repasse??0).toLocaleString('pt-BR')}/mês</div>}
  </div>
);

const cardStyle = { background:'#fff', border:'1px solid #e0e0e0', borderRadius:8, padding:16 };
const h3Style   = { margin:'0 0 12px', fontSize:14, color:'#333' };
const sel       = { border:'1px solid #ccc', borderRadius:4, padding:'5px 10px', fontSize:13 };
const th = { padding:'8px 10px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #ddd' };
const td = { padding:'7px 10px' };
