import { useState } from 'react';
import GaugeChart from './GaugeChart';
import ClassificacaoBadge from './ClassificacaoBadge';
import ProgressIndicador from './ProgressIndicador';

export default function IndicadorCard({ indicador, onDetalhes }) {
  const [hover, setHover] = useState(false);
  if (!indicador) return null;
  const { id, nome, bloco, resultado, subindicadores } = indicador;
  const { percentual, classificacao, numerador, denominador, meta_suficiente, meta_bom, meta_otimo } = resultado ?? {};

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid #ddd', borderRadius: 8, padding: 16,
        background: hover ? '#f8f9ff' : '#fff',
        boxShadow: hover ? '0 2px 8px rgba(0,0,0,.1)' : '0 1px 3px rgba(0,0,0,.05)',
        transition: 'all .2s', cursor: 'pointer',
      }}
      onClick={() => onDetalhes?.(indicador)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>IND {id} · {bloco}</span>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#222', marginTop: 2 }}>{nome}</div>
        </div>
        <ClassificacaoBadge classificacao={classificacao} size="sm" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <GaugeChart value={percentual} classificacao={classificacao} size={100} />
      </div>

      <div style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 8 }}>
        {numerador} / {denominador}
      </div>

      <ProgressIndicador valor={percentual} metas={{ suficiente: meta_suficiente, bom: meta_bom, otimo: meta_otimo }} />

      {subindicadores?.length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8 }}>
          {subindicadores.slice(0, 3).map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: '#555', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>{s.nome}</span>
              <span style={{ fontWeight: 600 }}>{s.valor}/{s.total}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: '#1351B4', fontWeight: 600 }}>Ver detalhes →</span>
      </div>
    </div>
  );
}
