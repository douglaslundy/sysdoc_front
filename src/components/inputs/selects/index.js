import React, { useEffect } from "react";
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useDispatch } from 'react-redux';

export default function BasicSelect(props) {
  const { label, store, name, value, changeItem, getAllSelects, valueDefault, wd, disabled = false } = props;
  const dispatch = useDispatch();

  useEffect(() => {
    getAllSelects ? dispatch(getAllSelects()) : '';
  }, [dispatch, getAllSelects]);

  // Ordenando o array store em ordem crescente pelo nome
  const sortedStore = [...store].sort((a, b) => a.name.toString().localeCompare(b.name.toString()));

  return (
    <Box sx={{ minWidth: 120, width: wd }}>
      <FormControl fullWidth required>
        <InputLabel>{label}</InputLabel>
        <Select
          id={name}
          value={value}
          disabled={disabled}
          name={name}
          label={label}
          onChange={changeItem}
        >
          {valueDefault && <MenuItem key={0} value={0}>{valueDefault}</MenuItem>}

          {sortedStore.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name.toString().toUpperCase()}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
