import React, { useState } from "react";
import CpfCnpj from "@react-br-forms/cpf-cnpj-mask";
import { TextField } from "@mui/material";

const CpfCnpjInput = React.forwardRef((props, ref) => {
    const { inputRef, ...styles } = props;

    return (
        <CpfCnpj
            {...styles}
        />
    );
});

export default function index(props) {

    const { label, name, value, changeItem } = props;
    return (
        <TextField
            id="phone"
            label={label}
            variant="outlined"
            name={name}
            value={value ? value : ''}
            onChange={changeItem}

            InputProps={{
                inputComponent: CpfCnpjInput,
            }}

        />
    )
}