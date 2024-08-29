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

  useEffect(() => {
    let active = true;

    if (!loading) {
      return undefined;
    }

    (async () => {
      await sleep(1e3);

      if (active) {
        setOptions([...clients]);
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

  const { label, name, setClient, clients, wd } = props;
  const [selectedId, setSelectedId] = useState(0);

  // const getClient = () => {
  //   setClient(clients.filter((cli) => cli.id == selectedId)[0]);
  // } 

  return (
    <Autocomplete
      id="client"
      // sx={{ width: "85%" }}
      sx={wd ? { width: wd } : { width: "85%" }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      // getOptionLabel={(option) => `${option.full_name} - Código: ${option.id}`}
      getOptionLabel={(option) => `${option.name} - ${option.cns ? option.cns : 'SEM CNS'} - ${option.cpf ? option.cpf : 'SEM CPF'}  - ${option.phone ? option.phone : 'SEM TELEFONE'}`}
      noOptionsText={"Cliente inexistente!!!"}
      options={options}
      loading={loading}
      name={name}
      // onChange={(_, newValue) => { setSelectedId(newValue?.id) }}
      onChange={(_, newValue) => { setClient(clients.filter((cli) => cli.id == newValue?.id)[0]) }}

      renderInput={(params) => (

        <TextField
          {...params}
          label={label}
          onChange={(_, value) => { setOptions([...clients.filter((cli) => cli.name == value)]) }}
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