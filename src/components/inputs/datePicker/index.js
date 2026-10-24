import * as React from 'react';
import { Campo, Input } from '../../ui/campos';
import { useUid } from '../../../lib/useUid';

// Aceita Date, "AAAA-MM-DD", "AAAA-MM-DDTHH:mm..." e datas com barras; devolve "AAAA-MM-DD" para o <input type="date">.
const toInputValue = (value) => {
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
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// Mesmo contrato do seletor anterior: devolve um Date ao meio-dia (evita virar o dia pelo fuso) ou null.
const toDate = (text) => {
  if (!text) return null;
  const parsed = new Date(`${text}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function BasicDatePicker(props) {
  const { label, name, value, setValue, disabled = false, required = false, className } = props;
  const id = useUid('data');

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
          value={toInputValue(value)}
          onChange={(e) => setValue(toDate(e.target.value))}
        />
      )}
    </Campo>
  );
}
