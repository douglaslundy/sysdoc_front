import { useEffect, useState } from 'react';
import { monitorApsApi } from '../services/monitorApsApi';
import IndicadorCard from '../components/IndicadorCard';

export default function IndicadoresQualidade() {
  const [ano, setAno]     = useState(2025);
  const [quad, setQuad]   = useState(2);
  const [ine, setIne]     = useState('');
  const [bloco, setBloco] = useState('');
  const [equipes, setEquipes] = useState([]);
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    monitorApsApi.getEquipes().then(d => setEquipes(d.equipes ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    monitorApsApi.getQualidade(ano, quad, ine || null, bloco || null)
      .then(d => setData(d.indicadores ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [ano, quad, ine, bloco]);

  const agrupado = {};
  data.forEach(i => {
    const id = i.indicador?.id;
    if (!agrupado[id]) agrupado[id] = i;
  });
  const lista = Object.values(agrupado).sort((a, b) => a.indicador.id - b.indicador.id);

  return (
    <div style={{ padding:24, fontFamily:'sans-serif', maxWidth:1200 }}>
      <h1 style={{ margin:'0 0 16px', fontSize:20, color:'#1351B4' }}>Indicadores de Qualidade</h1>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {[
          <select key="ano" value={ano} onChange={e => setAno(Number(e.target.value))} style={sel}>
            {[2023,2024,2025].map(a => <option key={a}>{a}</option>)}
          </select>,
          <select key="quad" value={quad} onChange={e => setQuad(Number(e.target.value))} style={sel}>
            {[1,2,3].map(q => <option key={q} value={q}>{q}° Quad.</option>)}
          </select>,
          <select key="ine" value={ine} onChange={e => setIne(e.target.value)} style={sel}>
            <option value="">Todas as equipes</option>
            {equipes.map(eq => <option key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</option>)}
          </select>,
          <select key="bloco" value={bloco} onChange={e => setBloco(e.target.value)} style={sel}>
            <option value="">Todos os blocos</option>
            <option value="esf">eSF / eAP</option>
            <option value="esb">eSB</option>
          </select>,
        ]}
      </div>

      {loading && <div style={{ textAlign:'center', color:'#888', padding:40 }}>Carregando indicadores...</div>}

      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {lista.map(i => (
            <IndicadorCard key={i.indicador.id} indicador={i.indicador} onDetalhes={setDetalhe} />
          ))}
          {lista.length === 0 && <p style={{ color:'#888' }}>Nenhum indicador encontrado para os filtros selecionados.</p>}
        </div>
      )}

      {/* Modal de detalhes */}
      {detalhe && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={() => setDetalhe(null)}>
          <div style={{ background:'#fff', borderRadius:8, padding:24, maxWidth:600, width:'90%', maxHeight:'80vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <h2 style={{ margin:0, fontSize:16 }}>IND {detalhe.id} — {detalhe.nome}</h2>
              <button onClick={() => setDetalhe(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr style={{ background:'#f5f5f5' }}>
                <th style={th}>Subindicador</th><th style={th}>Valor</th><th style={th}>Total</th>
              </tr></thead>
              <tbody>
                {detalhe.subindicadores?.map((s, i) => (
                  <tr key={i}><td style={td}>{s.nome}</td><td style={td}>{s.valor}</td><td style={td}>{s.total}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:12, fontSize:12, color:'#888' }}>
              Fonte: Fichas Técnicas MS — Portaria GM/MS nº 6.907/2025
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sel = { border:'1px solid #ccc', borderRadius:4, padding:'5px 10px', fontSize:13 };
const th  = { padding:'8px 10px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #ddd' };
const td  = { padding:'7px 10px', borderBottom:'1px solid #f0f0f0' };
