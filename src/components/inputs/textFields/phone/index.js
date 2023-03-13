import React from 'react';
import { TextField } from "@mui/material";
import InputMask from 'react-input-mask';

const PhoneMask = React.forwardRef((props, ref) => {
    const { inputRef, ...styles } = props;
    return (
        <InputMask 
        {...styles}
        ref={inputRef}
        mask="(99) 99999-9999" maskChar={null} />
    );
});

export default function index(props) {

    const { label,  name, value, changeItem } = props;
    return (
        <TextField
            id="phone"
            label={label}
            variant="outlined"
            name={name}
            value={value ? value : ''}
            onChange={changeItem}

            InputProps={{
                inputComponent: PhoneMask,
            }}

        />
    )
}