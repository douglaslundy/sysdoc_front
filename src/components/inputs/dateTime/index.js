import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";

export default function DateTime(props) {
    const { id, label, name, onChange, wd, value: externalValue } = props; // Recebe o 'value' como prop
    const [value, setValue] = useState(externalValue || ""); // Inicializa o estado com o valor externo ou vazio

    useEffect(() => {
        // Atualiza o valor do estado local quando o valor externo muda
        if (externalValue !== undefined) {
            setValue(externalValue);
        }
    }, [externalValue]);

    const handleTimeChange = (event) => {
        const timeValue = event.target.value;

        // Atualiza o estado local com o valor do campo de hora
        setValue(timeValue);

        // Chama a função onChange do componente pai, passando o valor formatado
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: timeValue, // Formato HH:MM já garantido pelo tipo time do input
                },
            });
        }
    };

    return (
        <TextField
            id={id}
            label={label}
            type="time" // Aqui estamos usando o input de tipo time do HTML5
            value={value} // Exibe o valor atual
            onChange={handleTimeChange}
            InputLabelProps={{
                shrink: true,
            }}
            inputProps={{
                step: 300, // Intervalo de 5 minutos
            }}
            sx={{ width: wd }}
        />
    );
}
