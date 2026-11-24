import React from 'react';
import Link from 'next/link';
import OuvidoriaLayout from '../../src/components/ouvidoria/OuvidoriaLayout';
import FormularioPublico from '../../src/components/ouvidoria/FormularioPublico';

export default function OuvidoriaPublica() {
    return (
        <OuvidoriaLayout
            secao="registrar"
            titulo="Nova manifestação"
            descricao="Registre sua manifestação."
            rodape={
                <Link href="/ouvidoria/consulta">
                    <a className="text-sm text-primary-text underline-offset-4 hover:underline">Já registrei: acompanhar minha manifestação</a>
                </Link>
            }
        >
            <FormularioPublico />
        </OuvidoriaLayout>
    );
}
