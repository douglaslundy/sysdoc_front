import * as React from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBrLocale from 'date-fns/locale/pt-BR';

const parsePickerValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const valueString = String(value).trim();
  if (!valueString) return null;

  const datePart = valueString.includes('T')
    ? valueString.split('T')[0]
    : valueString.split(' ')[0];
  const normalizedDate = datePart.replace(/\//g, '-');
  const parsed = new Date(`${normalizedDate}T12:00:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function BasicDatePicker(props) {
  const { label, name, value, setValue, disabled = false, sx, className = "lg-search-field" } = props;

  const parsedValue = parsePickerValue(value);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBrLocale}>
      <DatePicker
        label={label}
        name={name}
        disabled={disabled}
        views={['year', 'month', 'day']}
        value={parsedValue}
        onChange={(newValue) => setValue(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            className={className}
            size="medium"
            sx={{
              minWidth: 180,
              "& .MuiInputBase-input": {
                paddingLeft: "12px",
                paddingTop: "11px",
                paddingBottom: "11px",
              },
              ...sx,
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
}
