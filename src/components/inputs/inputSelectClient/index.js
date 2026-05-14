import React, { useMemo, useState } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

export default function index(props) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { label, name, setClient, clients, wd, value } = props;
  const safeClients = Array.isArray(clients) ? clients : [];

  const selectedClient = useMemo(
    () => safeClients.find((cli) => Number(cli.id) === Number(value)) || null,
    [safeClients, value]
  );

  const filteredOptions = useMemo(() => {
    const query = (searchText || "").trim().toLowerCase();
    if (!query) return safeClients;

    return safeClients.filter((cli) =>
      `${cli.name || ""} ${cli.cns || ""} ${cli.cpf || ""} ${cli.phone || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [safeClients, searchText]);

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
      options={filteredOptions}
      name={name}
      value={selectedClient}
      inputValue={searchText}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'reset') return;
        setSearchText(newInputValue);
      }}
      onChange={(_, newValue) => {
        const picked = safeClients.find((cli) => Number(cli.id) === Number(newValue?.id));
        setClient(picked || {});
        setSearchText('');
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
