import React, { useState, useEffect } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

function sleep(delay = 0) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

export default function index(props) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const loading = open && options.length === 0;
    const { label, name, setData, data, wd, state } = props;

    useEffect(() => {
        let active = true;

        // treço teste afim de solucionar o bug que da quando e selecionado o mesmo valor no select que foi selecionado a ultima vez
        setData({})

        if (!loading) {
            return undefined;
        }

        (async () => {
            await sleep(1e3);

            if (active) {
                setOptions([...data]);
            }
        })();

        return () => {
            active = false;
        };

    }, [loading]);

    useEffect(() => {
        if (!open) {
            setOptions([]);
        }
    }, [open]);

    // const [selectedId, setSelectedId] = useState(0);

    const getData = (id) => {
        // setSelectedId(id);
        // setData(data.filter((dt) => dt.id == selectedId)[0]);
        setData(data.filter((dt) => dt.id == id)[0]);
    }

    return (
        state != false && 
        <Autocomplete
            id="data"
            // sx={{ width: "85%" }}
            sx={wd ? { width: wd } : { width: "100%" }}
            open={open}
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => `${option.name} - ${option.cpf}`}

            noOptionsText={"Dado inexistente!"}
            options={options}
            loading={loading}
            // onSelect={getData}
            // onChange={(_, newValue) => { setSelectedId(newValue?.id) }}
            onChange={(_, newValue) => { getData(newValue?.id) }}
            name={name}

            renderInput={(params) => (

                <TextField
                    {...params}
                    label={label}

                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />

            )}
        />
    );
}