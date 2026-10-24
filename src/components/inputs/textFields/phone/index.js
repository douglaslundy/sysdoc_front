import React from 'react';
import InputMask from 'react-input-mask';
import { Campo, Input } from '../../../ui/campos';
import { useUid } from '../../../../lib/useUid';

export default function Phone(props) {
    const { label, name, value, changeItem, className, ...rest } = props;
    const id = useUid('telefone');
    return (
        <Campo id={id} label={label}>
            {(p) => (
                <InputMask mask="(99) 99999-9999" maskChar={null} value={value ? value : ''} onChange={changeItem} {...rest}>
                    {(maskProps) => <Input {...p} {...maskProps} name={name} inputMode="tel" className={className} />}
                </InputMask>
            )}
        </Campo>
    );
}
