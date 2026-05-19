const COR = {
  otimo:     { bg: '#168821', label: 'Ótimo' },
  bom:       { bg: '#1351B4', label: 'Bom' },
  suficiente:{ bg: '#FF8C00', label: 'Suficiente' },
  regular:   { bg: '#E52207', label: 'Regular' },
  sem_dados: { bg: '#888',    label: 'Sem dados' },
};

export default function ClassificacaoBadge({ classificacao, size = 'md' }) {
  const { bg, label } = COR[classificacao] ?? COR.sem_dados;
  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs  = size === 'sm' ? 11 : 13;
  return (
    <span style={{
      background: bg, color: '#fff', borderRadius: 4,
      padding: pad, fontSize: fs, fontWeight: 700,
      display: 'inline-block', textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {label}
    </span>
  );
}
