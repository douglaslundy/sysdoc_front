import React, { useEffect, useMemo, useRef, useState } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { api } from "../../../services/api";

export default function index(props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [remoteClients, setRemoteClients] = useState([]);
  const searchRef = useRef(null);
  const { label, name, setClient, clients, wd, value } = props;
  const safeClients = Array.isArray(clients) ? clients : [];
  const options = remoteClients.length > 0 ? remoteClients : safeClients;

  const selectedClient = useMemo(
    () => options.find((cli) => Number(cli.id) === Number(value)) || null,
    [options, value]
  );

  useEffect(() => {
    setRemoteClients(safeClients);
  }, [safeClients]);

  useEffect(() => {
    if (!open) return undefined;

    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      api.get("/clients/select", {
        params: {
          search: inputValue || undefined,
          limit: 50,
        },
      })
        .then((res) => setRemoteClients(res.data || []))
        .catch(() => {});
    }, 350);

    return () => clearTimeout(searchRef.current);
  }, [inputValue, open]);

  return (
    <Autocomplete
      id="client"
      sx={{
        width: wd || "100%",
        "& .MuiInputBase-root": {
          width: "100%",
        },
        "& .MuiAutocomplete-inputRoot": {
          background: "transparent !important",
          boxShadow: "none !important",
        },
        "& .MuiInputBase-input": {
          background: "transparent !important",
          border: "none",
          boxShadow: "none",
        },
        "& .MuiAutocomplete-endAdornment": {
          background: "transparent",
        },
      }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, selected) => Number(option.id) === Number(selected.id)}
      getOptionLabel={(option) => `${(option.name || "").toUpperCase()} ${option.cns || ''} ${option.cpf || ''} ${option.phone || ''}`}
      noOptionsText={"Cliente inexistente!!!"}
      options={options}
      name={name}
      value={selectedClient}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      onChange={(_, newValue) => {
        setClient(newValue || {});
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
