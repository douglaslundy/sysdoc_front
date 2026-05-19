import { PieChart, Pie, Cell } from 'recharts';

const COR_CLASS = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };

export default function GaugeChart({ value = 0, classificacao = 'regular', size = 120 }) {
  const cor = COR_CLASS[classificacao] ?? '#888';
  // Gauge = meia-rosca. Angulo: 180° total. Valor ocupa proporção de value/100.
  const end = Math.round((value / 100) * 180);
  const bg  = [{ value: 180 }];
  const fg  = [{ value: end }, { value: 180 - end }];

  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 20, textAlign: 'center' }}>
      <PieChart width={size} height={size / 2 + 20}>
        {/* Fundo cinza */}
        <Pie data={bg} cx={size/2} cy={size/2} startAngle={180} endAngle={0}
          innerRadius={size*0.32} outerRadius={size*0.45} dataKey="value" stroke="none">
          <Cell fill="#e0e0e0" />
        </Pie>
        {/* Valor */}
        <Pie data={fg} cx={size/2} cy={size/2} startAngle={180} endAngle={0}
          innerRadius={size*0.32} outerRadius={size*0.45} dataKey="value" stroke="none">
          <Cell fill={cor} />
          <Cell fill="transparent" />
        </Pie>
      </PieChart>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        fontSize: size * 0.22, fontWeight: 700, color: cor,
      }}>
        {value}%
      </div>
    </div>
  );
}
