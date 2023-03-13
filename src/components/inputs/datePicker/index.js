import * as React from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBrLocale from 'date-fns/locale/pt-BR';

export default function BasicDatePicker() {
    const [value, setValue] = React.useState(null);

    return (
        <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ptBrLocale}
        >
            <DatePicker
                label="Data"
                views={['year', 'month', 'day']}
                value={value}
                onChange={(newValue) => {
                    setValue(newValue);
                }}
                renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>
    );
}
