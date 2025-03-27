import * as React from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBrLocale from 'date-fns/locale/pt-BR';

export default function BasicDatePicker(props) {
  const { label, name, value, setValue, disabled = false, sx } = props;

  const parsedValue =
    value instanceof Date
      ? value
      : value
      ? new Date(`${value}T12:00:00`)
      : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBrLocale}>
      <DatePicker
        label={label}
        name={name}
        disabled={disabled}
        views={['year', 'month', 'day']}
        value={parsedValue}
        onChange={(newValue) => setValue(newValue)}
        renderInput={(params) => <TextField {...params} sx={sx} />}
      />
    </LocalizationProvider>
  );
}

