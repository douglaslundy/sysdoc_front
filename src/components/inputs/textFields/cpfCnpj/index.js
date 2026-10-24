import React from "react";
import InputMask from "react-input-mask";
import { Campo, Input } from "../../../ui/campos";
import { useUid } from "../../../../lib/useUid";

const resolveMask = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length > 11 ? "99.999.999/9999-99" : "999.999.999-99";
};

export default function CpfCnpj(props) {
    const { label, name, value, changeItem, disabled = false, required, className } = props;
    const id = useUid("cpf");
    return (
        <Campo id={id} label={label} obrigatorio={Boolean(required)}>
            {(p) => (
                <InputMask mask={resolveMask(value)} maskChar={null} value={value ? value : ""} onChange={changeItem} disabled={disabled}>
                    {(maskProps) => <Input {...p} {...maskProps} name={name} inputMode="numeric" className={className} />}
                </InputMask>
            )}
        </Campo>
    );
}
