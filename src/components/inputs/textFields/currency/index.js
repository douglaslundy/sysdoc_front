import React from 'react'
import MaskedInput from 'react-text-mask'
import createNumberMask from 'text-mask-addons/dist/createNumberMask'

import { TextField } from "@mui/material";

const defaultMaskOptions = {
  prefix: 'R$ ',
  suffix: '',
  includeThousandsSeparator: true,
  thousandsSeparatorSymbol: '.',
  allowDecimal: true,
  decimalSymbol: ',',
  decimalLimit: 2, // how many digits allowed after the decimal
//   integerLimit: 9, // limit length of integer numbers
  allowNegative: false,
  allowLeadingZeroes: false,
}

const Currency = React.forwardRef((props, ref) => {

  const { ...styles } = props;

  const currencyMask = createNumberMask({
    ...defaultMaskOptions,
  })

  return <MaskedInput mask={currencyMask} {...styles} />

});



export default function index(props) {

    const { label, name, value, changeItem, wd, disabled } = props;
    return (
        <TextField
            id="currency"
            label={label}
            variant="outlined"
            name={name}
            value={value ? value : ''}
            onChange={changeItem}
            sx={{ width: wd }}
            required
            disabled={disabled ? disabled : false}

            InputProps={{
                inputComponent: Currency,
            }}

        />
    )
}