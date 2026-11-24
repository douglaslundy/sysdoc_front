import React from 'react';
import Link from 'next/link';
import OuvidoriaLayout from '../../src/components/ouvidoria/OuvidoriaLayout';
import ConsultaPublica from '../../src/components/ouvidoria/ConsultaPublica';

export default function ConsultaOuvidoria() {
    return (
        <OuvidoriaLayout
            secao="consultar"
            titulo="Consultar manifestação"
            descricao="Protocolo e senha."
            rodape={
                <Link href="/ouvidoria">
                    <a className="text-sm text-primary-text underline-offset-4 hover:underline">Registrar nova manifestação</a>
                </Link>
            }
        >
            <ConsultaPublica />
        </OuvidoriaLayout>
    );
}
