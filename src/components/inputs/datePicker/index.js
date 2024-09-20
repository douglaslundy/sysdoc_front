import * as React from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBrLocale from 'date-fns/locale/pt-BR';

export default function BasicDatePicker(props) {

    const { label, name, value, setValue, disabled = false, sx } = props;

    return (
        <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ptBrLocale}
        >
            <DatePicker
                label={label}
                name={name}
                disabled={disabled}
                views={['year', 'month', 'day']}
                value={value}
                onChange={(value) => { setValue(value) }}
                renderInput={(params) => <TextField {...params} sx={sx} />}
            />
        </LocalizationProvider>
    );
}
