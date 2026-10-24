import React, { useState, useEffect } from "react";
import { Campo, Input } from "../../ui/campos";
import { useUid } from "../../../lib/useUid";

export default function DateTime(props) {
    const { id: idExterno, label, name, onChange, wd, value: externalValue } = props;
    const idGerado = useUid("hora");
    const id = idExterno || idGerado;
    const [value, setValue] = useState(externalValue || "");

    useEffect(() => {
        // Atualiza o valor do estado local quando o valor externo muda
        if (externalValue !== undefined) {
            setValue(externalValue);
        }
    }, [externalValue]);

    const handleTimeChange = (event) => {
        const timeValue = event.target.value;
        setValue(timeValue);
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
        <div style={wd ? { width: wd } : undefined}>
            <Campo id={id} label={label}>
                {(p) => <Input {...p} type="time" name={name} value={value} onChange={handleTimeChange} step={300} />}
            </Campo>
        </div>
    );
}
