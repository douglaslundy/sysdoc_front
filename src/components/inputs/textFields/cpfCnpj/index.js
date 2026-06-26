import React from "react";
import InputMask from "react-input-mask";
import { TextField } from "@mui/material";

const resolveMask = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length > 11 ? "99.999.999/9999-99" : "999.999.999-99";
};

const CpfCnpjInput = React.forwardRef((props, ref) => {
    const { inputRef, value, ...styles } = props;

    return (
        <InputMask
            {...styles}
            value={value || ""}
            ref={inputRef || ref}
            mask={resolveMask(value)}
            maskChar={null}
        />
    );
});

export default function index(props) {

    const { label, name, value, changeItem, disabled = false, sx, fullWidth = false } = props;
    return (
        <TextField
            id="cpfCnpj"
            label={label}
            variant="outlined"
            name={name}
            sx={sx}
            fullWidth={fullWidth}
            value={value ? value : ''}
            onChange={changeItem}            
            disabled={disabled}
            InputProps={{
                inputComponent: CpfCnpjInput,
            }}

        />
    )
}
