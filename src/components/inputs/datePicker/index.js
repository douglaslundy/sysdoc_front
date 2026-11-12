import * as React from 'react';
import { Campo, Input } from '../../ui/campos';
import { useUid } from '../../../lib/useUid';

const pad = (n) => String(n).padStart(2, '0');

// Aceita Date, "AAAA-MM-DD", "AAAA-MM-DDTHH:mm..." e datas com barras; devolve "AAAA-MM-DD" para o <input type="date">.
export const toInputValue = (value) => {
  if (!value) return '';
  let date;
  if (value instanceof Date) {
    date = value;
  } else {
    const valueString = String(value).trim();
    if (!valueString) return '';
    const datePart = valueString.includes('T') ? valueString.split('T')[0] : valueString.split(' ')[0];
    date = new Date(`${datePart.replace(/\//g, '-')}T12:00:00`);
  }
  if (Number.isNaN(date.getTime())) return '';
  // O ano precisa ter 4 dígitos: "2-05-10" não é um valor válido e o campo apagava tudo.
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// Mesmo contrato do seletor anterior: devolve um Date ao meio-dia (evita virar o dia pelo fuso) ou null.
export const toDate = (text) => {
  if (!text) return null;
  const parsed = new Date(`${text}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Digitando o ano o navegador já devolve datas completas com ano 0002, 0020, 0202...
// Só publicamos para o formulário quando o ano está completo.
const ANO_MINIMO = 1900;
const anoDe = (text) => Number(String(text).split('-')[0]);

export default function BasicDatePicker(props) {
  const { label, name, value, setValue, disabled = false, required = false, className } = props;
  const id = useUid('data');
  const externo = toInputValue(value);
  const [texto, setTexto] = React.useState(externo);
  const ultimoPublicado = React.useRef(externo);

  // Mudança vinda de fora (limpar após gravar, carregar registro): acompanha o formulário.
  // A digitação em andamento (ano incompleto) não passa por aqui, pois o valor externo não muda.
  React.useEffect(() => {
    if (externo !== ultimoPublicado.current) {
      ultimoPublicado.current = externo;
      setTexto(externo);
    }
  }, [externo]);

  const aoMudar = (e) => {
    const novo = e.target.value;
    setTexto(novo);
    if (!novo) {
      ultimoPublicado.current = '';
      setValue(null);
      return;
    }
    if (anoDe(novo) < ANO_MINIMO) return;
    const data = toDate(novo);
    if (!data) return;
    ultimoPublicado.current = novo;
    setValue(data);
  };

  // Só o clique na área do ícone (extremo direito) abre o calendário; no restante do campo o usuário digita a data.
  const abrirCalendario = (e) => {
    if (disabled || e.target.readOnly) return;
    const larguraIcone = 40;
    if (e.nativeEvent.offsetX < e.target.clientWidth - larguraIcone) return;
    try {
      e.target.showPicker?.();
    } catch {
      // showPicker pode recusar (sem gesto do usuário, iframe): o ícone nativo continua funcionando.
    }
  };

  return (
    <Campo id={id} label={label} obrigatorio={required}>
      {(p) => (
        <Input
          {...p}
          type="date"
          name={name}
          disabled={disabled}
          required={required}
          className={className}
          min="1900-01-01"
          max="2100-12-31"
          value={texto}
          onClick={abrirCalendario}
          onChange={aoMudar}
        />
      )}
    </Campo>
  );
}
