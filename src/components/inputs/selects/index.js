import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import { useDispatch } from 'react-redux';

export default function BasicSelect(props) {
  
  const { label, store,  name, value, changeItem, getAllSelects, valueDefault, wd, disabled=false } = props;
  const dispatch = useDispatch();

   useEffect(() => {
    getAllSelects ? dispatch(getAllSelects()) : '';    
  }, []);

  return (
    <Box sx={{ minWidth: 120, width:wd }}>
      <FormControl fullWidth required>
        <InputLabel >{label}</InputLabel>
        <Select
          id={name}
          value={value}
          disabled={disabled}
          name={name}
          label={label}
          onChange={changeItem}
        >
          {valueDefault && <MenuItem key={0} value={0}>{valueDefault}</MenuItem> }

          {store.map((d) => (
             <MenuItem key={d.id} value={d.id}>{d.name.toUpperCase()}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}












// codigo abaixo refere se a um input autocomplete no modelo select cujo sera implementado posteriormente, 
// afim de configurar o selected ou defaultValue 



// import React, { useState, useEffect } from "react";
// import TextField from '@mui/material/TextField';
// import Autocomplete from '@mui/material/Autocomplete';
// import CircularProgress from '@mui/material/CircularProgress';

// import { useDispatch, useSelector } from 'react-redux';
// import { getAllCategoriesToSelect } from "../../../../store/fetchActions/categorie";

// function sleep(delay = 0) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, delay);
//   });
// }

// export default function index(props) {
//   const [open, setOpen] = useState(false);
//   const [options, setOptions] = useState([]);
//   const loading = open && options.length === 0;

//   const dispatch = useDispatch();
//   const { categories } = useSelector(state => state.categories);


//   useEffect(() => {
//     dispatch(getAllCategoriesToSelect());
//     let active = true;

//     if (!loading) {
//       return undefined;
//     }

//     (async () => {
//       await sleep(1e3); // For demo purposes.

//       if (active) {
//         setOptions([...categories]);
//       }
//     })();

//     return () => {
//       active = false;
//     };
//   }, [loading]);

//   useEffect(() => {
//     if (!open) {
//       setOptions([]);
//     }
//   }, [open]);

  
//   const { label,  name, value, changeItem } = props;

//   return (
//     <Autocomplete
//       id="category"
//       // sx={{ width: 300 }}
//       open={open}
//       onOpen={() => {
//         setOpen(true);
//       }}
//       onClose={() => {
//         setOpen(false);
//       }}
//       isOptionEqualToValue={(option, value) => option.id === value.id}
//       getOptionLabel={(option) => `${option.id} - ${option.name}`}
//       noOptionsText={"Categoria Indisponível"}
//       options={options}
//       loading={loading}
//       renderInput={(params) => (

//         <TextField
//           {...params}
//           id="category"
//           label={label}
//           name={name}
//           value={value}
//           onSelect={changeItem}

//           InputProps={{
//             ...params.InputProps,
//             endAdornment: (
//               <React.Fragment>
//                 {loading ? <CircularProgress color="inherit" size={20} /> : null}
//                 {params.InputProps.endAdornment}
//               </React.Fragment>
//             ),
//           }}
//         />

//       )}
//     />
//   );
// }
