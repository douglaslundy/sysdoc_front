import React from 'react';
import Link from 'next/link';
import AuthCard from '../../src/components/auth/AuthCard';
import ConsultaPublica from '../../src/components/ouvidoria/ConsultaPublica';

const DESTAQUE = {
    titulo: 'Acompanhe sua manifestação',
    texto: 'Informe o protocolo e a senha que você recebeu ao registrar.',
    beneficios: ['Veja o andamento e a resposta oficial.'],
};

export default function ConsultaOuvidoria() {
    return (
        <AuthCard
            titulo="Consultar manifestação"
            descricao="Protocolo e senha."
            destaque={DESTAQUE}
            rodape={
                <Link href="/ouvidoria">
                    <a className="text-sm text-primary-text underline-offset-4 hover:underline">Registrar nova manifestação</a>
                </Link>
            }
        >
            <ConsultaPublica />
        </AuthCard>
    );
}
