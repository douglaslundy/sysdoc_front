import React, { useMemo, useState } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

export default function index(props) {
  const [open, setOpen] = useState(false);
  const { label, name, setClient, clients, wd, value } = props;
  const safeClients = Array.isArray(clients) ? clients : [];

  const selectedClient = useMemo(
    () => safeClients.find((cli) => Number(cli.id) === Number(value)) || null,
    [safeClients, value]
  );

  return (
    <Autocomplete
      id="client"
      sx={wd ? { width: wd } : { width: "85%" }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, selected) => Number(option.id) === Number(selected.id)}
      getOptionLabel={(option) => `${(option.name || "").toUpperCase()} ${option.cns || ''} ${option.cpf || ''} ${option.phone || ''}`}
      noOptionsText={"Cliente inexistente!!!"}
      options={safeClients}
      name={name}
      value={selectedClient}
      onChange={(_, newValue) => {
        const picked = safeClients.find((cli) => Number(cli.id) === Number(newValue?.id));
        setClient(picked || {});
        setOpen(false);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{ ...params.InputProps }}
        />
      )}
    />
  );
}
